'use client'

import { ChevronRight, CreditCard, Tag, Wallet, type LucideIcon } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useEarnings } from './use-earnings'

/** The cash-back headline: what's ready to use now, and where the rest is coming from. */
export function UnifiedRewards({ enrolled }: { enrolled: string[] }) {
  const { accounts, streetSafe, dispatch } = useBank()
  const earnings = useEarnings(enrolled)
  const card = accounts.find((a) => a.kind === 'credit')
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))

  const sources: { id: string; icon: LucideIcon; label: string; amount: number }[] = [
    { id: 'credit', icon: CreditCard, label: 'Credit card', amount: earnings.ready },
    { id: 'debit', icon: Wallet, label: 'Debit card', amount: earnings.debit },
    { id: 'offers', icon: Tag, label: 'Offers', amount: earnings.offers },
  ]

  return (
    <section aria-labelledby="cashback-h" className="relative overflow-hidden rounded-3xl bg-forest p-5 text-forest-foreground">
      <span aria-hidden className="absolute -right-12 -top-14 size-44 rounded-full bg-lime/15" />
      <span aria-hidden className="absolute -bottom-16 -left-10 size-40 rounded-full bg-white/5" />
      <div className="relative">
        <h2 id="cashback-h" className="text-sm font-medium text-forest-foreground/75">
          Cash back ready to use
        </h2>
        <p className="tabular mt-1 font-mono text-5xl font-semibold leading-none tracking-tight text-lime">{show(earnings.ready)}</p>
        <p className="mt-2 text-sm text-forest-foreground/75">
          {show(earnings.total)} earned in total across debit, credit and offers.
        </p>

        <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Where your cash back comes from">
          {sources.map((s) => (
            <li key={s.id} className="rounded-2xl bg-white/10 p-3">
              <s.icon className="size-4 text-lime" aria-hidden />
              <p className="mt-2 text-xs text-forest-foreground/75">{s.label}</p>
              <p className="tabular font-mono text-sm font-semibold">{show(s.amount)}</p>
            </li>
          ))}
        </ul>

        {card && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'openRewards', id: card.id })}
            className="mt-4 flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-lime text-sm font-semibold text-lime-foreground active:opacity-90"
          >
            Redeem cash back <ChevronRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </section>
  )
}
