import type { Account, Transaction } from './bank-data'

export type TierId = 'member' | 'select' | 'premier' | 'wealth'

export type Tier = {
  id: TierId
  name: string
  /** Combined deposits and investments needed to qualify. */
  min: number
  /** Percentage points added to savings APY. */
  apyBoost: number
  /** Extra cash back percentage points on credit card spend. */
  cardBoost: number
  /** Cash back percentage on debit spend. */
  debitRate: number
  /** Percentage points taken off loan APRs. */
  loanDiscount: number
  /** Dollars of monthly fees waived. */
  monthlyFeeWaived: number
  fees: string
  service: string
  banker: string
  /** Reads naturally after "unlocks" or "plus". */
  unlock: string
}

export const tiers: Tier[] = [
  {
    id: 'member',
    name: 'Member',
    min: 0,
    apyBoost: 0,
    cardBoost: 0,
    debitRate: 0.5,
    loanDiscount: 0,
    monthlyFeeWaived: 0,
    fees: 'Standard fees',
    service: 'Tedi and phone support, 24/7',
    banker: 'Tedi, your AI banker',
    unlock: 'Tedi, your AI banker',
  },
  {
    id: 'select',
    name: 'Select',
    min: 25000,
    apyBoost: 0.1,
    cardBoost: 0.25,
    debitRate: 1,
    loanDiscount: 0.25,
    monthlyFeeWaived: 12,
    fees: 'Monthly fee waived',
    service: 'Priority phone and chat line',
    banker: 'Branch advisor on request',
    unlock: 'priority phone and chat support',
  },
  {
    id: 'premier',
    name: 'Premier',
    min: 75000,
    apyBoost: 0.25,
    cardBoost: 0.5,
    debitRate: 1.5,
    loanDiscount: 0.5,
    monthlyFeeWaived: 22,
    fees: 'Fees, ATM charges and domestic wires waived',
    service: 'Priority line, no hold times',
    banker: 'Dedicated Premier banker',
    unlock: 'a dedicated Premier banker',
  },
  {
    id: 'wealth',
    name: 'Wealth',
    min: 250000,
    apyBoost: 0.4,
    cardBoost: 1,
    debitRate: 2,
    loanDiscount: 0.75,
    monthlyFeeWaived: 32,
    fees: 'All fees waived, worldwide ATM rebates',
    service: 'Private line and concierge',
    banker: 'Wealth banker and advisory team',
    unlock: 'a wealth banker and advisory team',
  },
]

export const tierById = (id: TierId) => tiers.find((t) => t.id === id) ?? tiers[0]

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const formatWhole = (n: number) => usd0.format(Math.round(n))

export const formatPct = (n: number) => `${parseFloat(n.toFixed(2))}%`

const SAMPLE_LOAN = { principal: 25000, months: 60, apr: 9.49 }

function payment(principal: number, apr: number, months: number) {
  const r = apr / 100 / 12
  return r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months))
}

export function loanSavings(discount: number) {
  const { principal, months, apr } = SAMPLE_LOAN
  return Math.round(payment(principal, apr, months) * months - payment(principal, apr - discount, months) * months)
}

export const sampleLoan = SAMPLE_LOAN
export const loanPayment = payment

export type Benefit = { id: string; label: string; detail: string; yearly: number | null }

const nonSpend = new Set<Transaction['category']>(['Transfer', 'Income'])

function spendOn(transactions: Transaction[], accountIds: Set<string>) {
  return transactions
    .filter((t) => accountIds.has(t.accountId ?? 'chk') && t.amount < 0 && !nonSpend.has(t.category))
    .reduce((s, t) => s + Math.abs(t.amount), 0)
}

export function benefitsFor(tier: Tier, ctx: { savings: number; cardSpend: number; debitSpend: number }) {
  const apy = (ctx.savings * tier.apyBoost) / 100
  const card = (ctx.cardSpend * 12 * tier.cardBoost) / 100
  const debit = (ctx.debitSpend * 12 * tier.debitRate) / 100
  const fees = tier.monthlyFeeWaived * 12
  return { apy, card, debit, fees, total: apy + card + debit + fees }
}

