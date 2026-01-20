'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/file-upload'
import { ConditionCard } from '@/components/condition-card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { CONDITIONS, type Condition } from '@/types/database'
import { cn } from '@/lib/utils'

const DISCIPLINAS = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Inglês',
  'Educação Física',
  'Artes',
  'Outra',
]

const ANOS_SERIES = [
  '1º ano',
  '2º ano',
  '3º ano',
  '4º ano',
  '5º ano',
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
]

// Componente Select nativo estilizado (compatível com React 19)
interface NativeSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
}

function NativeSelect({ id, value, onChange, options, placeholder }: NativeSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'appearance-none cursor-pointer',
        !value && 'text-muted-foreground'
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem',
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export default function NewExamPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [disciplina, setDisciplina] = useState('')
  const [anoSerie, setAnoSerie] = useState('')
  const [habilidadeHint, setHabilidadeHint] = useState('')
  const [conhecimentoHint, setConhecimentoHint] = useState('')
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([])

  const toggleCondition = (condition: Condition, checked: boolean) => {
    if (checked) {
      setSelectedConditions((prev) => [...prev, condition])
    } else {
      setSelectedConditions((prev) => prev.filter((c) => c !== condition))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({
        title: 'PDF obrigatório',
        description: 'Por favor, faça upload de um arquivo PDF.',
        variant: 'destructive',
      })
      return
    }

    if (!disciplina || !anoSerie) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha disciplina e ano/série.',
        variant: 'destructive',
      })
      return
    }

    if (selectedConditions.length === 0) {
      toast({
        title: 'Selecione adaptações',
        description: 'Selecione pelo menos uma condição para adaptação.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('disciplina', disciplina)
      formData.append('ano_serie', anoSerie)
      formData.append('habilidade_hint', habilidadeHint)
      formData.append('conhecimento_hint', conhecimentoHint)
      formData.append('selected_conditions', JSON.stringify(selectedConditions))

      const response = await fetch('/api/exams', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar prova')
      }

      const { exam_id } = await response.json()

      toast({
        title: 'Prova enviada!',
        description: 'Sua prova está sendo analisada.',
        variant: 'success',
      })

      router.push(`/app/exams/${exam_id}`)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar prova',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/app">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nova Adaptação</h1>
        <p className="text-muted-foreground">
          Preencha os dados e envie sua prova em PDF
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Prova</CardTitle>
            <CardDescription>
              Dados que ajudarão a IA a identificar BNCC e criar adaptações precisas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="disciplina">
                  Disciplina <span className="text-destructive">*</span>
                </Label>
                <NativeSelect
                  id="disciplina"
                  value={disciplina}
                  onChange={setDisciplina}
                  options={DISCIPLINAS}
                  placeholder="Selecione"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ano_serie">
                  Ano/Série <span className="text-destructive">*</span>
                </Label>
                <NativeSelect
                  id="ano_serie"
                  value={anoSerie}
                  onChange={setAnoSerie}
                  options={ANOS_SERIES}
                  placeholder="Selecione"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="habilidade">Habilidade (opcional)</Label>
                <Input
                  id="habilidade"
                  placeholder="Ex: EF05MA07"
                  value={habilidadeHint}
                  onChange={(e) => setHabilidadeHint(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Código BNCC se souber
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conhecimento">Conhecimento (opcional)</Label>
                <Input
                  id="conhecimento"
                  placeholder="Ex: Frações, Verbos"
                  value={conhecimentoHint}
                  onChange={(e) => setConhecimentoHint(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tema ou assunto da prova
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Adaptações Desejadas</CardTitle>
            <CardDescription>
              Selecione as condições para as quais deseja gerar versões adaptadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {CONDITIONS.map((condition) => (
                <ConditionCard
                  key={condition.value}
                  value={condition.value}
                  label={condition.label}
                  description={condition.description}
                  checked={selectedConditions.includes(condition.value)}
                  onCheckedChange={(checked) =>
                    toggleCondition(condition.value, checked)
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PDF Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload do PDF</CardTitle>
            <CardDescription>
              Envie a prova em PDF (texto selecionável, máx. 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={setFile} />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/app">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para adaptação
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
