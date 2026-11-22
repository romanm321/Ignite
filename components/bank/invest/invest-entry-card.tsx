'use client'

import { TrendingUp } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { useInvestPicture } from './use-invest'

export function InvestEntryCard() {
  const { invest, investedValue, readyToInvest, streetSafe, dispatch } = useInvestPicture()
  const whole = (n: number) => (streetSafe ? '••••' : formatMoney(n).replace(/\.\d\d$/, ''))

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'overlay', overlay: 'invest' })}
      className="flex min-h-18 w-full items-center gap-3 rounded-2xl bg-card p-3 text-left"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
        <TrendingUp className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">
          {invest.opened ? `Investing · ${whole(investedValue)}` : 'Investing'}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">
          {invest.opened ? 'Trade and see your picture' : `About ${whole(readyToInvest)} to grow`}
        </span>
      </span>
    </button>
  )
}
