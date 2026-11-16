'use client'

import { CalendarPlus, Clock, Headset, PiggyBank, ShieldCheck, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bankers, branches, formatMoney, spendingByCategory } from '@/lib/bank-data'
import { useBank } from '../bank-provider'

type ConfirmProps = {
  state: string
  output?: { status: 'confirmed' | 'declined' | 'blocked'; message: string }
  onConfirm: () => void
  onDecline: () => void
}

function ConfirmFooter({ state, output, onConfirm, onDecline }: ConfirmProps) {
  if (state === 'output-available' && output) {
    return (
      <p
        className={cn(
          'mt-3 rounded-xl px-3 py-2 text-sm font-medium',
          output.status === 'confirmed' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {output.message}
      </p>
    )
  }
  if (state !== 'input-available') return null
  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={onConfirm}
        className="h-11 flex-1 rounded-xl bg-shield text-sm font-semibold text-shield-foreground"
      >
        Confirm
      </button>
      <button type="button" onClick={onDecline} className="h-11 flex-1 rounded-xl bg-shield-50 text-sm font-medium text-shield-700">
        Cancel
      </button>
    </div>
  )
}

export function VaultConfirmCard({
  input,
  ...rest
}: { input?: { vaultId?: string; amount?: number } } & ConfirmProps) {
  const { vaults, accounts } = useBank()
  const vault = vaults.find((v) => v.id === input?.vaultId)
  const checking = accounts.find((a) => a.id === 'chk')
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-lime text-lime-foreground">
          <PiggyBank className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Move to vault</p>
          <p className="font-semibold">{vault?.name ?? '…'}</p>
        </div>
        <p className="tabular font-mono text-lg font-semibold">{input?.amount ? formatMoney(input.amount) : '…'}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        From Everyday Checking ({checking ? formatMoney(checking.balance) : ''} available) · arrives instantly
      </p>
      <ConfirmFooter {...rest} />
    </div>
  )
}

export function ActionResultCard({
  kind,
  done,
  text,
}: {
  kind: 'freeze' | 'unfreeze' | 'street'
  done: boolean
  text: string
}) {
  const Icon = kind === 'street' ? ShieldCheck : Snowflake
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-xl',
          kind === 'freeze' ? 'bg-sky-100 text-sky-700' : 'bg-muted text-lime',
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">{done ? text : 'Working on it…'}</p>
    </div>
  )
}

export function SpendingCard() {
  const max = Math.max(...spendingByCategory.map((s) => s.amount))
  const total = spendingByCategory.reduce((s, c) => s + c.amount, 0)
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">October spending</p>
        <p className="tabular font-mono font-semibold">{formatMoney(total)}</p>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {spendingByCategory.map((s) => (
          <li key={s.category} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>{s.category}</span>
              <span className="tabular font-mono">
                {formatMoney(s.amount)}{' '}
                <span className={cn('text-xs', s.change < 0 ? 'text-primary' : s.change > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {s.change > 0 ? '+' : ''}
                  {s.change}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(s.amount / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BranchResultsCard({ ids }: { ids: string[] }) {
  const { dispatch } = useBank()
  const list = branches.filter((b) => ids.includes(b.id))
  if (list.length === 0) {
    return <p className="rounded-2xl border bg-card p-3 text-sm">No exact matches nearby — try a video appointment instead.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {list.map((b) => (
        <li key={b.id} className="rounded-2xl border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{b.name}</p>
              <p className="text-xs text-muted-foreground">
                {b.distanceMi} mi · {b.openNow ? b.hoursToday : b.hoursToday}
              </p>
            </div>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                !b.openNow ? 'bg-muted text-muted-foreground' : b.waitMins <= 5 ? 'bg-accent text-accent-foreground' : 'bg-amber-100 text-amber-800',
              )}
            >
              <Clock className="size-3" aria-hidden />
              {b.openNow ? (b.waitMins === 0 ? 'No wait' : `${b.waitMins} min`) : 'Closed'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Bankers: {bankers.filter((bk) => b.bankerIds.includes(bk.id)).map((bk) => bk.name.split(' ')[0]).join(', ')}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'navigate', tab: 'branches', focusBranchId: b.id })}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-shield text-sm font-semibold text-shield-foreground"
          >
            <CalendarPlus className="size-4" aria-hidden /> Book or join line
          </button>
        </li>
      ))}
    </ul>
  )
}

export function HumanHandoffCard({ topic }: { topic: string }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-accent p-4 text-accent-foreground">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-forest text-lime">
          <Headset className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Jordan from TD is joining</p>
          <p className="text-sm opacity-80">Typically under 2 min · no need to repeat yourself</p>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-card/70 px-3 py-2 text-xs leading-relaxed text-foreground">
        <span className="font-semibold">Shared with Jordan:</span> {topic}
      </p>
    </div>
  )
}
