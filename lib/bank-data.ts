export type Account = {
  id: string
  name: string
  kind: 'checking' | 'savings' | 'credit' | 'investment'
  balance: number
  mask: string
  limit?: number
}

export type Transaction = {
  id: string
  /** Defaults to the primary checking account when omitted. */
  accountId?: string
  merchant: string
  category: 'Dining' | 'Groceries' | 'Transport' | 'Shopping' | 'Bills' | 'Income' | 'Travel' | 'Transfer'
  amount: number
  when: string
  currency?: string
}

export type Wallet = {
  code: string
  name: string
  balance: number
  /** Units of this currency per 1 USD (interbank mid-market) */
  perUsd: number
}

export type DepositFrequency = 'weekly' | 'biweekly' | 'monthly'

export type Vault = {
  id: string
  name: string
  balance: number
  goal: number
  apy: number
  tone: 'green' | 'lime' | 'ink' | 'sky'
  access: 'instant' | 'select'
  /** Select Access withdrawals used this calendar year (max 2). */
  withdrawalsUsed: number
  lockedUntil: string | null
  /** Dollars moved into this Vault on each scheduled deposit. Zero means no schedule. */
  salarySort: number
  /** How often the scheduled deposit runs. Older Vaults without one are treated as bi-weekly. */
  frequency?: DepositFrequency
  billPayeeIds: string[]
  /** A picture for this goal: one the customer chose (a data URL), or a bundled image path. */
  photo?: string
  /** Regular Vaults are linked to Everyday Checking and earn nothing. Savings Vaults live in TD Growth Savings. */
  kind?: 'regular' | 'savings'
}

export type Holding = {
  symbol: string
  name: string
  value: number
  change: number
}

export type Banker = {
  id: string
  name: string
  initials: string
  role: string
  specialties: string[]
  languages: string[]
  rating: number
  reviews: number
}

export type BranchFeature =
  | 'drive-thru'
  | 'wheelchair'
  | 'asl'
  | 'coin'
  | 'atm-24'
  | 'parking'
  | 'safe-deposit'
  | 'sunday'

export type Branch = {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  distanceMi: number
  openNow: boolean
  hoursToday: string
  waitMins: number
  inLine: number
  quietest: string
  features: BranchFeature[]
  languages: string[]
  bankerIds: string[]
}

export type AppointmentMode = 'in-branch' | 'video' | 'phone'

export type Appointment = {
  id: string
  branchId: string
  bankerId: string
  reason: string
  mode: AppointmentMode
  dateISO: string
  time: string
  notes: string
}

export type QueueTicket = {
  branchId: string
  number: string
  position: number
  etaMins: number
}

export type VirtualCard = {
  id: string
  label: string
  last4: string
  singleUse: boolean
  used: boolean
}

export const customer = {
  firstName: 'Maya',
  lastName: 'Chen',
  points: 18420,
  creditScore: 742,
}

export const initialAccounts: Account[] = [
  { id: 'chk', name: 'TD Everyday Checking', kind: 'checking', balance: 6842.17, mask: '4821' },
  { id: 'sav', name: 'TD Growth Savings', kind: 'savings', balance: 21450.0, mask: '9310' },
  { id: 'cd', name: 'TD 12-Month CD', kind: 'savings', balance: 10000.0, mask: '5520' },
  { id: 'cc', name: 'TD Double Up Card', kind: 'credit', balance: -1284.56, mask: '7742', limit: 12000 },
]

