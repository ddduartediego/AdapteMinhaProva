'use client'

import { useState } from 'react'
import { ExternalLink, FileDown, Star, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VersionStatusBadge } from '@/components/status-badge'
import { RatingDialog } from '@/components/exams/rating-dialog'
import type { ExamVersion, Condition } from '@/types/database'

interface VersionCardProps {
  version: ExamVersion
}

const conditionLabels: Record<Condition, string> = {
  DI: 'Deficiência Intelectual',
  TEA: 'TEA',
  DISLEXIA: 'Dislexia',
  DISGRAFIA: 'Disgrafia',
  DISCALCULIA: 'Discalculia',
  TDAH: 'TDAH',
}

const conditionIcons: Record<Condition, string> = {
  DI: '🧠',
  TEA: '🧩',
  DISLEXIA: '📖',
  DISGRAFIA: '✏️',
  DISCALCULIA: '🔢',
  TDAH: '⚡',
}

export function VersionCard({ version }: VersionCardProps) {
  const [showRating, setShowRating] = useState(false)
  const condition = version.condition as Condition
  const limitations = version.limitations as { code: string; message: string }[] | null

  const pdfExportUrl = version.google_doc_url
    ? version.google_doc_url.replace('/edit', '/export?format=pdf')
    : null

  return (
    <>
      <Card
        className={
          version.status === 'READY'
            ? 'border-success/50'
            : version.status === 'PARTIAL'
              ? 'border-warning/50'
              : 'border-destructive/50'
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{conditionIcons[condition]}</span>
              <CardTitle className="text-lg">{conditionLabels[condition]}</CardTitle>
            </div>
            <VersionStatusBadge status={version.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QA Score */}
          {version.qa_score && (
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  version.qa_score >= 80
                    ? 'success'
                    : version.qa_score >= 60
                      ? 'warning'
                      : 'destructive'
                }
              >
                QA: {version.qa_score}%
              </Badge>
            </div>
          )}

          {/* Limitations */}
          {limitations && limitations.length > 0 && (
            <div className="rounded-lg bg-warning/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertTriangle className="h-4 w-4" />
                Limitações
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {limitations.map((lim, i) => (
                  <li key={i}>• {lim.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {version.google_doc_url && (
              <Button asChild size="sm">
                <a
                  href={version.google_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Docs
                </a>
              </Button>
            )}

            {pdfExportUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={pdfExportUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar PDF
                </a>
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => setShowRating(true)}>
              <Star className="mr-2 h-4 w-4" />
              Avaliar
            </Button>
          </div>
        </CardContent>
      </Card>

      <RatingDialog
        versionId={version.id}
        open={showRating}
        onOpenChange={setShowRating}
      />
    </>
  )
}
