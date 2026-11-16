'use client'

import { useState, type ReactNode } from 'react'
import { CalendarDays, ChevronDown, ChevronRight, PiggyBank, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useInsights } from '../insights/use-insights'

const whole = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : whole(n))

function Gauge({ percent, label, masked }: { percent: number; label: string; masked: boolean }) {
  return (
    <div className="relative flex w-[92px] shrink-0 flex-col items-center">
      <svg viewBox="0 0 120 66" className="w-full" role="img" aria-label={masked ? `${label}` : `${percent}%, ${label}`}>
        <path d="M10 60 A50 50 0 0 1 110 60" pathLength={100} fill="none" strokeWidth={11} strokeLinecap="round" className="stroke-muted" />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          pathLength={100}
          fill="none"
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(percent, 2)} 100`}
          className="stroke-primary"
        />
      </svg>
      <p className="-mt-8 text-center">
        <span className="tabular font-mono text-xl font-semibold leading-none">{masked ? '••' : percent}</span>
        <span className="font-mono text-xs font-semibold">%</span>
      </p>
      <p className="mt-0.5 text-sm font-semibold text-primary">{label}</p>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, good }: { icon: LucideIcon; label: string; value: string; sub: string; good?: boolean }) {
  return (
    <li className="min-w-0">
      <p className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
        <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
        {label}
      </p>
      <p className="tabular font-mono text-base font-semibold leading-tight">{value}</p>
      <p className={cn('text-xs leading-4', good ? 'font-medium text-primary' : 'text-muted-foreground')}>{sub}</p>
    </li>
  )
}

/** A quick read on whether the customer is on track. The full accounts list expands underneath. */
export function FinancialHealth({ masked, accountsList }: { masked: boolean; accountsList: ReactNode }) {
  const { accounts, vaults, dispatch } = useBank()
  const { cycle } = useInsights()
  const [showAccounts, setShowAccounts] = useState(false)
  const money = (n: string) => (masked ? '••••' : n)

  const checking = accounts.find((a) => a.id === 'chk')
  const goalTotal = vaults.reduce((sum, v) => sum + v.goal, 0)
  const saved = vaults.reduce((sum, v) => sum + v.balance, 0)
  const savingsPct = goalTotal > 0 ? Math.round((saved / goalTotal) * 100) : 0

  const { hasPaycheck, paycheck, committedTotal, spent, room, dayOfCycle, length } = cycle
  const expectedSpend = room * Math.min(1, dayOfCycle / length)
  const overBy = Math.max(0, spent - expectedSpend)
  const health = room > 0 ? Math.round(Math.min(1, Math.max(0, 1 - overBy / room)) * 100) : 100
  const status = health >= 90 ? 'On track' : health >= 70 ? 'Nearly there' : 'Off track'
  const cashFlow = paycheck - committedTotal - spent

  const goToInsights = () => {
    dispatch({ type: 'growSection', section: 'insights' })
    dispatch({ type: 'navigate', tab: 'grow' })
  }

  return (
    <section aria-labelledby="health-h" className="overflow-hidden rounded-3xl bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 pt-3">
        <h2 id="health-h" className="text-lg font-semibold tracking-tight">
          Your financial health
        </h2>
        {hasPaycheck && (
          <button type="button" onClick={goToInsights} className="flex h-9 items-center gap-0.5 text-sm font-semibold text-primary">
            View details <ChevronRight className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pb-2.5 pt-1">
        {hasPaycheck && <Gauge percent={health} label={status} masked={masked} />}
        <ul className={cn('grid min-w-0 flex-1 gap-x-2 gap-y-2.5', hasPaycheck ? 'grid-cols-2 border-l pl-3' : 'grid-cols-2')}>
          <Stat icon={Wallet} label="Available cash" value={money(whole(checking?.balance ?? 0))} sub="In checking" />
          {hasPaycheck ? (
            <Stat
              icon={TrendingUp}
              label="Cash flow"
              value={money(`${cashFlow >= 0 ? '+' : '−'}${whole(Math.abs(cashFlow))}`)}
              sub="after bills"
              good={cashFlow >= 0}
            />
          ) : (
            <Stat icon={CalendarDays} label="Upcoming" value={money(whole(committedTotal))} sub="bills this month" />
          )}
          <Stat
            icon={PiggyBank}
            label="Savings"
            value={goalTotal > 0 ? money(`${savingsPct}%`) : 'No goals yet'}
            sub={goalTotal > 0 ? (masked ? 'of your goals' : `of ${compact(goalTotal)} goals`) : 'Start one in Plan'}
          />
          {hasPaycheck && <Stat icon={CalendarDays} label="Upcoming" value={money(whole(committedTotal))} sub="before payday" />}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setShowAccounts((s) => !s)}
        aria-expanded={showAccounts}
        aria-controls="health-accounts"
        className="flex h-10 w-full items-center justify-center gap-1.5 border-t text-sm font-semibold text-primary active:bg-muted/60"
      >
        {showAccounts ? 'Hide accounts' : 'View accounts'}
        <ChevronDown className={cn('size-4 transition-transform', showAccounts && 'rotate-180')} aria-hidden />
      </button>

      <div id="health-accounts" hidden={!showAccounts} className="border-t">
        {accountsList}
      </div>
    </section>
  )
}
