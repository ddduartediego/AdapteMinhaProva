'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExamsFiltersProps {
  disciplines: string[]
  anos: string[]
  currentFilters: {
    disciplina?: string
    ano_serie?: string
    habilidade?: string
    busca?: string
  }
}

// Componente Select nativo estilizado (compatível com React 19)
interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  allLabel: string
  className?: string
}

function FilterSelect({ value, onChange, options, placeholder, allLabel, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'flex h-10 items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'appearance-none cursor-pointer',
        !value && 'text-muted-foreground',
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem',
      }}
      aria-label={placeholder}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export function ExamsFilters({
  disciplines,
  anos,
  currentFilters,
}: ExamsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/app?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = () => {
    router.push('/app')
  }

  const hasFilters = Object.values(currentFilters).some(Boolean)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar provas..."
          className="pl-9"
          defaultValue={currentFilters.busca}
          onChange={(e) => {
            const value = e.target.value
            // Debounce the search
            const timeout = setTimeout(() => {
              updateFilter('busca', value || undefined)
            }, 300)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      <FilterSelect
        value={currentFilters.disciplina || ''}
        onChange={(value) => updateFilter('disciplina', value || undefined)}
        options={disciplines}
        placeholder="Disciplina"
        allLabel="Todas"
        className="w-full sm:w-[180px]"
      />

      <FilterSelect
        value={currentFilters.ano_serie || ''}
        onChange={(value) => updateFilter('ano_serie', value || undefined)}
        options={anos}
        placeholder="Ano/Série"
        allLabel="Todos"
        className="w-full sm:w-[150px]"
      />

      <Input
        placeholder="Habilidade (BNCC)"
        className="w-full sm:w-[150px]"
        defaultValue={currentFilters.habilidade}
        onChange={(e) => {
          const value = e.target.value
          const timeout = setTimeout(() => {
            updateFilter('habilidade', value || undefined)
          }, 300)
          return () => clearTimeout(timeout)
        }}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
