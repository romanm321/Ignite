import type { DepositFrequency, Transaction, Vault } from './bank-data'

export const SELECT_WITHDRAWALS_PER_YEAR = 2
export const NEXT_PAYDAY = 'Nov 23'
export const PAYCHECK = 3920
export const PAYCHECK_FROM = 'Northwind Labs'

export const accessTypes = {
  instant: {
    label: 'Instant Access',
    short: 'Instant',
    rate: 4.1,
    detail: 'Take money out anytime.',
  },
  select: {
    label: 'Select Access',
    short: 'Select',
    rate: 4.6,
    detail: `Higher rate. ${SELECT_WITHDRAWALS_PER_YEAR} withdrawals a year.`,
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

export const isRegularVault = (v: Vault) => v.kind === 'regular'

/** What sits in Savings Vaults. Regular Vaults are held against Everyday Checking, so they do not count here. */
export const vaultTotal = (vaults: Vault[]) => vaults.filter((v) => !isRegularVault(v)).reduce((s, v) => s + v.balance, 0)

export const regularVaultTotal = (vaults: Vault[]) => vaults.filter(isRegularVault).reduce((s, v) => s + v.balance, 0)

/** Recomputes every vault's APY from its access type plus the tier bonus earned by the combined balance. */
export function withRates(vaults: Vault[]): Vault[] {
  const { tier } = tierFor(vaultTotal(vaults))
  return vaults.map((v) => ({ ...v, apy: isRegularVault(v) ? 0 : Math.round((accessTypes[v.access].rate + tier.bonus) * 100) / 100 }))
}

export function blendedApy(vaults: Vault[]) {
  const total = vaultTotal(vaults)
  if (!total) return 0
  return vaults.filter((v) => !isRegularVault(v)).reduce((s, v) => s + v.balance * v.apy, 0) / total
}

export function withdrawBlock(v: Vault): string | null {
  if (v.lockedUntil) return `Locked until ${v.lockedUntil}`
  if (v.access === 'select' && v.withdrawalsUsed >= SELECT_WITHDRAWALS_PER_YEAR)
    return 'No withdrawals left this year'
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

export const depositSchedules: Record<DepositFrequency, { label: string; next: string; perMonth: number }> = {
  weekly: { label: 'Weekly', next: 'Nov 17', perMonth: 52 / 12 },
  biweekly: { label: 'Bi-weekly', next: 'Nov 24', perMonth: 26 / 12 },
  monthly: { label: 'Monthly', next: 'Dec 1', perMonth: 1 },
}

export const depositAmounts = [25, 50, 100, 250] as const

export const frequencyOf = (v: Pick<Vault, 'frequency'>): DepositFrequency => v.frequency ?? 'biweekly'

/** What a Vault's scheduled deposit adds up to in a typical month. */
export const monthlyDeposit = (v: Pick<Vault, 'salarySort' | 'frequency'>) => v.salarySort * depositSchedules[frequencyOf(v)].perMonth

/** The share of one bi-weekly paycheck a Vault's scheduled deposit takes, for the safe-to-spend maths. */
export const perPaycheckDeposit = (v: Pick<Vault, 'salarySort' | 'frequency'>) => monthlyDeposit(v) / depositSchedules.biweekly.perMonth
