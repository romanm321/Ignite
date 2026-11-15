'use client'

import { ChevronRight, GraduationCap, Gem } from 'lucide-react'
import { useBank } from '../bank-provider'

export function ExploreAccountsCard() {
  const { dispatch } = useBank()
  const open = () => dispatch({ type: 'overlay', overlay: 'explore' })

  return (
    <section aria-labelledby="explore-h" className="flex flex-col gap-3">
      <h2 id="explore-h" className="text-lg font-semibold">
        An account for every chapter
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={open}
          className="flex min-h-36 flex-col items-start gap-2 rounded-3xl bg-lime p-4 text-left text-lime-foreground"
        >
          <GraduationCap className="size-6" aria-hidden />
          <span className="text-base font-semibold leading-tight">Student</span>
          <span className="text-xs leading-snug opacity-80">$0 fees, Credit Builder & free Spotify</span>
        </button>
        <button
          type="button"
          onClick={open}
          className="flex min-h-36 flex-col items-start gap-2 rounded-3xl bg-forest p-4 text-left text-forest-foreground"
        >
          <Gem className="size-6 text-lime" aria-hidden />
          <span className="text-base font-semibold leading-tight">Complete</span>
          <span className="text-xs leading-snug text-forest-foreground/75">5.10% sweep, 1.5x points & a banker</span>
        </button>
      </div>
      <button
        type="button"
        onClick={open}
        className="flex h-11 items-center justify-center gap-1 rounded-xl border-2 border-shield text-sm font-semibold bg-card text-shield-700"
      >
        Compare all accounts <ChevronRight className="size-4" aria-hidden />
      </button>
    </section>
  )
}