export const initialTransactions: Transaction[] = [
  { id: 't1', accountId: 'cc', merchant: 'Blue Bottle Coffee', category: 'Dining', amount: -6.75, when: 'Just now' },
  { id: 't2', accountId: 'chk', merchant: 'Whole Foods Market', category: 'Groceries', amount: -84.32, when: 'Today, 9:14 AM' },
  { id: 't3', accountId: 'chk', merchant: 'Payroll · Northwind Labs', category: 'Income', amount: 3920.0, when: 'Yesterday' },
  { id: 't4', accountId: 'chk', merchant: 'MTA OMNY', category: 'Transport', amount: -2.9, when: 'Yesterday' },
  { id: 't5', accountId: 'cc', merchant: 'Netflix', category: 'Bills', amount: -17.99, when: 'Oct 23' },
  { id: 't6', accountId: 'cc', merchant: 'Uniqlo SoHo', category: 'Shopping', amount: -129.6, when: 'Oct 22' },
  { id: 't7', accountId: 'cc', merchant: 'Lucali', category: 'Dining', amount: -58.4, when: 'Oct 21' },
  { id: 't8', accountId: 'chk', merchant: 'Con Edison', category: 'Bills', amount: -96.12, when: 'Oct 20' },
  { id: 't9', accountId: 'cc', merchant: 'Spotify', category: 'Bills', amount: -11.99, when: 'Oct 19' },
  { id: 't10', accountId: 'cc', merchant: 'Peloton', category: 'Bills', amount: -44.0, when: 'Oct 15' },
  { id: 't11', accountId: 'chk', merchant: 'The New York Times', category: 'Bills', amount: -25.0, when: 'Oct 12' },
  { id: 't12', accountId: 'sav', merchant: 'Interest paid', category: 'Income', amount: 81.24, when: 'Oct 1' },
  { id: 't13', accountId: 'sav', merchant: 'From TD Everyday Checking', category: 'Transfer', amount: 500.0, when: 'Sep 30' },
  { id: 't14', accountId: 'chk', merchant: 'To TD Growth Savings', category: 'Transfer', amount: -500.0, when: 'Sep 30' },
  { id: 't15', accountId: 'cc', merchant: 'Payment received · thank you', category: 'Transfer', amount: 1102.4, when: 'Sep 28' },
  { id: 't16', accountId: 'chk', merchant: 'TD Double Up Card payment', category: 'Transfer', amount: -1102.4, when: 'Sep 28' },
  { id: 't17', accountId: 'sav', merchant: 'Interest paid', category: 'Income', amount: 79.66, when: 'Sep 1' },
  { id: 't18', accountId: 'sav', merchant: 'From TD Everyday Checking', category: 'Transfer', amount: 500.0, when: 'Aug 30' },
]

export const accountDetails: Record<string, { routing?: string; number: string; opened: string; apy?: number; apr?: number; statementDay?: number }> = {
  chk: { routing: '026013673', number: '4398 2210 4821', opened: 'Mar 2019' },
  sav: { routing: '026013673', number: '4398 7705 9310', opened: 'Mar 2019', apy: 4.6 },
  cd: { number: '4398 6120 5520', opened: 'Mar 2025', apy: 4.25 },
  cc: { number: '4520 1984 3307 7742', opened: 'Jun 2021', apr: 21.24, statementDay: 3 },
}

export const spendingByCategory = [
  { category: 'Dining', amount: 412, change: -32 },
  { category: 'Groceries', amount: 368, change: 4 },
  { category: 'Shopping', amount: 291, change: 18 },
  { category: 'Bills', amount: 274, change: 0 },
  { category: 'Transport', amount: 96, change: -8 },
]

export const initialWallets: Wallet[] = [
  { code: 'USD', name: 'US Dollar', balance: 6842.17, perUsd: 1 },
  { code: 'EUR', name: 'Euro', balance: 412.5, perUsd: 0.9214 },
  { code: 'JPY', name: 'Japanese Yen', balance: 18500, perUsd: 151.82 },
  { code: 'CAD', name: 'Canadian Dollar', balance: 230.0, perUsd: 1.3862 },
  { code: 'GBP', name: 'British Pound', balance: 0, perUsd: 0.7712 },
  { code: 'MXN', name: 'Mexican Peso', balance: 0, perUsd: 18.94 },
]

