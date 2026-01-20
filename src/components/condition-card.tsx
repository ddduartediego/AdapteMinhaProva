'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Condition } from '@/types/database'

interface ConditionCardProps {
  value: Condition
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

const conditionIcons: Record<Condition, string> = {
  DI: '🧠',
  TEA: '🧩',
  DISLEXIA: '📖',
  DISGRAFIA: '✏️',
  DISCALCULIA: '🔢',
  TDAH: '⚡',
}

export function ConditionCard({
  value,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: ConditionCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Evita propagação dupla se o clique foi no checkbox (label interna)
    const target = e.target as HTMLElement
    if (target.closest('label')) {
      return
    }
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-4 transition-all cursor-pointer',
        checked
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-muted hover:border-primary/30 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <Checkbox
          id={value}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{conditionIcons[value]}</span>
            <Label
              htmlFor={value}
              className={cn(
                'text-base font-semibold cursor-pointer',
                checked && 'text-primary'
              )}
            >
              {label}
            </Label>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
