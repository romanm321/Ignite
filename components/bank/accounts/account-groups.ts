import type { Account } from '@/lib/bank-data'

export type AccountGroup = { key: string; label: string; accounts: Account[] }

function groupOf(account: Account): { key: string; label: string } {
  if (account.id === 'student') return { key: 'student', label: 'Student Account' }
  if (account.kind === 'investment') return { key: 'investing', label: 'Investments' }
  if (account.kind === 'credit') return { key: 'credit', label: 'Credit Card' }
  // Savings accounts and CDs share one card, so they read as one place to keep money.
  if (account.kind === 'savings') return { key: 'savings', label: 'Savings' }
  return { key: 'checking', label: 'Checking' }
}

/** CDs sit in the Savings group but keep their own colour, so they stay apart when stacked. */
export const isCd = (account: Account) =>
  account.kind === 'savings' && (account.id === 'cd' || account.id === 'step-cd' || /CD/i.test(account.name))

export function groupKeyOf(account: Account) {
  return groupOf(account).key
}

/** Combines accounts of the same product type into one group, keeping the order they first appear in. */
export function groupAccounts(accounts: Account[]): AccountGroup[] {
  const groups: AccountGroup[] = []
  for (const account of accounts) {
    const { key, label } = groupOf(account)
    const existing = groups.find((g) => g.key === key)
    if (existing) existing.accounts.push(account)
    else groups.push({ key, label, accounts: [account] })
  }
  return groups
}
