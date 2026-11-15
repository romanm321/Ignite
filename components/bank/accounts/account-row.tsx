'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountDetails, formatMoney, type Account } from '@/lib/bank-data'
import { useBank } from '../bank-provider'

export function accountApy(a: Account) {
  if (a.id === 'step-cd') return 4.25
  return accountDetails[a.id]?.apy ?? (a.kind === 'savings' ? 4.6 : undefined)
}

export function AccountBadge({ account, className }: { account: Account; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold',
        account.kind === 'checking' && 'bg-primary text-primary-foreground',
        account.kind === 'savings' && 'bg-lime text-lime-foreground',
        account.kind === 'credit' && 'bg-forest text-forest-foreground',
        className,
      )}
      aria-hidden
    >
      {account.mask.slice(-2)}
    </span>
  )
}

export function AccountRow({ account, masked, detail }: { account: Account; masked?: boolean; detail?: string }) {
  const { dispatch } = useBank()
  const apy = accountApy(account)
  const sub =
    detail ??
    (account.kind === 'credit' && account.limit
      ? `${masked ? '••••' : formatMoney(account.limit + account.balance)} available`
      : `•••• ${account.mask}${apy ? ` · ${apy.toFixed(2)}% APY` : ''}`)

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'openAccount', id: account.id })}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60"
    >
      <AccountBadge account={account} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{account.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
      <span className="tabular font-mono font-semibold">{masked ? '••••' : formatMoney(account.balance)}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
