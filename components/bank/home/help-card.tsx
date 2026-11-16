'use client'

import { ChevronRight, Headset } from 'lucide-react'
import { branches } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'

/** A human is always one tap away. Opens booking at the open branch with the shortest wait. */
export function HelpCard() {
  const { dispatch } = useBank()
  const branch = branches.filter((b) => b.openNow).sort((a, b) => a.distanceMi - b.distanceMi)[0]
  if (!branch) return null
  const wait = branch.waitMins === 0 ? 'No wait' : `${branch.waitMins} min wait`

  return (
    <section aria-labelledby="help-h" className="flex flex-col gap-3">
      <SectionHeader id="help-h" title="Need a hand?" />
      <button
        type="button"
        onClick={() => dispatch({ type: 'navigate', tab: 'branches', focusBranchId: branch.id })}
        className="flex min-h-16 w-full items-center gap-3 rounded-3xl bg-card px-4 py-3 text-left active:bg-muted/60"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Headset className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Talk to someone</span>
          <span className="block truncate text-xs text-muted-foreground">
            {branch.name} · {branch.distanceMi} mi · <span className="font-medium text-primary">{wait}</span>
          </span>
        </span>
        <span className="text-sm font-semibold text-primary">Book</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </section>
  )
}
