'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExamStatus } from '@/types/database'

interface UseExamPollingOptions {
  examId: string
  onStatusChange?: (newStatus: ExamStatus, oldStatus: ExamStatus) => void
  /** Intervalo de polling em ms. Default: 3000 */
  interval?: number
  /** Se o polling está ativo. Default: true */
  enabled?: boolean
}

/**
 * Hook para verificar mudanças no status do exam via polling
 * Verifica periodicamente o banco de dados e notifica quando o status muda
 */
export function useExamPolling({
  examId,
  onStatusChange,
  interval = 3000,
  enabled = true,
}: UseExamPollingOptions) {
  const supabase = createClient()
  const lastStatusRef = useRef<ExamStatus | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('status')
        .eq('id', examId)
        .single()

      if (error) {
        console.error('[Polling] Error:', error.message)
        return
      }

      if (!data) return

      const newStatus = (data as { status: string }).status as ExamStatus

      if (lastStatusRef.current !== null && newStatus !== lastStatusRef.current) {
        console.log('[Polling] Status changed:', lastStatusRef.current, '→', newStatus)
        onStatusChange?.(newStatus, lastStatusRef.current)
      }

      lastStatusRef.current = newStatus
    } catch (err) {
      console.error('[Polling] Exception:', err)
    }
  }, [examId, onStatusChange, supabase])

  const startPolling = useCallback(() => {
    if (pollingRef.current) return

    // Buscar status inicial
    checkStatus()

    // Iniciar polling
    pollingRef.current = setInterval(checkStatus, interval)
  }, [checkStatus, interval])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  return {
    checkStatus,
    startPolling,
    stopPolling,
  }
}

// Alias para manter compatibilidade com o nome anterior
export const useExamRealtime = useExamPolling
