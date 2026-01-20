import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { ExamStatus, VersionStatus } from '@/types/database'

const examStatusConfig: Record<ExamStatus, { label: string; variant: BadgeProps['variant'] }> = {
  UPLOADED: { label: 'Enviado', variant: 'secondary' },
  ANALYZING: { label: 'Analisando', variant: 'analyzing' },
  WAITING_DI_INPUT: { label: 'Aguardando DI', variant: 'waiting' },
  // READY_TO_GENERATE é um estado transitório que dispara automaticamente a geração
  // Para o usuário, é exibido como "Gerando" para melhor UX
  READY_TO_GENERATE: { label: 'Gerando', variant: 'generating' },
  GENERATING: { label: 'Gerando', variant: 'generating' },
  READY: { label: 'Pronto', variant: 'ready' },
  PARTIAL_READY: { label: 'Parcial', variant: 'partial' },
  FAILED: { label: 'Falhou', variant: 'failed' },
}

const versionStatusConfig: Record<VersionStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING: { label: 'Pendente', variant: 'secondary' },
  READY: { label: 'Pronto', variant: 'ready' },
  PARTIAL: { label: 'Parcial', variant: 'partial' },
  FAILED: { label: 'Falhou', variant: 'failed' },
}

interface ExamStatusBadgeProps {
  status: ExamStatus
  className?: string
}

export function ExamStatusBadge({ status, className }: ExamStatusBadgeProps) {
  const config = examStatusConfig[status]
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

interface VersionStatusBadgeProps {
  status: VersionStatus
  className?: string
}

export function VersionStatusBadge({ status, className }: VersionStatusBadgeProps) {
  const config = versionStatusConfig[status]
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
