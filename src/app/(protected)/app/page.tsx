import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ExamsList } from '@/components/exams/exams-list'
import { ExamsFilters } from '@/components/exams/exams-filters'
import { Spinner } from '@/components/ui/spinner'
import type { ExamWithVersions } from '@/types/database'

interface DashboardPageProps {
  searchParams: Promise<{
    disciplina?: string
    ano_serie?: string
    habilidade?: string
    busca?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Build query with filters
  let query = supabase
    .from('exams')
    .select('*, exam_versions(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (params.disciplina) {
    query = query.eq('disciplina', params.disciplina)
  }

  if (params.ano_serie) {
    query = query.eq('ano_serie', params.ano_serie)
  }

  if (params.habilidade) {
    query = query.or(
      `bncc_code.ilike.%${params.habilidade}%,habilidade_hint.ilike.%${params.habilidade}%`
    )
  }

  if (params.busca) {
    query = query.or(
      `disciplina.ilike.%${params.busca}%,conhecimento_hint.ilike.%${params.busca}%`
    )
  }

  const { data: examsData } = await query

  // Se houver erro ou não houver dados, tratamos como lista vazia
  // Isso garante uma boa UX no primeiro login ou em caso de tabelas não configuradas
  const exams = (examsData || []) as unknown as ExamWithVersions[]

  // Get unique disciplines and anos for filters
  const { data: filterOptionsData } = await supabase
    .from('exams')
    .select('disciplina, ano_serie')
    .eq('user_id', user.id)

  const filterOptions = (filterOptionsData || []) as { disciplina: string; ano_serie: string }[]
  const disciplines = [...new Set(filterOptions.map((e) => e.disciplina))]
  const anos = [...new Set(filterOptions.map((e) => e.ano_serie))]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Provas</h1>
          <p className="text-muted-foreground">
            Gerencie suas provas adaptadas
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/app/new">
            <Plus className="mr-2 h-5 w-5" />
            Nova adaptação
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ExamsFilters
        disciplines={disciplines}
        anos={anos}
        currentFilters={params}
      />

      {/* Exams List */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <ExamsList exams={exams} />
      </Suspense>
    </div>
  )
}
