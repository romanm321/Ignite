import type { Transaction, Vault } from './bank-data'
import { TODAY, daysAgo, isSpend } from './insights'
import { monthlyDeposit } from './vaults'

const DAY_MS = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const dayOfMonth = TODAY.getDate()
export const daysInMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate()
export const monthName = MONTHS[TODAY.getMonth()]

/** "Nov 3" style label for a number of days before today. */
export function labelDaysAgo(n: number) {
  const d = new Date(TODAY.getTime() - n * DAY_MS)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** The balance at the end of each day of this month, up to today, worked back from the current balance. */
export function balanceSeries(currentBalance: number, txns: Transaction[]) {
  const points: { day: number; value: number }[] = []
  for (let day = 1; day <= dayOfMonth; day++) {
    const ago = dayOfMonth - day
    const after = txns.filter((t) => daysAgo(t.when) < ago).reduce((s, t) => s + t.amount, 0)
    points.push({ day, value: currentBalance - after })
  }
  return points
}

export function spentThisMonth(txns: Transaction[]) {
  return txns.filter((t) => isSpend(t) && daysAgo(t.when) < dayOfMonth).reduce((s, t) => s + Math.abs(t.amount), 0)
}

/** What the balance could be on the last day of the month if spending carries on at this month's pace. */
export function estimateEndOfMonth(currentBalance: number, txns: Transaction[]) {
  const perDay = spentThisMonth(txns) / Math.max(dayOfMonth, 1)
  return Math.max(0, currentBalance - perDay * (daysInMonth - dayOfMonth))
}

/** Spending per week for the last six weeks, oldest first. */
export function weeklySpending(txns: Transaction[], weeks = 6) {
  return Array.from({ length: weeks }, (_, i) => {
    const w = weeks - 1 - i
    const total = txns
      .filter((t) => isSpend(t) && Math.floor(daysAgo(t.when) / 7) === w)
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    return { label: labelDaysAgo(w * 7 + 6), total, current: w === 0 }
  })
}

export function spendingByCategory(txns: Transaction[]) {
  const totals = new Map<string, number>()
  for (const t of txns.filter((x) => isSpend(x) && daysAgo(x.when) < dayOfMonth)) {
    totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount))
  }
  return [...totals.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
}

export type VaultProgress = {
  vault: Vault
  pct: number
  /** Dollars the customer puts toward this Vault in a typical month. */
  monthly: number
  monthsLeft: number | null
}

export function vaultProgress(vaults: Vault[]): VaultProgress[] {
  return vaults.map((vault) => {
    const pct = vault.goal ? Math.min(100, (vault.balance / vault.goal) * 100) : 0
    const monthly = monthlyDeposit(vault) + 50
    const remaining = Math.max(0, vault.goal - vault.balance)
    return { vault, pct, monthly, monthsLeft: remaining === 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null }
  })
}
