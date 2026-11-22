import type { Transaction } from './bank-data'
import { labelDaysAgo } from './insights-view'

export type ExternalAccount = {
  id: string
  institutionId: string
  institution: string
  name: string
  mask: string
  balance: number
}

export const institutions = [
  { id: 'chase', name: 'Chase', color: 'bg-sky-700 text-white', accountName: 'Total Checking', mask: '3901', balance: 3180.42 },
  { id: 'bofa', name: 'Bank of America', color: 'bg-red-600 text-white', accountName: 'Advantage Banking', mask: '7714', balance: 1264.18 },
  { id: 'wells', name: 'Wells Fargo', color: 'bg-amber-500 text-black', accountName: 'Everyday Checking', mask: '2208', balance: 2045.77 },
  { id: 'citi', name: 'Citi', color: 'bg-blue-600 text-white', accountName: 'Access Account', mask: '5532', balance: 987.3 },
  { id: 'capone', name: 'Capital One', color: 'bg-slate-800 text-white', accountName: '360 Checking', mask: '1186', balance: 4410.05 },
] as const

export type InstitutionId = (typeof institutions)[number]['id']

const spendingPattern: { merchant: string; category: Transaction['category']; amount: number; every: number; offset: number }[] = [
  { merchant: 'Trader Joe’s', category: 'Groceries', amount: 64.2, every: 6, offset: 1 },
  { merchant: 'Shake Shack', category: 'Dining', amount: 22.85, every: 5, offset: 2 },
  { merchant: 'Uber', category: 'Transport', amount: 18.4, every: 4, offset: 0 },
  { merchant: 'Target', category: 'Shopping', amount: 47.1, every: 9, offset: 3 },
  { merchant: 'Spotify', category: 'Bills', amount: 11.99, every: 29, offset: 6 },
  { merchant: 'Con Edison', category: 'Bills', amount: 88.5, every: 31, offset: 12 },
]

/** Stands in for the transactions an aggregator would hand back once an account is linked. */
export function buildExternalTransactions(accountId: string): Transaction[] {
  const out: Transaction[] = []
  for (let ago = 0; ago < 40; ago++) {
    for (const p of spendingPattern) {
      if ((ago + p.offset) % p.every === 0) {
        out.push({
          id: `${accountId}-${ago}-${p.merchant}`,
          accountId,
          merchant: p.merchant,
          category: p.category,
          amount: -Math.round((p.amount + ((ago * 7) % 9)) * 100) / 100,
          when: labelDaysAgo(ago),
        })
      }
    }
  }
  return out
}
