-- =====================================================
-- Adapte Minha Prova - Enable Realtime
-- =====================================================
-- This migration enables Supabase Realtime for the exams
-- and exam_versions tables, allowing the frontend to receive
-- real-time updates when the n8n callback updates the database.

-- =====================================================
-- ENABLE REPLICA IDENTITY FULL
-- =====================================================
-- This is required for Realtime to send the full row data
-- on UPDATE events (not just the changed columns)

ALTER TABLE exams REPLICA IDENTITY FULL;
ALTER TABLE exam_versions REPLICA IDENTITY FULL;
ALTER TABLE exam_questions REPLICA IDENTITY FULL;

-- =====================================================
-- ADD TABLES TO REALTIME PUBLICATION
-- =====================================================
-- The supabase_realtime publication is automatically created
-- by Supabase. We just need to add our tables to it.

-- Check if publication exists and add tables
DO $$
BEGIN
  -- Add exams table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'exams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE exams;
  END IF;

  -- Add exam_versions table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'exam_versions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE exam_versions;
  END IF;

  -- Add exam_questions table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'exam_questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE exam_questions;
  END IF;
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- After running this migration, the frontend can subscribe
-- to changes on these tables using Supabase Realtime:
--
-- supabase
--   .channel('exam-updates')
--   .on('postgres_changes', {
--     event: 'UPDATE',
--     schema: 'public',
--     table: 'exams',
--     filter: 'id=eq.<exam_id>'
--   }, callback)
--   .subscribe()
--
-- RLS policies still apply - users will only receive
-- updates for rows they have access to.
