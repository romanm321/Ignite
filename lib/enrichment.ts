import type { Transaction } from './bank-data'

export type Confidence = 'Very high' | 'High' | 'Medium' | 'Low'

export type SubscriptionInfo = {
  id: string
  plan: string
  cadence: 'Monthly' | 'Annual'
  nextDate: string
  since: string
  canPause: boolean
  insight?: { tone: 'warn' | 'info'; text: string }
}

export type Enrichment = {
  name: string
  legalName: string
  domain?: string
  brandColor: string
  descriptor: string
  primary: string
  detailed: string
  confidence: Confidence
  channel: 'In store' | 'Online' | 'Contactless' | 'Direct deposit' | 'Autopay' | 'Transfer'
  mcc?: string
  location?: { address: string; city: string; hours?: string }
  phone?: string
  card: string
  time: string
  history: { month: string; amount: number }[]
  visits: number
  insight?: string
  subscription?: SubscriptionInfo
  pending?: boolean
}

const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const hist = (values: number[]) => values.map((amount, i) => ({ month: months[i], amount }))

const CREDIT = 'TD Double Up Visa ••4821'
const DEBIT = 'TD Debit ••7710'

export const enrichments: Record<string, Enrichment> = {
  'Blue Bottle Coffee': {
    name: 'Blue Bottle Coffee',
    legalName: 'Blue Bottle Coffee, LLC',
    domain: 'bluebottlecoffee.com',
    brandColor: '#1F5FA8',
    descriptor: 'SQ *BLUE BOTTLE COF 0423 NEW YORK NY',
    primary: 'Food & drink',
    detailed: 'Coffee shop',
    confidence: 'Very high',
    channel: 'Contactless',
    mcc: '5814 · Fast food & cafés',
    location: { address: '54 W 40th St', city: 'New York, NY 10018', hours: 'Open until 6 PM' },
    phone: '(510) 653-3394',
    card: CREDIT,
    time: 'Today, 8:02 AM',
    history: hist([38, 42, 31, 47, 52, 41]),
    visits: 9,
    insight: 'Your most-visited merchant this month. 9 visits, avg $6.40.',
    pending: true,
  },
  'Whole Foods Market': {
    name: 'Whole Foods Market',
    legalName: 'Whole Foods Market IP, L.P. (Amazon)',
    domain: 'wholefoodsmarket.com',
    brandColor: '#00674B',
    descriptor: 'WHOLEFDS BRY 10234 NEW YORK NY',
    primary: 'Groceries',
    detailed: 'Supermarket',
    confidence: 'Very high',
    channel: 'In store',
    mcc: '5411 · Grocery stores',
    location: { address: '1095 6th Ave', city: 'New York, NY 10036', hours: 'Open until 10 PM' },
    phone: '(917) 728-5700',
    card: DEBIT,
    time: 'Today, 9:14 AM',
    history: hist([312, 288, 341, 296, 330, 251]),
    visits: 4,
    insight: 'Groceries are trending 12% under your 6-month average.',
  },
  'Payroll · Northwind Labs': {
    name: 'Northwind Labs',
    legalName: 'Northwind Labs, Inc.',
    brandColor: '#334155',
    descriptor: 'NORTHWIND LABS DIR DEP PPD ID: 9182736450',
    primary: 'Income',
    detailed: 'Payroll',
    confidence: 'Very high',
    channel: 'Direct deposit',
    card: 'TD Complete Checking ••0192',
    time: 'Yesterday, 2:00 AM',
    history: hist([7840, 7840, 7840, 7840, 7840, 7840]),
    visits: 2,
    insight: 'Arrived 1 day early with TD Early Pay.',
  },
  'MTA OMNY': {
    name: 'MTA OMNY',
    legalName: 'Metropolitan Transportation Authority',
    domain: 'omny.info',
    brandColor: '#0039A6',
    descriptor: 'MTA*NYCT PAYGO NEW YORK NY',
    primary: 'Transportation',
    detailed: 'Public transit',
    confidence: 'High',
    channel: 'Contactless',
    mcc: '4111 · Commuter transport',
    location: { address: 'Bryant Park – 42 St station', city: 'New York, NY' },
    card: CREDIT,
    time: 'Yesterday, 6:41 PM',
    history: hist([132, 128, 126, 131, 129, 102]),
    visits: 36,
    insight: 'You hit the weekly fare cap twice this month. Extra rides were free.',
  },
  Netflix: {
    name: 'Netflix',
    legalName: 'Netflix, Inc.',
    domain: 'netflix.com',
    brandColor: '#E50914',
    descriptor: 'NETFLIX.COM 866-579-7172 CA',
    primary: 'Entertainment',
    detailed: 'Streaming video',
    confidence: 'Very high',
    channel: 'Autopay',
    mcc: '4899 · Cable & streaming',
    phone: '(866) 579-7172',
    card: CREDIT,
    time: 'Oct 23, 12:00 AM',
    history: hist([15.49, 15.49, 15.49, 17.99, 17.99, 17.99]),
    visits: 1,
    subscription: {
      id: 'netflix',
      plan: 'Standard',
      cadence: 'Monthly',
      nextDate: 'Nov 23',
      since: 'Mar 2019',
      canPause: false,
      insight: { tone: 'warn', text: 'Price went up from $15.49 to $17.99 in August.' },
    },
  },
  'Uniqlo SoHo': {
    name: 'Uniqlo',
    legalName: 'Fast Retailing USA, Inc.',
    domain: 'uniqlo.com',
    brandColor: '#E60012',
    descriptor: 'UNIQLO USA 0187 546 BROADWAY NY',
    primary: 'Shopping',
    detailed: 'Clothing & accessories',
    confidence: 'Very high',
    channel: 'In store',
    mcc: '5651 · Family clothing',
    location: { address: '546 Broadway', city: 'New York, NY 10012', hours: 'Open until 9 PM' },
    phone: '(877) 486-4756',
    card: CREDIT,
    time: 'Oct 22, 3:18 PM',
    history: hist([0, 64, 0, 0, 42, 129.6]),
    visits: 1,
  },
  Lucali: {
    name: 'Lucali',
    legalName: 'Lucali Pizza Inc.',
    domain: 'lucali.com',
    brandColor: '#7C2D12',
    descriptor: 'TST* LUCALI BROOKLYN NY',
    primary: 'Food & drink',
    detailed: 'Restaurant · Pizza',
    confidence: 'High',
    channel: 'In store',
    mcc: '5812 · Restaurants',
    location: { address: '575 Henry St', city: 'Brooklyn, NY 11231', hours: 'Opens 5:45 PM' },
    card: CREDIT,
    time: 'Oct 21, 8:47 PM',
    history: hist([0, 52.1, 0, 61.3, 0, 58.4]),
    visits: 1,
    insight: 'Earned 175 TD Points (3x on dining).',
  },
  'Con Edison': {
    name: 'Con Edison',
    legalName: 'Consolidated Edison Co. of New York',
    domain: 'coned.com',
    brandColor: '#0067B1',
    descriptor: 'CONED BILL PAYMT 800-752-6633',
    primary: 'Bills & utilities',
    detailed: 'Gas & electric',
    confidence: 'Very high',
    channel: 'Autopay',
    mcc: '4900 · Utilities',
    phone: '(800) 752-6633',
    card: 'TD Complete Checking ••0192',
    time: 'Oct 20, 6:00 AM',
    history: hist([71.2, 118.4, 142.9, 131.6, 88.3, 96.12]),
    visits: 1,
    insight: 'Recurring bill. Tends to rise in summer, so we smooth this in your forecast.',
  },
  Spotify: {
    name: 'Spotify',
    legalName: 'Spotify USA Inc.',
    domain: 'spotify.com',
    brandColor: '#1DB954',
    descriptor: 'Spotify P2A3B4C5D6 NEW YORK NY',
    primary: 'Entertainment',
    detailed: 'Music streaming',
    confidence: 'Very high',
    channel: 'Autopay',
    mcc: '5815 · Digital media',
    card: CREDIT,
    time: 'Oct 19, 12:00 AM',
    history: hist([11.99, 11.99, 11.99, 11.99, 11.99, 11.99]),
    visits: 1,
    subscription: {
      id: 'spotify',
      plan: 'Premium Individual',
      cadence: 'Monthly',
      nextDate: 'Nov 19',
      since: 'Jun 2021',
      canPause: false,
    },
  },
  Peloton: {
    name: 'Peloton',
    legalName: 'Peloton Interactive, Inc.',
    domain: 'onepeloton.com',
    brandColor: '#181A1D',
    descriptor: 'PELOTON* MEMBERSHIP 866-679-9129 NY',
    primary: 'Health & fitness',
    detailed: 'Fitness membership',
    confidence: 'Very high',
    channel: 'Autopay',
    mcc: '7997 · Clubs & memberships',
    phone: '(866) 679-9129',
    card: CREDIT,
    time: 'Oct 15, 12:00 AM',
    history: hist([0, 0, 0, 0, 44, 44]),
    visits: 1,
    subscription: {
      id: 'peloton',
      plan: 'All-Access',
      cadence: 'Monthly',
      nextDate: 'Nov 15',
      since: 'Sep 2026',
      canPause: true,
      insight: { tone: 'warn', text: 'Free trial ended Sep 15 and became a paid plan.' },
    },
  },
  'The New York Times': {
    name: 'The New York Times',
    legalName: 'The New York Times Company',
    domain: 'nytimes.com',
    brandColor: '#111111',
    descriptor: 'NYTIMES*NYTDIGITALSUB 800-698-4637',
    primary: 'Entertainment',
    detailed: 'News subscription',
    confidence: 'Very high',
    channel: 'Autopay',
    mcc: '5994 · News dealers',
    phone: '(800) 698-4637',
    card: DEBIT,
    time: 'Oct 12, 12:00 AM',
    history: hist([17, 17, 25, 25, 25, 25]),
    visits: 1,
    subscription: {
      id: 'nyt',
      plan: 'All Access Digital',
      cadence: 'Monthly',
      nextDate: 'Nov 12',
      since: 'Jan 2025',
      canPause: true,
      insight: { tone: 'warn', text: 'Intro rate ended in July. Price jumped 47%, from $17 to $25.' },
    },
  },
}

