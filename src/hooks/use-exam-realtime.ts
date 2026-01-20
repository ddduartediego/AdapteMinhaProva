'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExamStatus } from '@/types/database'

interface UseExamRealtimeOptions {
  examId: string
  onExamChange?: (payload: ExamChangePayload) => void
  onVersionChange?: () => void
}

interface ExamChangePayload {
  new: {
    id: string
    status: ExamStatus
    [key: string]: unknown
  }
  old: {
    id: string
    status: ExamStatus
    [key: string]: unknown
  }
}

/**
 * Hook para escutar mudanças em tempo real de um exam específico
 * Usa Supabase Realtime para receber notificações quando o exam ou suas versões são atualizados
 */
export function useExamRealtime({
  examId,
  onExamChange,
  onVersionChange,
}: UseExamRealtimeOptions) {
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const subscribe = useCallback(() => {
    // Limpar canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Criar novo canal para este exam
    const channel = supabase
      .channel(`exam-realtime-${examId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exams',
          filter: `id=eq.${examId}`,
        },
        (payload) => {
          console.log('[Realtime] Exam updated:', payload)
          onExamChange?.(payload as unknown as ExamChangePayload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'exam_versions',
          filter: `exam_id=eq.${examId}`,
        },
        (payload) => {
          console.log('[Realtime] Version changed:', payload)
          onVersionChange?.()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_questions',
          filter: `exam_id=eq.${examId}`,
        },
        (payload) => {
          console.log('[Realtime] Questions changed:', payload)
          // Questions mudaram, também notificar
          onVersionChange?.()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    channelRef.current = channel

    return channel
  }, [examId, onExamChange, onVersionChange, supabase])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log('[Realtime] Unsubscribing from channel')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [supabase])

  useEffect(() => {
    subscribe()

    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return {
    subscribe,
    unsubscribe,
  }
}
