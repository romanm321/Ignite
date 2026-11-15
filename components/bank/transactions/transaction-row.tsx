'use client'

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bus, Percent, Receipt, Repeat, ShoppingBag, Utensils, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Transaction } from '@/lib/bank-data'
import { enrich, enrichments } from '@/lib/enrichment'
import { formatRate, type Reward } from '@/lib/rewards'
import { useBank } from '../bank-provider'
import { MerchantLogo } from './merchant-logo'

const categoryIcon: Record<Transaction['category'], typeof Utensils> = {
  Dining: Utensils,
  Groceries: ShoppingBag,
  Transport: Bus,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Income: ArrowDownLeft,
  Travel: Wifi,
  Transfer: ArrowLeftRight,
}

export function TransactionRow({
  txn,
  masked,
  accountLabel,
  reward,
}: {
  txn: Transaction
  masked?: boolean
  accountLabel?: string
  reward?: Reward | null
}) {
  const { disputes, dispatch } = useBank()
  const e = enrich(txn)
  const known = Boolean(enrichments[txn.merchant])
  const Icon =
    txn.merchant.startsWith('Interest') ? Percent : txn.category === 'Transfer' && txn.amount < 0 ? ArrowUpRight : categoryIcon[txn.category]

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'openTxn', id: txn.id })}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60"
    >
      {known ? (
        <MerchantLogo enrichment={e} />
      ) : (
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            txn.amount > 0 ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground',
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{e.name}</span>
        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          {e.subscription && <Repeat className="size-3 shrink-0" aria-label="Recurring" />}
          {disputes[txn.id] ? 'Disputed' : e.detailed} · {txn.when}
          {accountLabel ? ` · ${accountLabel}` : ''}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className={cn('tabular font-mono text-sm font-semibold', txn.amount > 0 && 'text-primary')}>
          {masked ? '••••' : formatMoney(txn.amount, 'USD', { signed: true })}
        </span>
        {reward && (
          <span className="tabular text-xs font-semibold text-shield-700">
            {masked ? '••••' : `+${formatMoney(reward.amount)}`} back · {formatRate(reward.rate)}
          </span>
        )}
      </span>
    </button>
  )
}
