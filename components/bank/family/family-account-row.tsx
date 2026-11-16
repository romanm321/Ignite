'use client'

import { ChevronRight, Users } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { themes } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useFamily } from './family-provider'

export function FamilyAccountRow({ masked }: { masked?: boolean }) {
  const { customerType, dispatch } = useBank()
  const { kids } = useFamily()

  if (customerType === 'new' || kids.length === 0) return null

  const total = kids.reduce((sum, k) => sum + k.balance, 0)
  const theme = themes[kids[0].theme]

  return (
    <li>
      <button
        type="button"
        onClick={() => dispatch({ type: 'overlay', overlay: 'family' })}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60"
      >
        <span className={cn('relative h-8 w-12 shrink-0 overflow-hidden rounded-md', theme.soft, theme.ink)} aria-hidden>
          <span className="absolute -right-2 -top-2 size-6 rounded-full bg-white/40" />
          <Users className="absolute bottom-1 left-1.5 size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">Family Account</span>
        <span className="tabular font-mono font-semibold">{masked ? '••••' : formatMoney(total)}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  )
}
