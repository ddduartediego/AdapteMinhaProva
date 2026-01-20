-- =====================================================
-- Adapte Minha Prova - Initial Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS (for type safety)
-- =====================================================

CREATE TYPE exam_status AS ENUM (
  'UPLOADED',
  'ANALYZING',
  'WAITING_DI_INPUT',
  'GENERATING',
  'READY',
  'PARTIAL_READY',
  'FAILED'
);

CREATE TYPE version_status AS ENUM (
  'PENDING',
  'READY',
  'PARTIAL',
  'FAILED'
);

CREATE TYPE condition_type AS ENUM (
  'DI',
  'TEA',
  'DISLEXIA',
  'DISGRAFIA',
  'DISCALCULIA',
  'TDAH'
);

CREATE TYPE bloom_level AS ENUM (
  'LEMBRAR',
  'COMPREENDER',
  'APLICAR',
  'ANALISAR',
  'AVALIAR',
  'CRIAR'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Exams table (main table)
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata provided by teacher
  disciplina TEXT NOT NULL,
  ano_serie TEXT NOT NULL,
  habilidade_hint TEXT,
  conhecimento_hint TEXT,
  
  -- PDF storage
  pdf_bucket TEXT NOT NULL DEFAULT 'exams',
  pdf_path TEXT NOT NULL,
  
  -- Analysis results (from n8n)
  bncc_code TEXT,
  bncc_description TEXT,
  bncc_confidence NUMERIC,
  bloom_level TEXT,
  bloom_confidence NUMERIC,
  
  -- Reports (markdown)
  bncc_bloom_report_md TEXT,
  ementa_report_md TEXT,
  
  -- Selected conditions for adaptation
  selected_conditions TEXT[] NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'UPLOADED',
  
  -- n8n run tracking
  n8n_analysis_run_id TEXT,
  n8n_generate_run_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_disciplina ON exams(disciplina);
CREATE INDEX idx_exams_created_at ON exams(created_at DESC);

-- Exam questions (extracted by n8n)
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  order_index INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB, -- Array of {key, text}
  question_type TEXT,
  needs_di_answer BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);

-- DI answers (teacher input for correct answers)
CREATE TABLE di_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  
  correct_option_key TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(exam_id, question_id)
);

CREATE INDEX idx_di_answers_exam_id ON di_answers(exam_id);

-- Exam versions (generated adaptations)
CREATE TABLE exam_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  condition TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Google Docs
  google_doc_id TEXT,
  google_doc_url TEXT,
  
  -- Limitations (for PARTIAL status)
  limitations JSONB,
  
  -- QA results
  qa_status TEXT,
  qa_score NUMERIC,
  qa_issues JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(exam_id, condition)
);

CREATE INDEX idx_exam_versions_exam_id ON exam_versions(exam_id);

-- Version ratings (teacher feedback)
CREATE TABLE version_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES exam_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(version_id, user_id)
);

CREATE INDEX idx_version_ratings_version_id ON version_ratings(version_id);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_versions_updated_at
  BEFORE UPDATE ON exam_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE di_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_ratings ENABLE ROW LEVEL SECURITY;

-- Exams: Users can only access their own exams
CREATE POLICY "Users can view their own exams"
  ON exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams"
  ON exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams"
  ON exams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams"
  ON exams FOR DELETE
  USING (auth.uid() = user_id);

-- Exam questions: Access through exam ownership
CREATE POLICY "Users can view questions of their exams"
  ON exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions for their exams"
  ON exam_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_questions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- DI answers: Access through exam ownership
CREATE POLICY "Users can view DI answers of their exams"
  ON di_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = di_answers.exam_id
      AND exams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert DI answers for their exams"
  ON di_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = di_answers.exam_id
      AND exams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update DI answers for their exams"
  ON di_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = di_answers.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- Exam versions: Access through exam ownership
CREATE POLICY "Users can view versions of their exams"
  ON exam_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_versions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions for their exams"
  ON exam_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_versions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update versions of their exams"
  ON exam_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_versions.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- Version ratings: Users can only manage their own ratings
CREATE POLICY "Users can view ratings"
  ON version_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_versions
      JOIN exams ON exams.id = exam_versions.exam_id
      WHERE exam_versions.id = version_ratings.version_id
      AND exams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ratings"
  ON version_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON version_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON version_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SERVICE ROLE POLICIES (for n8n callbacks)
-- =====================================================

-- These allow the service role to bypass RLS
-- Service role key should only be used server-side

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

-- Note: Run this in Supabase Dashboard > Storage
-- Or use the Supabase CLI

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('exams', 'exams', false);

-- CREATE POLICY "Users can upload PDFs to their folder"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'exams' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can view their own PDFs"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'exams' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
