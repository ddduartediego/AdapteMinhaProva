import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { VersionRatingInsert } from '@/types/database'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    // Get request body
    const { rating, comment } = (await request.json()) as {
      rating: number
      comment?: string
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Avaliação deve ser entre 1 e 5' },
        { status: 400 }
      )
    }

    // Verify version exists and belongs to user's exam
    const { data: version, error: versionError } = await supabase
      .from('exam_versions')
      .select('exam_id, exams!inner(user_id)')
      .eq('id', versionId)
      .single()

    if (versionError || !version) {
      return NextResponse.json(
        { message: 'Versão não encontrada' },
        { status: 404 }
      )
    }

    // Upsert rating
    const ratingData: VersionRatingInsert = {
      version_id: versionId,
      user_id: user.id,
      rating,
      comment: comment || null,
    }

    const { error: upsertError } = await supabase.from('version_ratings').upsert(
      ratingData as never,
      {
        onConflict: 'version_id,user_id',
      }
    )

    if (upsertError) {
      console.error('Error upserting rating:', upsertError)
      return NextResponse.json(
        { message: 'Erro ao salvar avaliação' },
        { status: 500 }
      )
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
