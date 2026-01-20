export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ExamStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'WAITING_DI_INPUT'
  | 'READY_TO_GENERATE'
  | 'GENERATING'
  | 'READY'
  | 'PARTIAL_READY'
  | 'FAILED'

export type VersionStatus = 'PENDING' | 'READY' | 'PARTIAL' | 'FAILED'

export type Condition =
  | 'DI'
  | 'TEA'
  | 'DISLEXIA'
  | 'DISGRAFIA'
  | 'DISCALCULIA'
  | 'TDAH'

export const CONDITIONS: { value: Condition; label: string; description: string }[] = [
  { value: 'DI', label: 'Deficiência Intelectual', description: 'Adaptação para alunos com deficiência intelectual' },
  { value: 'TEA', label: 'TEA', description: 'Transtorno do Espectro Autista' },
  { value: 'DISLEXIA', label: 'Dislexia', description: 'Dificuldade na leitura' },
  { value: 'DISGRAFIA', label: 'Disgrafia', description: 'Dificuldade na escrita' },
  { value: 'DISCALCULIA', label: 'Discalculia', description: 'Dificuldade com matemática' },
  { value: 'TDAH', label: 'TDAH', description: 'Transtorno de Déficit de Atenção e Hiperatividade' },
]

export type BloomLevel =
  | 'LEMBRAR'
  | 'COMPREENDER'
  | 'APLICAR'
  | 'ANALISAR'
  | 'AVALIAR'
  | 'CRIAR'

export interface QuestionOption {
  key: string
  text: string
}

export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string
          user_id: string
          disciplina: string
          ano_serie: string
          habilidade_hint: string | null
          conhecimento_hint: string | null
          pdf_bucket: string
          pdf_path: string
          bncc_code: string | null
          bncc_description: string | null
          bncc_confidence: number | null
          bloom_level: BloomLevel | null
          bloom_confidence: number | null
          bncc_bloom_report_md: string | null
          ementa_report_md: string | null
          selected_conditions: Condition[]
          status: ExamStatus
          n8n_analysis_run_id: string | null
          n8n_generate_run_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          disciplina: string
          ano_serie: string
          habilidade_hint?: string | null
          conhecimento_hint?: string | null
          pdf_bucket: string
          pdf_path: string
          bncc_code?: string | null
          bncc_description?: string | null
          bncc_confidence?: number | null
          bloom_level?: BloomLevel | null
          bloom_confidence?: number | null
          bncc_bloom_report_md?: string | null
          ementa_report_md?: string | null
          selected_conditions: Condition[]
          status?: ExamStatus
          n8n_analysis_run_id?: string | null
          n8n_generate_run_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          disciplina?: string
          ano_serie?: string
          habilidade_hint?: string | null
          conhecimento_hint?: string | null
          pdf_bucket?: string
          pdf_path?: string
          bncc_code?: string | null
          bncc_description?: string | null
          bncc_confidence?: number | null
          bloom_level?: BloomLevel | null
          bloom_confidence?: number | null
          bncc_bloom_report_md?: string | null
          ementa_report_md?: string | null
          selected_conditions?: Condition[]
          status?: ExamStatus
          n8n_analysis_run_id?: string | null
          n8n_generate_run_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exam_questions: {
        Row: {
          id: string
          exam_id: string
          order_index: number
          prompt: string
          options: QuestionOption[] | null
          question_type: string | null
          needs_di_answer: boolean
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          order_index: number
          prompt: string
          options?: QuestionOption[] | null
          question_type?: string | null
          needs_di_answer?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          order_index?: number
          prompt?: string
          options?: QuestionOption[] | null
          question_type?: string | null
          needs_di_answer?: boolean
          created_at?: string
        }
      }
      di_answers: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          correct_option_key: string
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_id: string
          correct_option_key: string
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_id?: string
          correct_option_key?: string
          created_at?: string
        }
      }
      exam_versions: {
        Row: {
          id: string
          exam_id: string
          condition: Condition
          status: VersionStatus
          google_doc_id: string | null
          google_doc_url: string | null
          limitations: Json | null
          qa_status: string | null
          qa_score: number | null
          qa_issues: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          condition: Condition
          status?: VersionStatus
          google_doc_id?: string | null
          google_doc_url?: string | null
          limitations?: Json | null
          qa_status?: string | null
          qa_score?: number | null
          qa_issues?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          condition?: Condition
          status?: VersionStatus
          google_doc_id?: string | null
          google_doc_url?: string | null
          limitations?: Json | null
          qa_status?: string | null
          qa_score?: number | null
          qa_issues?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      version_ratings: {
        Row: {
          id: string
          version_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          version_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type Exam = Database['public']['Tables']['exams']['Row']
export type ExamInsert = Database['public']['Tables']['exams']['Insert']
export type ExamUpdate = Database['public']['Tables']['exams']['Update']

export type ExamQuestion = Database['public']['Tables']['exam_questions']['Row']
export type ExamQuestionInsert = Database['public']['Tables']['exam_questions']['Insert']

export type DiAnswer = Database['public']['Tables']['di_answers']['Row']
export type DiAnswerInsert = Database['public']['Tables']['di_answers']['Insert']

export type ExamVersion = Database['public']['Tables']['exam_versions']['Row']
export type ExamVersionInsert = Database['public']['Tables']['exam_versions']['Insert']
export type ExamVersionUpdate = Database['public']['Tables']['exam_versions']['Update']

export type VersionRating = Database['public']['Tables']['version_ratings']['Row']
export type VersionRatingInsert = Database['public']['Tables']['version_ratings']['Insert']

// Extended types with relations
export interface ExamWithVersions extends Exam {
  exam_versions: ExamVersion[]
}

export interface ExamWithQuestions extends Exam {
  exam_questions: ExamQuestion[]
}

export interface ExamFull extends Exam {
  exam_versions: ExamVersion[]
  exam_questions: ExamQuestion[]
  di_answers: DiAnswer[]
}
