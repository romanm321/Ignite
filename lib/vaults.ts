import type { Transaction, Vault } from './bank-data'

export const SELECT_WITHDRAWALS_PER_YEAR = 2
export const NEXT_PAYDAY = 'Nov 15'
export const PAYCHECK = 3920
export const PAYCHECK_FROM = 'Northwind Labs'

export const accessTypes = {
  instant: {
    label: 'Instant Access',
    short: 'Instant',
    rate: 4.1,
    detail: 'Withdraw any time, as often as you like.',
  },
  select: {
    label: 'Select Access',
    short: 'Select',
    rate: 4.6,
    detail: `Higher rate. Up to ${SELECT_WITHDRAWALS_PER_YEAR} withdrawals per vault each year.`,
  },
} as const

export type Tier = { id: 'starter' | 'plus' | 'premier'; name: string; min: number; bonus: number }

export const tiers: Tier[] = [
  { id: 'starter', name: 'Starter', min: 0, bonus: 0 },
  { id: 'plus', name: 'Plus', min: 10000, bonus: 0.1 },
  { id: 'premier', name: 'Premier', min: 50000, bonus: 0.25 },
]

export function tierFor(total: number) {
  const index = tiers.reduce((best, t, i) => (total >= t.min ? i : best), 0)
  return { tier: tiers[index], next: tiers[index + 1] ?? null }
}

export const vaultTotal = (vaults: Vault[]) => vaults.reduce((s, v) => s + v.balance, 0)

/** Recomputes every vault's APY from its access type plus the tier bonus earned by the combined balance. */
export function withRates(vaults: Vault[]): Vault[] {
  const { tier } = tierFor(vaultTotal(vaults))
  return vaults.map((v) => ({ ...v, apy: Math.round((accessTypes[v.access].rate + tier.bonus) * 100) / 100 }))
}

export function blendedApy(vaults: Vault[]) {
  const total = vaultTotal(vaults)
  if (!total) return 0
  return vaults.reduce((s, v) => s + v.balance * v.apy, 0) / total
}

export function withdrawBlock(v: Vault): string | null {
  if (v.lockedUntil) return `Locked until ${v.lockedUntil}`
  if (v.access === 'select' && v.withdrawalsUsed >= SELECT_WITHDRAWALS_PER_YEAR)
    return 'Both Select Access withdrawals used this year'
  return null
}

export const lockOptions = [
  { id: '1m', label: '1 month', until: 'Dec 8, 2026' },
  { id: '3m', label: '3 months', until: 'Feb 8, 2027' },
  { id: '6m', label: '6 months', until: 'May 8, 2027' },
  { id: '12m', label: '1 year', until: 'Nov 8, 2027' },
] as const

const roundable = new Set<Transaction['category']>(['Dining', 'Groceries', 'Transport', 'Shopping', 'Travel'])

/** Spare change from card-style purchases, rounded up to the next dollar. */
export function roundUpsThisMonth(transactions: Transaction[]) {
  const total = transactions
    .filter((t) => t.amount < 0 && roundable.has(t.category))
    .reduce((s, t) => {
      const spend = Math.abs(t.amount)
      return s + (Math.ceil(spend) - spend)
    }, 0)
  return Math.round(total * 100) / 100
}
