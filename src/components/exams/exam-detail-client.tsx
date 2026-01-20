'use client'

import { useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Tag, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExamStatusBadge } from '@/components/status-badge'
import { DiAnswersForm } from '@/components/exams/di-answers-form'
import { VersionCard } from '@/components/exams/version-card'
import { ExamStatusStepper } from '@/components/exams/exam-status-stepper'
import { useExamPolling } from '@/hooks/use-exam-realtime'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import type { ExamFull, ExamStatus } from '@/types/database'

interface ExamDetailClientProps {
  initialExam: ExamFull
}

export function ExamDetailClient({ initialExam }: ExamDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [exam, setExam] = useState<ExamFull>(initialExam)
  const [isPending, startTransition] = useTransition()

  // Check if DI is selected to show appropriate stepper
  const hasDI = exam.selected_conditions.includes('DI')

  // Verificar se está em estado de processamento (precisa de polling)
  const isProcessing =
    exam.status === 'ANALYZING' ||
    exam.status === 'GENERATING' ||
    exam.status === 'READY_TO_GENERATE'

  // Callback quando o status muda
  const handleStatusChange = useCallback(
    (newStatus: ExamStatus, oldStatus: ExamStatus) => {
      // Mostrar toast para estados finais
      if (
        newStatus === 'READY' ||
        newStatus === 'PARTIAL_READY' ||
        newStatus === 'WAITING_DI_INPUT' ||
        newStatus === 'FAILED'
      ) {
        const messages: Record<string, { title: string; description: string; variant: 'default' | 'success' | 'destructive' }> = {
          READY: {
            title: 'Pronto!',
            description: 'Suas versões adaptadas estão prontas!',
            variant: 'success',
          },
          PARTIAL_READY: {
            title: 'Parcialmente pronto',
            description: 'Versões geradas com algumas limitações.',
            variant: 'default',
          },
          WAITING_DI_INPUT: {
            title: 'Análise concluída',
            description: 'Preencha as respostas corretas para DI.',
            variant: 'default',
          },
          FAILED: {
            title: 'Erro',
            description: 'Ocorreu um erro no processamento.',
            variant: 'destructive',
          },
        }

        const msg = messages[newStatus]
        if (msg) {
          toast({
            title: msg.title,
            description: msg.description,
            variant: msg.variant,
          })
        }
      }

      // Atualizar dados via router.refresh
      startTransition(() => {
        router.refresh()
      })
    },
    [router, toast]
  )

  // Ativar polling apenas quando está processando
  useExamPolling({
    examId: exam.id,
    onStatusChange: handleStatusChange,
    interval: 3000,
    enabled: isProcessing,
  })

  // Atualizar estado local quando os dados são refetchados pelo server
  if (initialExam.updated_at !== exam.updated_at) {
    setExam(initialExam)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/app">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        {/* Indicador de atualização automática */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </div>
            <span>Atualizando automaticamente</span>
            {isPending && <RefreshCw className="h-3 w-3 animate-spin" />}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{exam.disciplina}</h1>
            <p className="text-lg text-muted-foreground">{exam.ano_serie}</p>
          </div>
          <ExamStatusBadge status={exam.status} />
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDateTime(exam.created_at)}
          </div>
          {exam.bncc_code && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              {exam.bncc_code}
            </div>
          )}
        </div>

        {/* Selected conditions */}
        <div className="flex flex-wrap gap-2">
          {exam.selected_conditions.map((condition) => (
            <Badge key={condition} variant="outline">
              {condition}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Stepper - adapts based on whether DI is selected */}
      <ExamStatusStepper status={exam.status} hasDI={hasDI} />

      {/* BNCC & Bloom Info */}
      {(exam.bncc_code || exam.bloom_level) && (
        <Card>
          <CardHeader>
            <CardTitle>Análise BNCC & Bloom</CardTitle>
            <CardDescription>
              Identificação automática da habilidade e nível cognitivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {exam.bncc_code && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Código BNCC</p>
                  <p className="font-semibold">{exam.bncc_code}</p>
                  {exam.bncc_description && (
                    <p className="text-sm text-muted-foreground">{exam.bncc_description}</p>
                  )}
                  {exam.bncc_confidence && (
                    <Badge variant="secondary" className="text-xs">
                      Confiança: {Math.round(exam.bncc_confidence * 100)}%
                    </Badge>
                  )}
                </div>
              )}

              {exam.bloom_level && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nível de Bloom</p>
                  <p className="font-semibold">{exam.bloom_level}</p>
                  {exam.bloom_confidence && (
                    <Badge variant="secondary" className="text-xs">
                      Confiança: {Math.round(exam.bloom_confidence * 100)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {exam.bncc_bloom_report_md && (
              <>
                <Separator />
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm">{exam.bncc_bloom_report_md}</pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ementa */}
      {exam.ementa_report_md && (
        <Card>
          <CardHeader>
            <CardTitle>Ementa Sugerida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm">{exam.ementa_report_md}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DI Answers Form (when status is WAITING_DI_INPUT) */}
      {exam.status === 'WAITING_DI_INPUT' &&
        exam.exam_questions &&
        exam.exam_questions.length > 0 && (
          <DiAnswersForm
            examId={exam.id}
            questions={exam.exam_questions}
            existingAnswers={exam.di_answers || []}
          />
        )}

      {/* Versions (when available) */}
      {(exam.status === 'READY' || exam.status === 'PARTIAL_READY') &&
        exam.exam_versions &&
        exam.exam_versions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Versões Adaptadas</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {exam.exam_versions.map((version) => (
                <VersionCard key={version.id} version={version} />
              ))}
            </div>
          </div>
        )}

      {/* Loading states */}
      {isProcessing && (
        <Card className="border-primary/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/30" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">
              {exam.status === 'ANALYZING' ? 'Analisando prova...' : 'Gerando versões...'}
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              {exam.status === 'ANALYZING'
                ? 'Estamos identificando BNCC, Bloom e estrutura da prova.'
                : 'Estamos criando as versões adaptadas no Google Docs.'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-primary">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </div>
              <span>Esta página atualiza automaticamente</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {exam.status === 'FAILED' && (
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
