import { spendingByCategory } from './bank-data'

export type RiskLevel = 1 | 2 | 3 | 4 | 5
export type SecurityKind = 'Treasury ETF' | 'Bond ETF' | 'Index ETF' | 'Stock'

export type Security = {
  symbol: string
  name: string
  kind: SecurityKind
  price: number
  dayChange: number
  /** Typical one-year range used for the "what could happen" view, as decimals. */
  range: { bad: number; typical: number; good: number }
  risk: RiskLevel
  plain: string
  yield?: number
  domain?: string
}

export const securities: Security[] = [
  {
    symbol: 'SGOV',
    name: 'iShares 0–3 Month Treasury ETF',
    kind: 'Treasury ETF',
    price: 100.48,
    dayChange: 0.01,
    range: { bad: 0.045, typical: 0.05, good: 0.052 },
    risk: 1,
    yield: 5.0,
    plain: 'Short-term loans to the US government. Steady like a CD, but you can sell any weekday and it’s free of state tax.',
  },
  {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market',
    kind: 'Bond ETF',
    price: 72.9,
    dayChange: -0.12,
    range: { bad: -0.06, typical: 0.045, good: 0.1 },
    risk: 2,
    yield: 3.7,
    plain: 'Thousands of US government and company bonds in one buy. Pays interest monthly and moves less than stocks.',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    kind: 'Index ETF',
    price: 512.3,
    dayChange: 0.64,
    range: { bad: -0.18, typical: 0.08, good: 0.26 },
    risk: 3,
    plain: 'A slice of the 500 biggest US companies in one buy. The classic way to grow money you won’t need for 5+ years.',
  },
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market',
    kind: 'Index ETF',
    price: 268.1,
    dayChange: 0.58,
    range: { bad: -0.19, typical: 0.08, good: 0.27 },
    risk: 3,
    plain: 'Nearly every public US company, big and small. Maximum spread, one low-cost fund.',
  },
  {
    symbol: 'VXUS',
    name: 'Vanguard Total International',
    kind: 'Index ETF',
    price: 61.2,
    dayChange: 0.31,
    range: { bad: -0.2, typical: 0.06, good: 0.24 },
    risk: 3,
    plain: 'Companies outside the US, from Toyota to Nestlé. Balances out a US-heavy portfolio.',
  },
  {
    symbol: 'TD',
    name: 'Toronto-Dominion Bank',
    kind: 'Stock',
    price: 61.85,
    dayChange: 0.42,
    range: { bad: -0.25, typical: 0.07, good: 0.3 },
    risk: 4,
    yield: 5.1,
    plain: 'Yes, us. One of North America’s largest banks, known for a dividend paid every quarter since 1857.',
    domain: 'td.com',
  },
  {
    symbol: 'AAPL',
    name: 'Apple',
    kind: 'Stock',
    price: 228.4,
    dayChange: -0.38,
    range: { bad: -0.3, typical: 0.1, good: 0.4 },
    risk: 4,
    plain: 'iPhone, Mac and a fast-growing services business. A single company, so bigger swings than a fund.',
    domain: 'apple.com',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA',
    kind: 'Stock',
    price: 132.6,
    dayChange: 2.91,
    range: { bad: -0.5, typical: 0.12, good: 0.8 },
    risk: 5,
    plain: 'The chips behind most AI. Huge growth, and it can drop 30% in a month. Size it like a splurge, not a savings plan.',
    domain: 'nvidia.com',
  },
]

export const securityBySymbol = Object.fromEntries(securities.map((s) => [s.symbol, s])) as Record<string, Security>

export const riskLabels: Record<RiskLevel, string> = {
  1: 'Very steady',
  2: 'Steady',
  3: 'Moderate swings',
  4: 'Big swings',
  5: 'Wild ride',
}

export const monthlySpend = spendingByCategory.reduce((s, c) => s + c.amount, 0)
/** Checking cushion we never invest: about two months of everyday spending, rounded up. */
export const CHECKING_CUSHION = Math.ceil((monthlySpend * 2) / 500) * 500

export const cdMaturity = {
  accountId: 'cd',
  rate: 4.25,
  renewRate: 3.9,
  daysLeft: 21,
}

export type CdChoice = 'renew' | 'treasury' | 'split'

export const cdChoices: { id: CdChoice; title: string; detail: string; rate: string }[] = [
  { id: 'renew', title: 'Renew as a 12-month CD', detail: 'FDIC insured, locked until next year', rate: `${cdMaturity.renewRate.toFixed(2)}% APY` },
  { id: 'treasury', title: 'Move into US Treasuries', detail: 'Government-backed, sell any weekday, no state tax', rate: '~5.00% yield' },
  { id: 'split', title: 'Split it 50/50', detail: 'Half stays a CD, half goes to Treasuries', rate: '~4.45% blended' },
]

export type Timeline = 'soon' | 'mid' | 'long'
export type DropReaction = 'sell' | 'wait' | 'buy'
export type Experience = 'new' | 'some' | 'lots'
export type InvestorStyle = 'steady' | 'balanced' | 'growth'

export type InvestProfile = { timeline: Timeline; drop: DropReaction; experience: Experience; style: InvestorStyle }

export function styleFor(timeline: Timeline, drop: DropReaction): InvestorStyle {
  if (timeline === 'soon' || drop === 'sell') return 'steady'
  if (timeline === 'long' && drop === 'buy') return 'growth'
  return 'balanced'
}

export const styleCopy: Record<InvestorStyle, { label: string; picks: string[]; body: string }> = {
  steady: {
    label: 'Steady',
    picks: ['SGOV', 'BND'],
    body: 'You might need this money soon, so we’ll lead with options that barely move and still beat most savings rates.',
  },
  balanced: {
    label: 'Balanced',
    picks: ['VOO', 'BND', 'SGOV'],
    body: 'A mix of growth and stability. Most people start with one broad fund and add from there.',
  },
  growth: {
    label: 'Growth',
    picks: ['VTI', 'VOO', 'VXUS'],
    body: 'You’ve got time and a strong stomach. Broad stock funds are the engine. Single stocks are the seasoning.',
  },
}

export type Holding = { shares: number; cost: number }

export const WEALTH_THRESHOLD = 100000
