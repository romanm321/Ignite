'use client'

import { ChevronRight, TrendingUp } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { useInvestPicture } from './use-invest'

export function InvestEntryCard() {
  const { invest, investedValue, readyToInvest, cd, streetSafe, dispatch } = useInvestPicture()
  const whole = (n: number) => (streetSafe ? '••••' : formatMoney(n).replace(/\.\d\d$/, ''))

  return (
    <section aria-labelledby="invest-entry-h">
      <button
        type="button"
        onClick={() => dispatch({ type: 'overlay', overlay: 'invest' })}
        className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-lime">
          <TrendingUp className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span id="invest-entry-h" className="block font-semibold">
            {invest.opened ? `Investing · ${whole(investedValue)}` : 'Start investing with TD'}
          </span>
          <span className="block text-sm leading-relaxed text-muted-foreground">
            {invest.opened
              ? 'Trade, check your picks and see your whole picture'
              : `About ${whole(readyToInvest)} could be working harder${cd > 0 ? '. Plus, your CD matures soon.' : '.'}`}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </section>
  )
}
