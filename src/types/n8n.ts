import type { Condition, BloomLevel, QuestionOption } from './database'

// ========================================
// APP -> N8N: ANALYZE
// ========================================
export interface N8nAnalyzePayload {
  event: 'analyze_exam'
  exam_id: string
  user: {
    id: string
    email: string
  }
  metadata: {
    disciplina: string
    ano_serie: string
    habilidade_hint?: string | null
    conhecimento_hint?: string | null
  }
  selected_conditions: Condition[]
  pdf: {
    storage_bucket: string
    storage_path: string
    signed_url: string
  }
  callback: {
    url: string
    secret_header_name: string
  }
}

export interface N8nAckResponse {
  accepted: boolean
  exam_id: string
  n8n_run_id: string
}

// ========================================
// N8N -> APP: ANALYZE CALLBACK
// ========================================
export interface N8nAnalyzeCallbackPayload {
  event: 'analyze_exam_result'
  exam_id: string
  status: 'OK' | 'ERROR'
  error_message?: string
  bncc?: {
    code: string
    description: string
    confidence?: number
  }
  bloom?: {
    level: BloomLevel
    confidence?: number
  }
  reports?: {
    bncc_bloom_report_md?: string
    ementa_report_md?: string
  }
  extracted?: {
    objective_questions?: {
      question_id: string
      order: number
      prompt: string
      options: QuestionOption[]
    }[]
  }
  warnings?: {
    code: string
    message: string
  }[]
}

// ========================================
// APP -> N8N: GENERATE
// ========================================
export interface N8nGeneratePayload {
  event: 'generate_exam_versions'
  exam_id: string
  user: {
    email: string
  }
  selected_conditions: Condition[]
  metadata: {
    disciplina: string
    ano_serie: string
    habilidade_hint?: string | null
    conhecimento_hint?: string | null
  }
  bncc?: {
    code: string
    description?: string
  }
  bloom?: {
    level: BloomLevel
  }
  di_answers?: {
    question_id: string
    correct_option_key: string
  }[]
  pdf: {
    signed_url: string
  }
  callback: {
    url: string
    secret_header_name: string
  }
}

// ========================================
// N8N -> APP: GENERATE CALLBACK
// ========================================
export interface VersionResult {
  condition: Condition
  status: 'READY' | 'PARTIAL' | 'FAILED'
  google_doc_id?: string
  google_doc_url?: string
  limitations?: {
    code: string
    message: string
  }[]
}

export interface QaResult {
  status: 'OK' | 'WARN' | 'FAIL'
  score?: number
  issues?: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    code: string
    message: string
  }[]
}

export interface N8nGenerateCallbackPayload {
  event: 'generate_exam_versions_result'
  exam_id: string
  status: 'OK' | 'ERROR'
  error_message?: string
  versions?: VersionResult[]
  qa?: QaResult
}

// Union type for all callback events
export type N8nCallbackPayload = N8nAnalyzeCallbackPayload | N8nGenerateCallbackPayload