export function enrich(t: Transaction): Enrichment {
  const known = enrichments[t.merchant]
  if (known) return known
  const isTransfer = t.category === 'Transfer'
  return {
    name: t.merchant,
    legalName: isTransfer ? 'TD Bank, N.A.' : t.merchant,
    brandColor: '#0B3D2E',
    descriptor: t.merchant.toUpperCase(),
    primary: isTransfer ? 'Transfer' : t.category,
    detailed: isTransfer ? 'Between your accounts or people' : t.category,
    confidence: 'Medium',
    channel: isTransfer ? 'Transfer' : 'Online',
    card: 'TD Complete Checking ••0192',
    time: t.when,
    history: hist([0, 0, 0, 0, 0, Math.abs(t.amount)]),
    visits: 1,
  }
}

export function isDisputable(t: Transaction) {
  return t.amount < 0 && t.category !== 'Transfer'
}

export const disputeReasons = [
  { id: 'unauthorized', label: "I didn't make this purchase", hint: 'We lock your card and issue a new number.' },
  { id: 'amount', label: 'I was charged the wrong amount', hint: 'Tell us what you expected to pay.' },
  { id: 'duplicate', label: 'I was charged twice', hint: 'We match it against your other charges.' },
  { id: 'not-received', label: "I didn't get what I paid for", hint: 'Item or service never arrived.' },
  { id: 'canceled', label: 'I canceled but was still charged', hint: 'Common with subscriptions.' },
  { id: 'refund', label: 'My return was never credited', hint: 'Merchants have 10 days to post refunds.' },
] as const

export type DisputeReason = (typeof disputeReasons)[number]['id']

export const paymentCards = [
  { id: 'credit', label: CREDIT, detail: 'Earns 2% back' },
  { id: 'virtual', label: 'Virtual card ••3391', detail: 'Subscriptions only · lock anytime' },
  { id: 'debit', label: DEBIT, detail: 'Pulls from checking' },
] as const
