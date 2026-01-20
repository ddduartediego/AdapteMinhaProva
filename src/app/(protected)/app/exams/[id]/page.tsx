import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamDetailClient } from '@/components/exams/exam-detail-client'
import type { ExamFull } from '@/types/database'

interface ExamDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch exam with all related data
  const { data: exam, error } = await supabase
    .from('exams')
    .select(`
      *,
      exam_versions(*),
      exam_questions(*),
      di_answers(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !exam) {
    notFound()
  }

  const typedExam = exam as ExamFull

  // Render the client component with initial data
  // The client component will handle realtime updates
  return <ExamDetailClient initialExam={typedExam} />
}
