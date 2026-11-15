import { customer, type Transaction } from './bank-data'

export const POINTS_PER_DOLLAR = 100
export const INITIAL_REWARDS_BALANCE = customer.points / POINTS_PER_DOLLAR
export const STATEMENT_CLOSES = 'Nov 28'

export type EarnRule = { category: Transaction['category'] | 'other'; label: string; rate: number }

const cardRules: Record<string, EarnRule[]> = {
  cc: [
    { category: 'Dining', label: 'Dining & coffee', rate: 0.03 },
    { category: 'Groceries', label: 'Groceries', rate: 0.03 },
    { category: 'Travel', label: 'Travel', rate: 0.03 },
    { category: 'other', label: 'Everything else', rate: 0.02 },
  ],
  'double-up': [{ category: 'other', label: 'Every purchase', rate: 0.02 }],
}

const defaultRules: EarnRule[] = [{ category: 'other', label: 'Every purchase', rate: 0.02 }]

const nonEarning = new Set<Transaction['category']>(['Transfer', 'Income'])

export function earnRules(cardId: string) {
  return cardRules[cardId] ?? defaultRules
}

export type Reward = { amount: number; rate: number }

export function rewardFor(txn: Transaction, cardId: string): Reward | null {
  if (txn.amount >= 0 || nonEarning.has(txn.category)) return null
  const rules = earnRules(cardId)
  const rule = rules.find((r) => r.category === txn.category) ?? rules.find((r) => r.category === 'other')
  if (!rule) return null
  return { amount: Math.round(Math.abs(txn.amount) * rule.rate * 100) / 100, rate: rule.rate }
}

export const formatRate = (rate: number) => `${Math.round(rate * 100)}%`
