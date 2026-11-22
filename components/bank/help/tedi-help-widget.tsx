'use client'

import { ArrowRight } from 'lucide-react'
import { useBank } from '../bank-provider'
import { TediIcon } from '../tedi-icon'

const prompts = ['Why was I charged twice?', 'Freeze my card', 'Find a branch near me']

/** The first place to go for help: Tedi answers in seconds, any time of day. */
export function TediHelpWidget() {
  const { dispatch } = useBank()

  return (
    <section aria-labelledby="tedi-help-h" className="flex flex-col gap-4 rounded-3xl bg-forest p-5 text-forest-foreground">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
          <TediIcon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="tedi-help-h" className="font-heading text-xl font-bold leading-tight">
            Ask Tedi
          </h2>
          <p className="text-sm text-forest-foreground/80">Your AI banker. Answers in seconds, 24/7.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'navigate', tab: 'sage' })}
        className="flex h-14 items-center justify-between gap-3 rounded-xl bg-white px-4 text-left font-medium text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-white active:bg-white/90"
      >
        Ask Tedi anything
        <span className="flex size-9 items-center justify-center rounded-full bg-forest text-lime">
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </button>

      <ul className="flex flex-wrap gap-2" aria-label="Things people ask Tedi">
        {prompts.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => dispatch({ type: 'askTedi', prompt: p })}
              className="min-h-11 rounded-full border border-white/40 px-4 text-sm font-medium outline-offset-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white active:bg-white/20"
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
