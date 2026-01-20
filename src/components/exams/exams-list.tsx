'use client'

import Link from 'next/link'
import { Calendar, FileText, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExamStatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/utils'
import type { ExamWithVersions } from '@/types/database'

interface ExamsListProps {
  exams: ExamWithVersions[]
}

export function ExamsList({ exams }: ExamsListProps) {
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 to-transparent py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mt-6 text-xl font-semibold">Bem-vindo ao Adapte Minha Prova!</h3>
        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
          Você ainda não tem nenhuma prova adaptada. Que tal começar agora? 
          É rápido e fácil criar sua primeira adaptação.
        </p>
        <Link
          href="/app/new"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
        >
          <FileText className="h-4 w-4" />
          Criar minha primeira adaptação
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam, index) => (
        <Link
          key={exam.id}
          href={`/app/exams/${exam.id}`}
          className="group opacity-0 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg group-hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-lg group-hover:text-primary transition-colors">
                    {exam.disciplina}
                  </h3>
                  <p className="text-sm text-muted-foreground">{exam.ano_serie}</p>
                </div>
                <ExamStatusBadge status={exam.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* BNCC & Bloom */}
              {(exam.bncc_code || exam.bloom_level) && (
                <div className="flex flex-wrap gap-2">
                  {exam.bncc_code && (
                    <Badge variant="outline" className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {exam.bncc_code}
                    </Badge>
                  )}
                  {exam.bloom_level && (
                    <Badge variant="secondary" className="text-xs">
                      {exam.bloom_level}
                    </Badge>
                  )}
                </div>
              )}

              {/* Conditions */}
              <div className="flex flex-wrap gap-1.5">
                {exam.selected_conditions.map((condition) => (
                  <Badge key={condition} variant="outline" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>

              {/* Versions summary */}
              {exam.exam_versions && exam.exam_versions.length > 0 && (
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    {exam.exam_versions.filter((v) => v.status === 'READY').length} prontas
                  </span>
                  {exam.exam_versions.filter((v) => v.status === 'PARTIAL').length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      {exam.exam_versions.filter((v) => v.status === 'PARTIAL').length} parciais
                    </span>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(exam.created_at)}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
