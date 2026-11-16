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
      className="flex min-h-36 w-full flex-col items-start justify-between gap-3 rounded-3xl bg-card p-4 text-left"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
        <TrendingUp className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block text-base font-semibold leading-tight">
          {invest.opened ? `Investing · ${whole(investedValue)}` : 'Start investing with TD'}
        </span>
        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
          {invest.opened ? 'Trade, check your picks and see your whole picture' : `About ${whole(readyToInvest)} could be working harder`}
        </span>
      </span>
    </button>
  )
}