export const initialVaults: Vault[] = [
  { id: 'weekend', name: 'Weekend fund', kind: 'regular', balance: 180, goal: 400, apy: 0, tone: 'sky', access: 'instant', withdrawalsUsed: 0, lockedUntil: null, salarySort: 0, billPayeeIds: [] },
  { id: 'japan', name: 'Tokyo trip', balance: 2350, goal: 4000, apy: 4.2, tone: 'lime', access: 'instant', withdrawalsUsed: 0, lockedUntil: null, salarySort: 150, billPayeeIds: [], photo: '/images/vaults/tokyo-trip.png' },
  { id: 'bills', name: 'Bills vault', balance: 1420, goal: 2500, apy: 4.2, tone: 'sky', access: 'instant', withdrawalsUsed: 0, lockedUntil: null, salarySort: 400, billPayeeIds: ['coned', 'verizon'] },
  { id: 'emergency', name: 'Rainy day fund', balance: 9800, goal: 15000, apy: 4.7, tone: 'green', access: 'select', withdrawalsUsed: 0, lockedUntil: null, salarySort: 200, billPayeeIds: [], photo: '/images/vaults/rainy-day.png' },
  { id: 'home', name: 'First home', balance: 18200, goal: 60000, apy: 4.7, tone: 'ink', access: 'select', withdrawalsUsed: 1, lockedUntil: 'Jun 1, 2027', salarySort: 300, billPayeeIds: [], photo: '/images/vaults/first-home.png' },
]

export const holdings: Holding[] = [
  { symbol: 'TDB', name: 'TD Bank Group', value: 1240.12, change: 1.8 },
  { symbol: 'VTI', name: 'Total Market ETF', value: 4810.55, change: 0.6 },
  { symbol: 'AAPL', name: 'Apple', value: 920.4, change: -0.4 },
  { symbol: 'NVDA', name: 'NVIDIA', value: 1675.0, change: 2.9 },
]

export const bankers: Banker[] = [
  {
    id: 'b1',
    name: 'Daniel Okafor',
    initials: 'DO',
    role: 'Senior Relationship Banker',
    specialties: ['Mortgages', 'Home equity'],
    languages: ['English', 'Yoruba'],
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 'b2',
    name: 'Lucía Romero',
    initials: 'LR',
    role: 'Personal Banker',
    specialties: ['New accounts', 'Credit building'],
    languages: ['English', 'Spanish'],
    rating: 4.8,
    reviews: 204,
  },
  {
    id: 'b3',
    name: 'Wei Zhang',
    initials: 'WZ',
    role: 'Wealth Advisor',
    specialties: ['Investing', 'Retirement'],
    languages: ['English', 'Mandarin', 'Cantonese'],
    rating: 4.9,
    reviews: 158,
  },
  {
    id: 'b4',
    name: 'Priya Natarajan',
    initials: 'PN',
    role: 'Small Business Banker',
    specialties: ['Business accounts', 'Lending'],
    languages: ['English', 'Hindi', 'Tamil'],
    rating: 4.7,
    reviews: 121,
  },
  {
    id: 'b5',
    name: 'Marcus Bell',
    initials: 'MB',
    role: 'Personal Banker',
    specialties: ['New accounts', 'Fraud & disputes'],
    languages: ['English', 'ASL'],
    rating: 4.8,
    reviews: 97,
  },
]

