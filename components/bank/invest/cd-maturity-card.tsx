'use client'

import { useState } from 'react'
import { CalendarClock, Check } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { cdChoices, cdMaturity, type CdChoice } from '@/lib/invest-data'
import { OpenInvestSheet } from './open-invest-sheet'
import { useInvestPicture } from './use-invest'

/** What to do when the CD ends. It lives on the CD account, since that's where the decision belongs. */
export function CdMaturityCard({ masked }: { masked: boolean }) {
  const { cd, invest, dispatch, notify } = useInvestPicture()
  const [opening, setOpening] = useState<CdChoice | null>(null)
  const chosen = cdChoices.find((c) => c.id === invest.cdChoice)
  const money = (n: number) => (masked ? '••••' : formatMoney(n))

  const apply = (choice: CdChoice) => {
    dispatch({ type: 'investPatch', patch: { cdChoice: choice } })
    notify(
      choice === 'renew'
        ? `Got it. We’ll renew your CD at ${cdMaturity.renewRate.toFixed(2)}% interest.`
        : `Done. When your CD ends in ${cdMaturity.daysLeft} days, we’ll ${choice === 'treasury' ? 'move it into safe government bonds' : 'split it 50/50'}.`,
    )
  }

  const choose = (choice: CdChoice) => {
    // Government bonds live in an investing account, so open one first if needed.
    if (choice !== 'renew' && !invest.opened) return setOpening(choice)
    apply(choice)
  }

  if (cd <= 0) return null

  return (
    <section aria-labelledby="cd-h" className="flex flex-col gap-3 rounded-3xl border-2 border-primary/30 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
          <CalendarClock className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="cd-h" className="font-semibold">
            Your CD ends in {cdMaturity.daysLeft} days
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {money(cd)} at {cdMaturity.rate.toFixed(2)}% interest. Decide now so it never sits idle.
          </p>
        </div>
      </div>
      {chosen ? (
        <p className="flex items-center gap-2 rounded-2xl bg-accent p-3 text-sm font-medium text-accent-foreground">
          <Check className="size-4 shrink-0" aria-hidden /> Plan set: {chosen.title.toLowerCase()} ({chosen.rate})
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cdChoices.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => choose(c.id)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">{c.detail}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-primary">{c.rate}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {opening && (
        <OpenInvestSheet
          onClose={() => setOpening(null)}
          onOpened={(profile) => {
            dispatch({ type: 'investOpen', profile })
            apply(opening)
            setOpening(null)
          }}
        />
      )}
    </section>
  )
}
