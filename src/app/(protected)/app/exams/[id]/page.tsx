import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, ExternalLink, FileDown, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExamStatusBadge, VersionStatusBadge } from '@/components/status-badge'
import { DiAnswersForm } from '@/components/exams/di-answers-form'
import { VersionCard } from '@/components/exams/version-card'
import { ExamStatusStepper } from '@/components/exams/exam-status-stepper'
import { formatDateTime } from '@/lib/utils'
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

  // Check if DI is selected to show appropriate stepper
  const hasDI = typedExam.selected_conditions.includes('DI')

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back link */}
      <Button variant="ghost" asChild>
        <Link href="/app">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{typedExam.disciplina}</h1>
            <p className="text-lg text-muted-foreground">{typedExam.ano_serie}</p>
          </div>
          <ExamStatusBadge status={typedExam.status} />
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDateTime(typedExam.created_at)}
          </div>
          {typedExam.bncc_code && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              {typedExam.bncc_code}
            </div>
          )}
        </div>

        {/* Selected conditions */}
        <div className="flex flex-wrap gap-2">
          {typedExam.selected_conditions.map((condition) => (
            <Badge key={condition} variant="outline">
              {condition}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Stepper - adapts based on whether DI is selected */}
      <ExamStatusStepper status={typedExam.status} hasDI={hasDI} />

      {/* BNCC & Bloom Info */}
      {(typedExam.bncc_code || typedExam.bloom_level) && (
        <Card>
          <CardHeader>
            <CardTitle>Análise BNCC & Bloom</CardTitle>
            <CardDescription>
              Identificação automática da habilidade e nível cognitivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {typedExam.bncc_code && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Código BNCC</p>
                  <p className="font-semibold">{typedExam.bncc_code}</p>
                  {typedExam.bncc_description && (
                    <p className="text-sm text-muted-foreground">{typedExam.bncc_description}</p>
                  )}
                  {typedExam.bncc_confidence && (
                    <Badge variant="secondary" className="text-xs">
                      Confiança: {Math.round(typedExam.bncc_confidence * 100)}%
                    </Badge>
                  )}
                </div>
              )}

              {typedExam.bloom_level && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nível de Bloom</p>
                  <p className="font-semibold">{typedExam.bloom_level}</p>
                  {typedExam.bloom_confidence && (
                    <Badge variant="secondary" className="text-xs">
                      Confiança: {Math.round(typedExam.bloom_confidence * 100)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {typedExam.bncc_bloom_report_md && (
              <>
                <Separator />
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm">{typedExam.bncc_bloom_report_md}</pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ementa */}
      {typedExam.ementa_report_md && (
        <Card>
          <CardHeader>
            <CardTitle>Ementa Sugerida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm">{typedExam.ementa_report_md}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DI Answers Form (when status is WAITING_DI_INPUT) */}
      {typedExam.status === 'WAITING_DI_INPUT' &&
        typedExam.exam_questions &&
        typedExam.exam_questions.length > 0 && (
          <DiAnswersForm
            examId={typedExam.id}
            questions={typedExam.exam_questions}
            existingAnswers={typedExam.di_answers || []}
          />
        )}

      {/* Versions (when available) */}
      {(typedExam.status === 'READY' || typedExam.status === 'PARTIAL_READY') &&
        typedExam.exam_versions &&
        typedExam.exam_versions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Versões Adaptadas</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {typedExam.exam_versions.map((version) => (
                <VersionCard key={version.id} version={version} />
              ))}
            </div>
          </div>
        )}

      {/* Loading states - includes READY_TO_GENERATE as it transitions immediately to GENERATING */}
      {(typedExam.status === 'ANALYZING' || 
        typedExam.status === 'GENERATING' || 
        typedExam.status === 'READY_TO_GENERATE') && (
        <Card className="border-primary/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/30" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">
              {typedExam.status === 'ANALYZING' ? 'Analisando prova...' : 'Gerando versões...'}
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              {typedExam.status === 'ANALYZING'
                ? 'Estamos identificando BNCC, Bloom e estrutura da prova.'
                : 'Estamos criando as versões adaptadas no Google Docs.'}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Atualize a página em alguns instantes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {typedExam.status === 'FAILED' && (
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="mt-4 font-semibold text-destructive">
              Ocorreu um erro no processamento
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre em contato com o suporte ou tente novamente com outro PDF.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
