'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { accountDetails, formatMoney, type Account } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import type { AccountGroup } from './account-groups'

/** Matches the due date on the card's account detail page. */
export const CARD_PAYMENT_DUE = 'Nov 28'

export function accountApy(a: Account) {
  if (a.id === 'step-cd') return 4.25
  return accountDetails[a.id]?.apy ?? (a.kind === 'savings' ? 4.6 : undefined)
}

export function AccountBadge({ account, className }: { account: Account; className?: string }) {
  return (
    <span
      className={cn(
        'relative h-8 w-12 shrink-0 overflow-hidden rounded-md',
        account.kind === 'checking' && 'bg-primary text-primary-foreground',
        account.kind === 'savings' && 'bg-lime text-lime-foreground',
        account.kind === 'credit' && 'bg-forest text-forest-foreground',
        account.kind === 'investment' && 'bg-accent text-accent-foreground',
        className,
      )}
      aria-hidden
    >
      <span className="absolute -right-2 -top-2 size-6 rounded-full bg-white/25" />
      <span className="absolute bottom-1.5 left-1.5 h-0.5 w-5 rounded-full bg-current opacity-40" />
    </span>
  )
}

export function AccountRow({
  group,
  masked,
  balanceOf = (a) => a.balance,
}: {
  group: AccountGroup
  masked?: boolean
  balanceOf?: (account: Account) => number
}) {
  const { dispatch } = useBank()
  const first = group.accounts[0]
  const total = group.accounts.reduce((sum, a) => sum + balanceOf(a), 0)
  const count = group.accounts.length
  const isCredit = first.kind === 'credit'
  const available = isCredit ? group.accounts.reduce((sum, a) => sum + (a.limit ?? 0) + a.balance, 0) : 0
  const detail = isCredit
    ? `${masked ? '••••' : `$${Math.floor(available).toLocaleString('en-US')}`} available · Due ${CARD_PAYMENT_DUE}`
    : count > 1
      ? `${count} accounts`
      : null

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'openAccount', id: first.id })}
      aria-label={count > 1 ? `${group.label}, ${count} accounts` : undefined}
      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left active:bg-muted/60"
    >
      <AccountBadge account={first} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{group.label}</span>
        {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="tabular font-mono font-semibold">{masked ? '••••' : formatMoney(isCredit ? Math.abs(total) : total)}</span>
        {isCredit && <span className="text-xs text-muted-foreground">owed</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
