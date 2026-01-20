import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { triggerGenerate } from '@/lib/n8n'
import type {
  N8nCallbackPayload,
  N8nAnalyzeCallbackPayload,
  N8nGenerateCallbackPayload,
} from '@/types/n8n'
import type { Exam, ExamQuestionInsert, ExamVersionInsert } from '@/types/database'

const N8N_TO_APP_SECRET = process.env.N8N_TO_APP_SECRET!

export async function POST(request: Request) {
  try {
    // Validate secret
    const secretHeader = request.headers.get('X-N8N-SECRET')
    if (secretHeader !== N8N_TO_APP_SECRET) {
      console.error('Invalid n8n secret')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as N8nCallbackPayload
    const supabase = await createServiceClient()

    console.log('Received n8n callback:', payload.event, payload.exam_id)
    console.log('Full payload:', JSON.stringify(payload, null, 2))

    if (payload.event === 'analyze_exam_result') {
      await handleAnalyzeCallback(supabase, payload as N8nAnalyzeCallbackPayload)
    } else if (payload.event === 'generate_exam_versions_result') {
      await handleGenerateCallback(supabase, payload as N8nGenerateCallbackPayload)
    } else {
      console.error('Unknown callback event:', payload)
      return NextResponse.json({ message: 'Unknown event' }, { status: 400 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing n8n callback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleAnalyzeCallback(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  payload: N8nAnalyzeCallbackPayload
) {
  const { exam_id, status, bncc, bloom, reports, extracted } = payload

  if (status === 'ERROR') {
    // Update exam status to FAILED
    await supabase
      .from('exams')
      .update({ status: 'FAILED' } as never)
      .eq('id', exam_id)
    return
  }

  // Fetch complete exam data for auto-generate
  const { data: examData } = await supabase
    .from('exams')
    .select('*')
    .eq('id', exam_id)
    .single()

  const exam = examData as unknown as Exam | null
  if (!exam) {
    console.error('Exam not found:', exam_id)
    return
  }

  // Verificar se DI está selecionado (garantir que é um array válido)
  const selectedConditions = Array.isArray(exam.selected_conditions) 
    ? exam.selected_conditions 
    : []
  const hasDI = selectedConditions.includes('DI')
  
  const hasObjectiveQuestions =
    extracted?.objective_questions && extracted.objective_questions.length > 0

  // IMPORTANTE: Se DI está selecionado, SEMPRE aguardar input do professor
  // Isso garante que o professor possa revisar as questões e indicar respostas
  // mesmo que o N8N não tenha extraído questões objetivas corretamente
  const needsDIInput = hasDI

  // Log detalhado para debug
  console.log('Analyze callback decision:', {
    exam_id,
    hasDI,
    hasObjectiveQuestions,
    needsDIInput,
    selectedConditions,
    extractedQuestionsCount: extracted?.objective_questions?.length || 0
  })

  // Update exam with analysis results
  // If DI is selected, ALWAYS go to WAITING_DI_INPUT to get teacher input
  const nextStatus = needsDIInput ? 'WAITING_DI_INPUT' : 'GENERATING'

  await supabase
    .from('exams')
    .update({
      bncc_code: bncc?.code || null,
      bncc_description: bncc?.description || null,
      bncc_confidence: bncc?.confidence || null,
      bloom_level: bloom?.level || null,
      bloom_confidence: bloom?.confidence || null,
      bncc_bloom_report_md: reports?.bncc_bloom_report_md || null,
      ementa_report_md: reports?.ementa_report_md || null,
      status: nextStatus,
    } as never)
    .eq('id', exam_id)

  // Insert objective questions if extracted
  if (hasObjectiveQuestions) {
    const questionsToInsert: ExamQuestionInsert[] = extracted!.objective_questions!.map((q) => ({
      exam_id: exam_id,
      order_index: q.order,
      prompt: q.prompt,
      options: q.options,
      question_type: 'objective',
      needs_di_answer: hasDI,
    }))

    const { error: questionsError } = await supabase
      .from('exam_questions')
      .insert(questionsToInsert as never[])

    if (questionsError) {
      console.error('Error inserting questions:', questionsError)
    }
  }

  // Auto-trigger generate ONLY if DI is NOT selected
  // When DI is selected, we ALWAYS wait for teacher input
  if (!needsDIInput) {
    console.log('Auto-triggering generate for exam:', exam_id)

    try {
      // Generate signed URL for the PDF
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('exams')
        .createSignedUrl(exam.pdf_path, 3600) // 1 hour

      if (signedUrlError || !signedUrlData) {
        console.error('Error creating signed URL for auto-generate:', signedUrlError)
        await supabase
          .from('exams')
          .update({ status: 'FAILED' } as never)
          .eq('id', exam_id)
        return
      }

      // Fetch user email for the webhook
      const { data: userData } = await supabase.auth.admin.getUserById(exam.user_id)
      const userEmail = userData?.user?.email || ''

      // Build updated exam with BNCC/Bloom from analysis
      const updatedExam: Exam = {
        ...exam,
        bncc_code: bncc?.code || null,
        bncc_description: bncc?.description || null,
        bloom_level: bloom?.level || null,
        status: 'GENERATING',
      }

      // Trigger generate without DI answers
      const ackResponse = await triggerGenerate(
        updatedExam,
        userEmail,
        signedUrlData.signedUrl,
        [] // No DI answers
      )

      // Update exam with n8n run ID
      await supabase
        .from('exams')
        .update({ n8n_generate_run_id: ackResponse.n8n_run_id } as never)
        .eq('id', exam_id)

      console.log('Auto-generate triggered successfully:', ackResponse.n8n_run_id)
    } catch (generateError) {
      console.error('Error auto-triggering generate:', generateError)
      // Don't fail the exam, leave it in GENERATING state
      // The user can retry or check logs
    }
  }
}

async function handleGenerateCallback(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  payload: N8nGenerateCallbackPayload
) {
  const { exam_id, status, versions, qa } = payload

  if (status === 'ERROR') {
    await supabase
      .from('exams')
      .update({ status: 'FAILED' } as never)
      .eq('id', exam_id)
    return
  }

  if (!versions) {
    console.error('No versions in generate callback')
    return
  }

  // Upsert versions
  for (const version of versions) {
    const versionData: ExamVersionInsert = {
      exam_id,
      condition: version.condition,
      status: version.status,
      google_doc_id: version.google_doc_id || null,
      google_doc_url: version.google_doc_url || null,
      limitations: version.limitations || null,
      qa_status: qa?.status || null,
      qa_score: qa?.score || null,
      qa_issues: qa?.issues || null,
    }

    const { error: versionError } = await supabase
      .from('exam_versions')
      .upsert(versionData as never, {
        onConflict: 'exam_id,condition',
      })

    if (versionError) {
      console.error('Error upserting version:', versionError)
    }
  }

  // Determine exam final status
  const anyFailed = versions.some((v) => v.status === 'FAILED')
  const anyPartial = versions.some((v) => v.status === 'PARTIAL')

  let examStatus = 'READY'
  if (anyFailed || anyPartial) {
    examStatus = 'PARTIAL_READY'
  }

  await supabase.from('exams').update({ status: examStatus } as never).eq('id', exam_id)
}
