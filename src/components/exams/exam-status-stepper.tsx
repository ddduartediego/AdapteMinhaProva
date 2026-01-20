import { Check, Clock, FileSearch, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExamStatus } from '@/types/database'

interface ExamStatusStepperProps {
  status: ExamStatus
  hasDI?: boolean
}

// Steps when DI is selected (full flow with DI input)
const stepsWithDI = [
  { key: 'UPLOADED', label: 'Enviado', icon: Clock },
  { key: 'ANALYZING', label: 'Analisando', icon: FileSearch },
  { key: 'WAITING_DI_INPUT', label: 'Aguardando DI', icon: Clock },
  { key: 'GENERATING', label: 'Gerando', icon: Sparkles },
  { key: 'READY', label: 'Pronto', icon: Check },
]

// Steps when DI is NOT selected (simplified flow)
const stepsWithoutDI = [
  { key: 'UPLOADED', label: 'Enviado', icon: Clock },
  { key: 'ANALYZING', label: 'Analisando', icon: FileSearch },
  { key: 'GENERATING', label: 'Gerando', icon: Sparkles },
  { key: 'READY', label: 'Pronto', icon: Check },
]

const statusOrderWithDI: ExamStatus[] = [
  'UPLOADED',
  'ANALYZING',
  'WAITING_DI_INPUT',
  'GENERATING',
  'READY',
]

const statusOrderWithoutDI: ExamStatus[] = [
  'UPLOADED',
  'ANALYZING',
  'GENERATING',
  'READY',
]

export function ExamStatusStepper({ status, hasDI = true }: ExamStatusStepperProps) {
  const steps = hasDI ? stepsWithDI : stepsWithoutDI
  const statusOrder = hasDI ? statusOrderWithDI : statusOrderWithoutDI

  // Map READY_TO_GENERATE to GENERATING for display purposes
  // (it's a transitional state that immediately goes to GENERATING)
  const displayStatus = status === 'READY_TO_GENERATE' ? 'GENERATING' : status

  const currentIndex = statusOrder.indexOf(displayStatus)
  const isPartial = status === 'PARTIAL_READY'
  const isFailed = status === 'FAILED'

  // For PARTIAL_READY, show as READY but with warning
  const effectiveIndex = isPartial ? statusOrder.indexOf('READY') : currentIndex

  // Handle edge case where status is not in the order array
  const safeEffectiveIndex = effectiveIndex >= 0 ? effectiveIndex : steps.length - 1

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute left-0 top-5 h-0.5 w-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500',
            isFailed ? 'bg-destructive' : 'bg-primary'
          )}
          style={{
            width: isFailed
              ? `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`
              : `${(safeEffectiveIndex / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = safeEffectiveIndex > index
          const isCurrent = safeEffectiveIndex === index
          const isLoading =
            isCurrent && (displayStatus === 'ANALYZING' || displayStatus === 'GENERATING')
          const Icon = isLoading ? Loader2 : step.icon

          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-colors',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && !isFailed && 'border-primary text-primary',
                  isCurrent && isFailed && 'border-destructive text-destructive',
                  !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isLoading && 'animate-spin')} />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isCompleted && 'text-primary',
                  isCurrent && !isFailed && 'text-foreground',
                  isCurrent && isFailed && 'text-destructive',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