export const branches: Branch[] = [
  {
    id: 'union-sq',
    name: 'Union Square',
    address: '6 E 14th St, New York, NY 10003',
    lat: 40.7356,
    lng: -73.9925,
    distanceMi: 0.3,
    openNow: true,
    hoursToday: '8:00 AM – 7:00 PM',
    waitMins: 4,
    inLine: 1,
    quietest: '2–4 PM',
    features: ['wheelchair', 'atm-24', 'coin', 'sunday', 'asl'],
    languages: ['English', 'Spanish', 'ASL'],
    bankerIds: ['b2', 'b5', 'b1'],
  },
  {
    id: 'soho',
    name: 'SoHo – Broadway',
    address: '599 Broadway, New York, NY 10012',
    lat: 40.7247,
    lng: -73.9976,
    distanceMi: 0.9,
    openNow: true,
    hoursToday: '8:30 AM – 6:00 PM',
    waitMins: 12,
    inLine: 4,
    quietest: '10–11 AM',
    features: ['wheelchair', 'atm-24', 'safe-deposit'],
    languages: ['English', 'Mandarin', 'Cantonese'],
    bankerIds: ['b3', 'b2'],
  },
  {
    id: 'chelsea',
    name: 'Chelsea – 8th Ave',
    address: '260 8th Ave, New York, NY 10011',
    lat: 40.7449,
    lng: -73.9993,
    distanceMi: 1.2,
    openNow: true,
    hoursToday: '8:00 AM – 8:00 PM',
    waitMins: 0,
    inLine: 0,
    quietest: 'Now',
    features: ['wheelchair', 'atm-24', 'sunday', 'coin'],
    languages: ['English', 'Hindi', 'Tamil'],
    bankerIds: ['b4', 'b1'],
  },
  {
    id: 'fidi',
    name: 'Financial District',
    address: '90 Broad St, New York, NY 10004',
    lat: 40.7041,
    lng: -74.0115,
    distanceMi: 2.4,
    openNow: false,
    hoursToday: 'Opens 9:00 AM',
    waitMins: 0,
    inLine: 0,
    quietest: '9–10 AM',
    features: ['wheelchair', 'atm-24', 'safe-deposit'],
    languages: ['English', 'Spanish'],
    bankerIds: ['b3', 'b4'],
  },
  {
    id: 'brooklyn',
    name: 'Brooklyn Heights',
    address: '32 Court St, Brooklyn, NY 11201',
    lat: 40.6928,
    lng: -73.9905,
    distanceMi: 3.1,
    openNow: true,
    hoursToday: '8:00 AM – 7:00 PM',
    waitMins: 7,
    inLine: 2,
    quietest: '1–3 PM',
    features: ['drive-thru', 'parking', 'wheelchair', 'atm-24', 'coin'],
    languages: ['English', 'Spanish', 'Yoruba'],
    bankerIds: ['b1', 'b2', 'b5'],
  },
]

export const appointmentReasons = [
  {
    id: 'mortgage',
    label: 'Buy a home',
    detail: 'Pre-approval, rates & first-time buyer programs',
    specialty: 'Mortgages',
    checklist: ['Government photo ID', 'Last 2 pay stubs', 'Last 2 years of W-2s', '2 months of bank statements'],
  },
  {
    id: 'account',
    label: 'Open an account',
    detail: 'Checking, savings, kids & joint accounts',
    specialty: 'New accounts',
    checklist: ['Government photo ID', 'Social Security number', 'Proof of address'],
  },
  {
    id: 'invest',
    label: 'Grow my wealth',
    detail: 'Investing, retirement & college savings',
    specialty: 'Investing',
    checklist: ['Current statements from other brokerages', 'Your financial goals (Tedi can draft these)'],
  },
  {
    id: 'credit',
    label: 'Build my credit',
    detail: 'Secured cards, credit builder & score coaching',
    specialty: 'Credit building',
    checklist: ['Government photo ID', 'Recent credit report (optional)'],
  },
  {
    id: 'business',
    label: 'Business banking',
    detail: 'Accounts, lending & merchant services',
    specialty: 'Business accounts',
    checklist: ['EIN or SSN', 'Articles of organization', 'Business license'],
  },
  {
    id: 'fraud',
    label: 'Fraud or a dispute',
    detail: 'Unrecognized charges, scams & card replacement',
    specialty: 'Fraud & disputes',
    checklist: ['Government photo ID', 'Card involved (if you have it)', 'Screenshots of suspicious messages'],
  },
] as const

export const featureLabels: Record<BranchFeature, string> = {
  'drive-thru': 'Drive-thru',
  wheelchair: 'Step-free access',
  asl: 'ASL on-site',
  coin: 'Coin counter',
  'atm-24': '24/7 ATM',
  parking: 'Parking',
  'safe-deposit': 'Safe deposit',
  sunday: 'Open Sundays',
}

export function formatMoney(amount: number, currency = 'USD', opts?: { signed?: boolean }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(Math.abs(amount))
  if (opts?.signed) return `${amount < 0 ? '−' : '+'}${formatted}`
  return amount < 0 ? `−${formatted}` : formatted
}

export function upcomingDays(count = 10) {
  const days: Date[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = 1; days.length < count; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

export const timeSlots = ['9:00 AM', '9:30 AM', '10:30 AM', '11:00 AM', '1:00 PM', '2:30 PM', '3:00 PM', '4:30 PM', '5:30 PM']
