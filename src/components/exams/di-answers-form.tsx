'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import type { ExamQuestion, DiAnswer, QuestionOption } from '@/types/database'

interface DiAnswersFormProps {
  examId: string
  questions: ExamQuestion[]
  existingAnswers: DiAnswer[]
}

export function DiAnswersForm({
  examId,
  questions,
  existingAnswers,
}: DiAnswersFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize answers from existing or empty
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    existingAnswers.forEach((a) => {
      initial[a.question_id] = a.correct_option_key
    })
    return initial
  })

  const handleAnswerChange = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
  }

  const handleSubmit = async () => {
    // Validate all questions have answers
    const unanswered = questions.filter(
      (q) => q.needs_di_answer && !answers[q.id]
    )

    if (unanswered.length > 0) {
      toast({
        title: 'Respostas incompletas',
        description: `Preencha a resposta correta para ${unanswered.length} questão(ões).`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const diAnswers = Object.entries(answers).map(([questionId, optionKey]) => ({
        question_id: questionId,
        correct_option_key: optionKey,
      }))

      const response = await fetch(`/api/exams/${examId}/di-answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ di_answers: diAnswers }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao salvar respostas')
      }

      toast({
        title: 'Respostas salvas!',
        description: 'Gerando versões adaptadas...',
        variant: 'success',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const diQuestions = questions.filter((q) => q.needs_di_answer)

  if (diQuestions.length === 0) {
    return null
  }

  return (
    <Card className="border-warning/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          Respostas para DI
        </CardTitle>
        <CardDescription>
          Para gerar a versão DI, informe a alternativa correta de cada questão objetiva.
          Isso permite destacar visualmente a resposta sem dar dicas explícitas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {diQuestions.map((question, index) => {
          const options = question.options as QuestionOption[] | null

          return (
            <div key={question.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {question.order_index}
                </span>
                <p className="text-sm leading-relaxed">{question.prompt}</p>
              </div>

              {options && options.length > 0 && (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="ml-10 space-y-2"
                >
                  {options.map((option) => (
                    <div key={option.key} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.key} id={`${question.id}-${option.key}`} />
                      <Label
                        htmlFor={`${question.id}-${option.key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        <span className="font-medium">{option.key})</span> {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {(!options || options.length === 0) && (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="ml-10 flex flex-wrap gap-4"
                >
                  {['A', 'B', 'C', 'D', 'E'].map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`${question.id}-${key}`} />
                      <Label htmlFor={`${question.id}-${key}`} className="cursor-pointer">
                        {key}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )
        })}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Continuar e gerar versões
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
