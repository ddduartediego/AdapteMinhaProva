import type { N8nAnalyzePayload, N8nGeneratePayload, N8nAckResponse } from '@/types/n8n'
import type { Exam, DiAnswer } from '@/types/database'

const N8N_ANALYZE_WEBHOOK_URL = process.env.N8N_ANALYZE_WEBHOOK_URL!
const N8N_GENERATE_WEBHOOK_URL = process.env.N8N_GENERATE_WEBHOOK_URL!
const APP_TO_N8N_SECRET = process.env.APP_TO_N8N_SECRET!
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function triggerAnalyze(
  exam: Exam,
  userEmail: string,
  signedUrl: string
): Promise<N8nAckResponse> {
  const payload: N8nAnalyzePayload = {
    event: 'analyze_exam',
    exam_id: exam.id,
    user: {
      id: exam.user_id,
      email: userEmail,
    },
    metadata: {
      disciplina: exam.disciplina,
      ano_serie: exam.ano_serie,
      habilidade_hint: exam.habilidade_hint,
      conhecimento_hint: exam.conhecimento_hint,
    },
    selected_conditions: exam.selected_conditions,
    pdf: {
      storage_bucket: exam.pdf_bucket,
      storage_path: exam.pdf_path,
      signed_url: signedUrl,
    },
    callback: {
      url: `${NEXT_PUBLIC_APP_URL}/api/n8n/callback`,
      secret_header_name: 'X-N8N-SECRET',
    },
  }

  const response = await fetch(N8N_ANALYZE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-SECRET': APP_TO_N8N_SECRET,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`n8n analyze failed: ${response.status}`)
  }

  return response.json()
}

export async function triggerGenerate(
  exam: Exam,
  userEmail: string,
  signedUrl: string,
  diAnswers: { question_id: string; correct_option_key: string }[]
): Promise<N8nAckResponse> {
  const payload: N8nGeneratePayload = {
    event: 'generate_exam_versions',
    exam_id: exam.id,
    user: {
      email: userEmail,
    },
    selected_conditions: exam.selected_conditions,
    metadata: {
      disciplina: exam.disciplina,
      ano_serie: exam.ano_serie,
      habilidade_hint: exam.habilidade_hint,
      conhecimento_hint: exam.conhecimento_hint,
    },
    bncc: exam.bncc_code
      ? {
          code: exam.bncc_code,
          description: exam.bncc_description || undefined,
        }
      : undefined,
    bloom: exam.bloom_level
      ? {
          level: exam.bloom_level,
        }
      : undefined,
    di_answers: diAnswers.length > 0 ? diAnswers : undefined,
    pdf: {
      signed_url: signedUrl,
    },
    callback: {
      url: `${NEXT_PUBLIC_APP_URL}/api/n8n/callback`,
      secret_header_name: 'X-N8N-SECRET',
    },
  }

  console.log('Triggering n8n generate webhook:', N8N_GENERATE_WEBHOOK_URL)
  console.log('Generate payload:', JSON.stringify(payload, null, 2))

  const response = await fetch(N8N_GENERATE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-SECRET': APP_TO_N8N_SECRET,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('n8n generate error response:', errorText)
    throw new Error(`n8n generate failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}