export function computeRelationship(input: {
  accounts: Account[]
  transactions: Transaction[]
  invested: number
  investOpened: boolean
}) {
  const { accounts, transactions, invested, investOpened } = input
  const banking = accounts.filter((a) => a.kind !== 'credit')
  const credit = accounts.filter((a) => a.kind === 'credit')
  const checking = banking.filter((a) => a.kind === 'checking')
  const savings = banking.filter((a) => a.kind === 'savings' && !/CD/i.test(a.name))
  const cds = banking.filter((a) => a.kind === 'savings' && /CD/i.test(a.name))

  const deposits = banking.reduce((s, a) => s + a.balance, 0)
  const owed = credit.reduce((s, a) => s + Math.abs(a.balance), 0)
  const qualifying = deposits + invested

  const tierIndex = tiers.reduce((idx, t, i) => (qualifying >= t.min ? i : idx), 0)
  const tier = tiers[tierIndex]
  const next = tiers[tierIndex + 1] ?? null
  const progress = next ? (qualifying - tier.min) / (next.min - tier.min) : 1

  const ctx = {
    savings: savings.reduce((s, a) => s + a.balance, 0),
    cardSpend: spendOn(transactions, new Set(credit.map((a) => a.id))),
    debitSpend: spendOn(transactions, new Set(checking.map((a) => a.id))),
  }

  const current = benefitsFor(tier, ctx)
  const upcoming = next ? benefitsFor(next, ctx) : null

  const composition = [
    { id: 'checking', label: 'Checking', value: checking.reduce((s, a) => s + a.balance, 0), tone: 'bg-primary' },
    { id: 'savings', label: 'Savings', value: savings.reduce((s, a) => s + a.balance, 0), tone: 'bg-lime' },
    { id: 'cds', label: 'CDs', value: cds.reduce((s, a) => s + a.balance, 0), tone: 'bg-forest' },
    { id: 'investing', label: 'Investing', value: invested, tone: 'bg-accent-foreground/60' },
  ].filter((c) => c.value > 0)

  const coverage = [
    { id: 'deposits', label: 'Deposits', done: banking.length > 0 },
    { id: 'cards', label: 'Cards', done: credit.length > 0 },
    { id: 'lending', label: 'Lending', done: false },
    { id: 'wealth', label: 'Wealth', done: investOpened || invested > 0 },
  ]

  return {
    tier,
    tierIndex,
    next,
    progress,
    toGo: next ? Math.max(next.min - qualifying, 0) : 0,
    deposits,
    owed,
    invested,
    qualifying,
    ctx,
    current,
    upcoming,
    uplift: upcoming ? upcoming.total - current.total : 0,
    composition,
    coverage,
  }
}

export type Relationship = ReturnType<typeof computeRelationship>

export type OfferCategory = 'Dining' | 'Shopping' | 'Local'

export type DealOffer = {
  id: string
  merchant: string
  /** Substring matched against transaction merchants to personalise and compute earnings. */
  match: string
  category: OfferCategory
  rate: number
  area: string
  cap: number
  needsActivation: boolean
}

export const dealOffers: DealOffer[] = [
  { id: 'lucali', merchant: 'Lucali', match: 'Lucali', category: 'Dining', rate: 8, area: 'Carroll Gardens', cap: 20, needsActivation: false },
  { id: 'blue-bottle', merchant: 'Blue Bottle Coffee', match: 'Blue Bottle', category: 'Dining', rate: 5, area: '7 spots near you', cap: 10, needsActivation: true },
  { id: 'sweetgreen', merchant: 'Sweetgreen', match: 'Sweetgreen', category: 'Dining', rate: 10, area: 'Midtown and Flatiron', cap: 15, needsActivation: true },
  { id: 'uniqlo', merchant: 'Uniqlo', match: 'Uniqlo', category: 'Shopping', rate: 6, area: 'In store and online', cap: 30, needsActivation: true },
  { id: 'sephora', merchant: 'Sephora', match: 'Sephora', category: 'Shopping', rate: 7, area: 'Online', cap: 25, needsActivation: true },
  { id: 'cleaners', merchant: 'Mercer Street Cleaners', match: 'Mercer Street', category: 'Local', rate: 15, area: 'SoHo, 0.2 mi away', cap: 15, needsActivation: true },
  { id: 'bikes', merchant: 'Kings County Bike Co.', match: 'Kings County', category: 'Local', rate: 12, area: 'Brooklyn, 1.4 mi away', cap: 25, needsActivation: true },
]

export function offerSpend(offer: DealOffer, transactions: Transaction[]) {
  return transactions
    .filter((t) => t.amount < 0 && t.merchant.toLowerCase().includes(offer.match.toLowerCase()))
    .reduce((s, t) => s + Math.abs(t.amount), 0)
}

export function offerEarned(offer: DealOffer, transactions: Transaction[]) {
  return Math.min(Math.round(offerSpend(offer, transactions) * offer.rate) / 100, offer.cap)
}

export const shopStores = [
  { name: 'Nike', rate: 5 },
  { name: 'Target', rate: 4 },
  { name: 'Expedia', rate: 6 },
  { name: 'Best Buy', rate: 3 },
  { name: 'Apple', rate: 2 },
]
