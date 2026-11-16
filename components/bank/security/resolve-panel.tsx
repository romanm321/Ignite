'use client'

import { useState } from 'react'
import { Check, ChevronRight, FileWarning, Headset, LifeBuoy } from 'lucide-react'
import { TediIcon } from '../tedi-icon'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { fraudStages } from '@/lib/trust-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { SectionHeader } from '../primitives'
import { ReportFraudSheet } from './report-fraud-sheet'

const sageTopics = ['I lost my card', 'Someone has my password', 'Dispute a charge', 'I sent money to a scammer']

export function ResolvePanel() {
  const { dispatch: bankDispatch, notify } = useBank()
  const { cases } = useTrust()
  const [reporting, setReporting] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setReporting(true)}
        className="flex items-center gap-3 rounded-3xl bg-destructive p-4 text-left text-white"
      >
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
          <FileWarning className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Report fraud or a scam</span>
          <span className="block text-sm text-white/80">Lock, replace and dispute in about 2 minutes</span>
        </span>
        <ChevronRight className="size-5" aria-hidden />
      </button>

      {cases.length > 0 && (
        <section aria-labelledby="cases-h" className="flex flex-col gap-3">
          <SectionHeader id="cases-h" title="Your open cases" />
          {cases.map((c) => (
            <article key={c.id} className="rounded-3xl bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Case {c.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.reason} · opened {c.openedAt}
                  </p>
                </div>
                <p className="tabular font-mono font-semibold">{formatMoney(c.amount)}</p>
              </div>
              <ol className="mt-4 flex items-start" aria-label="Case progress">
                {fraudStages.map((stage, i) => {
                  const done = i <= c.stage
                  return (
                    <li key={stage} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
                      {i > 0 && (
                        <span
                          aria-hidden
                          className={cn('absolute right-1/2 top-3 h-0.5 w-full', done ? 'bg-primary' : 'bg-border')}
                        />
                      )}
                      <span
                        className={cn(
                          'relative flex size-6 items-center justify-center rounded-full text-[10px] font-bold',
                          done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                      </span>
                      <span className={cn('text-xs leading-tight', done ? 'font-medium' : 'text-muted-foreground')}>
                        {stage}
                        <span className="sr-only">{done ? ' (complete)' : ' (pending)'}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
              <p className="mt-4 rounded-2xl bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
                {formatMoney(c.amount)} has been credited back while we investigate. Expect a decision within 10 business days.
              </p>
            </article>
          ))}
        </section>
      )}

      <section aria-labelledby="help-h" className="flex flex-col gap-3">
        <SectionHeader id="help-h" title="Get help now" />
        <div className="rounded-3xl bg-forest p-4 text-forest-foreground">
          <p className="flex items-center gap-2 font-semibold">
            <TediIcon className="size-4 text-lime" aria-hidden /> Ask Tedi
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sageTopics.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => {
                    bankDispatch({ type: 'navigate', tab: 'sage' })
                    notify(`Ask Tedi: "${t}"`)
                  }}
                  className="h-11 rounded-xl bg-white/10 px-4 text-sm"
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:18008693557" className="flex flex-col gap-2 rounded-3xl bg-card p-4">
            <Headset className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold">Fraud team, 24/7</span>
            <span className="text-xs text-muted-foreground">Avg. wait under 1 min</span>
          </a>
          <button
            type="button"
            onClick={() => notify('Victim support guide opened')}
            className="flex flex-col items-start gap-2 rounded-3xl bg-card p-4 text-left"
          >
            <LifeBuoy className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold">Recovery guide</span>
            <span className="text-xs text-muted-foreground">Police report, credit freeze & more</span>
          </button>
        </div>
      </section>

      {reporting && <ReportFraudSheet onClose={() => setReporting(false)} />}
    </div>
  )
}
