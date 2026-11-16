'use client'

import { cn } from '@/lib/utils'
import type { GrowSection } from '../bank-provider'

export const growSections: { id: GrowSection; label: string }[] = [
  { id: 'vaults', label: 'Vaults' },
  { id: 'insights', label: 'Insights' },
  { id: 'accounts', label: 'More for you' },
]

/** Page switcher for the Plan tab, styled like the app's segmented SubNav. */
export function GrowSectionNav({ active, onSelect }: { active: GrowSection; onSelect: (id: GrowSection) => void }) {
  return (
    <nav aria-label="Plan sections" className="sticky top-0 z-10 bg-background/95 px-4 pb-2 pt-1 backdrop-blur">
      <div role="tablist" aria-label="Plan sections" className="flex gap-1 rounded-2xl bg-muted p-1">
        {growSections.map((s) => {
          const current = active === s.id
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`plan-tab-${s.id}`}
              aria-selected={current}
              aria-controls="plan-panel"
              onClick={() => onSelect(s.id)}
              className={cn(
                'flex h-11 flex-1 items-center justify-center rounded-xl text-center text-sm font-semibold leading-tight transition-colors',
                current ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
