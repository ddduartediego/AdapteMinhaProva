import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { triggerAnalyze } from '@/lib/n8n'
import type { Condition, Exam, ExamInsert } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const serviceSupabase = await createServiceClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const disciplina = formData.get('disciplina') as string
    const anoSerie = formData.get('ano_serie') as string
    const habilidadeHint = formData.get('habilidade_hint') as string | null
    const conhecimentoHint = formData.get('conhecimento_hint') as string | null
    const selectedConditionsJson = formData.get('selected_conditions') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json({ message: 'PDF obrigatório' }, { status: 400 })
    }

    if (!disciplina || !anoSerie) {
      return NextResponse.json(
        { message: 'Disciplina e ano/série são obrigatórios' },
        { status: 400 }
      )
    }

    let selectedConditions: Condition[]
    try {
      selectedConditions = JSON.parse(selectedConditionsJson)
    } catch {
      return NextResponse.json(
        { message: 'Condições inválidas' },
        { status: 400 }
      )
    }

    if (selectedConditions.length === 0) {
      return NextResponse.json(
        { message: 'Selecione pelo menos uma condição' },
        { status: 400 }
      )
    }

    // Create exam record first (to get ID for storage path)
    const insertData: ExamInsert = {
      user_id: user.id,
      disciplina,
      ano_serie: anoSerie,
      habilidade_hint: habilidadeHint || null,
      conhecimento_hint: conhecimentoHint || null,
      pdf_bucket: 'exams',
      pdf_path: '', // Will update after upload
      selected_conditions: selectedConditions,
      status: 'UPLOADED',
    }

    const { data: exam, error: insertError } = await supabase
      .from('exams')
      .insert(insertData as never)
      .select()
      .single()

    if (insertError || !exam) {
      console.error('Error creating exam:', insertError)
      return NextResponse.json(
        { message: 'Erro ao criar prova' },
        { status: 500 }
      )
    }

    const typedExam = exam as unknown as Exam

    // Upload PDF to storage
    const pdfPath = `${user.id}/${typedExam.id}/original.pdf`
    const { error: uploadError } = await serviceSupabase.storage
      .from('exams')
      .upload(pdfPath, file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      // Delete the exam record if upload fails
      await supabase.from('exams').delete().eq('id', typedExam.id)
      return NextResponse.json(
        { message: 'Erro ao fazer upload do PDF' },
        { status: 500 }
      )
    }

    // Update exam with PDF path
    const { error: updateError } = await supabase
      .from('exams')
      .update({ pdf_path: pdfPath, status: 'ANALYZING' } as never)
      .eq('id', typedExam.id)

    if (updateError) {
      console.error('Error updating exam:', updateError)
    }

    // Generate signed URL for n8n
    const { data: signedUrlData, error: signedUrlError } = await serviceSupabase.storage
      .from('exams')
      .createSignedUrl(pdfPath, 3600) // 1 hour

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { message: 'Erro ao gerar URL do PDF' },
        { status: 500 }
      )
    }

    // Trigger n8n analyze
    try {
      const ackResponse = await triggerAnalyze(
        { ...typedExam, pdf_path: pdfPath, status: 'ANALYZING' },
        user.email || '',
        signedUrlData.signedUrl
      )

      // Update exam with n8n run ID
      await supabase
        .from('exams')
        .update({ n8n_analysis_run_id: ackResponse.n8n_run_id } as never)
        .eq('id', typedExam.id)
    } catch (n8nError) {
      console.error('Error triggering n8n:', n8nError)
      // Don't fail the request, just log it
      // The exam is still created and can be retried
    }

    return NextResponse.json({ exam_id: typedExam.id }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const disciplina = searchParams.get('disciplina')
    const anoSerie = searchParams.get('ano_serie')
    const habilidade = searchParams.get('habilidade')

    let query = supabase
      .from('exams')
      .select('*, exam_versions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (disciplina) {
      query = query.eq('disciplina', disciplina)
    }

    if (anoSerie) {
      query = query.eq('ano_serie', anoSerie)
    }

    if (habilidade) {
      query = query.or(
        `bncc_code.ilike.%${habilidade}%,habilidade_hint.ilike.%${habilidade}%`
      )
    }

    const { data: exams, error } = await query

    if (error) {
      console.error('Error fetching exams:', error)
      return NextResponse.json(
        { message: 'Erro ao buscar provas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
