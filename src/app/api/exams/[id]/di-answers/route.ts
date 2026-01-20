import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { triggerGenerate } from '@/lib/n8n'
import type { Exam } from '@/types/database'

interface DiAnswerInput {
  question_id: string
  correct_option_key: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    // Get request body
    const { di_answers } = (await request.json()) as { di_answers: DiAnswerInput[] }

    if (!di_answers || !Array.isArray(di_answers)) {
      return NextResponse.json(
        { message: 'Respostas inválidas' },
        { status: 400 }
      )
    }

    // Verify exam belongs to user and is in correct status
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('user_id', user.id)
      .single()

    if (examError || !examData) {
      return NextResponse.json(
        { message: 'Prova não encontrada' },
        { status: 404 }
      )
    }

    const exam = examData as unknown as Exam

    if (exam.status !== 'WAITING_DI_INPUT') {
      return NextResponse.json(
        { message: 'Status inválido para esta operação' },
        { status: 400 }
      )
    }

    // Insert or update DI answers
    for (const answer of di_answers) {
      const { error: upsertError } = await supabase
        .from('di_answers')
        .upsert(
          {
            exam_id: examId,
            question_id: answer.question_id,
            correct_option_key: answer.correct_option_key,
          } as never,
          {
            onConflict: 'exam_id,question_id',
          }
        )

      if (upsertError) {
        console.error('Error upserting DI answer:', upsertError)
      }
    }

    // Update exam status to GENERATING
    const { error: updateError } = await supabase
      .from('exams')
      .update({ status: 'GENERATING' } as never)
      .eq('id', examId)

    if (updateError) {
      console.error('Error updating exam status:', updateError)
    }

    // Generate signed URL for n8n
    const { data: signedUrlData, error: signedUrlError } = await serviceSupabase.storage
      .from('exams')
      .createSignedUrl(exam.pdf_path, 3600) // 1 hour

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { message: 'Erro ao gerar URL do PDF' },
        { status: 500 }
      )
    }

    // Trigger n8n generate
    try {
      const ackResponse = await triggerGenerate(
        { ...exam, status: 'GENERATING' },
        user.email || '',
        signedUrlData.signedUrl,
        di_answers.map((a) => ({
          question_id: a.question_id,
          correct_option_key: a.correct_option_key,
        }))
      )

      // Update exam with n8n run ID
      await supabase
        .from('exams')
        .update({ n8n_generate_run_id: ackResponse.n8n_run_id } as never)
        .eq('id', examId)
    } catch (n8nError) {
      console.error('Error triggering n8n generate:', n8nError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
