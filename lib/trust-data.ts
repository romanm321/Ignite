export type Device = {
  id: string
  name: string
  kind: 'phone' | 'laptop' | 'tablet'
  location: string
  lastActive: string
  current?: boolean
  trusted: boolean
}

export type LoginEvent = {
  id: string
  when: string
  device: string
  location: string
  method: 'Face ID' | 'Passkey' | 'Password' | 'Password + code'
  flagged?: boolean
}

export type DataScope = 'balances' | 'transactions' | 'identity' | 'accountNumbers'

export type Connection = {
  id: string
  name: string
  purpose: string
  connectedOn: string
  lastAccess: string
  stale?: boolean
  scopes: Record<DataScope, boolean>
}

export type AlertKey = 'largePurchase' | 'newDevice' | 'international' | 'newPayee' | 'profileChange' | 'declined'

export type Lesson = {
  id: string
  title: string
  minutes: number
  tag: string
  steps: string[]
}

export type FraudCase = {
  id: string
  transactionIds: string[]
  reason: string
  amount: number
  stage: number
  openedAt: string
}

export type Profile = {
  legalName: string
  preferredName: string
  dob: string
  email: string
  phone: string
  address: string
  language: 'English' | 'Español' | 'Français' | '中文'
  memberSince: string
  trustedContact: { name: string; relation: string; phone: string } | null
  paperless: boolean
  channels: { push: boolean; email: boolean; sms: boolean }
  marketing: boolean
  largeText: boolean
}

export const scopeLabels: Record<DataScope, string> = {
  balances: 'Account balances',
  transactions: 'Transaction history',
  identity: 'Name, email & address',
  accountNumbers: 'Account & routing numbers',
}

export const alertLabels: Record<AlertKey, { title: string; body: string }> = {
  largePurchase: { title: 'Purchases over $250', body: 'Instant push the moment it posts' },
  newDevice: { title: 'Sign-in from a new device', body: 'Approve or block from the alert' },
  international: { title: 'International transactions', body: 'Card-present or online abroad' },
  newPayee: { title: 'New payee or Zelle® recipient', body: 'Classic scam signal' },
  profileChange: { title: 'Profile or password changes', body: 'Sent to your old and new contact' },
  declined: { title: 'Declined transactions', body: 'Know right away if a card is being tested' },
}

export const initialDevices: Device[] = [
  { id: 'd1', name: 'iPhone 16 Pro', kind: 'phone', location: 'New York, NY', lastActive: 'Active now', current: true, trusted: true },
  { id: 'd2', name: 'MacBook Air · Safari', kind: 'laptop', location: 'New York, NY', lastActive: 'Yesterday, 9:42 PM', trusted: true },
  { id: 'd3', name: 'Windows PC · Chrome', kind: 'laptop', location: 'Newark, NJ', lastActive: 'Oct 22, 3:17 AM', trusted: false },
]

export const initialLogins: LoginEvent[] = [
  { id: 'l1', when: 'Today, 8:14 AM', device: 'iPhone 16 Pro', location: 'New York, NY', method: 'Face ID' },
  { id: 'l2', when: 'Yesterday, 9:42 PM', device: 'MacBook Air', location: 'New York, NY', method: 'Passkey' },
  { id: 'l3', when: 'Oct 22, 3:17 AM', device: 'Windows PC', location: 'Newark, NJ', method: 'Password', flagged: true },
  { id: 'l4', when: 'Oct 21, 7:05 PM', device: 'iPhone 16 Pro', location: 'New York, NY', method: 'Face ID' },
]

export const initialConnections: Connection[] = [
  {
    id: 'venmo',
    name: 'Venmo',
    purpose: 'Send & receive payments',
    connectedOn: 'Mar 2024',
    lastAccess: '2 days ago',
    scopes: { balances: true, transactions: false, identity: true, accountNumbers: true },
  },
  {
    id: 'turbotax',
    name: 'TurboTax',
    purpose: 'Import tax documents',
    connectedOn: 'Feb 2026',
    lastAccess: 'Apr 2026',
    scopes: { balances: false, transactions: true, identity: true, accountNumbers: false },
  },
  {
    id: 'budgetpal',
    name: 'BudgetPal',
    purpose: 'Budgeting app',
    connectedOn: 'Jun 2023',
    lastAccess: '14 months ago',
    stale: true,
    scopes: { balances: true, transactions: true, identity: true, accountNumbers: true },
  },
]

export const lessons: Lesson[] = [
  {
    id: 'impersonation',
    title: '"This is TD calling" — how to tell',
    minutes: 1,
    tag: 'Top scam in 2026',
    steps: [
      'TD will never ask for your one-time code, PIN or password — on any channel.',
      'If someone claims to be TD, open the app and tap "Verify a TD call". A real agent shows up here instantly.',
      'Hang up and call the number on your card if anything feels off. Urgency is the scammer\u2019s tool.',
    ],
  },
  {
    id: 'zelle',
    title: 'Payment scams on Zelle® & e-Transfer',
    minutes: 2,
    tag: 'Payments',
    steps: [
      'Only send money to people you know and trust — payments are like cash.',
      'Sellers asking for Zelle® on marketplaces are a red flag. Use a card for purchase protection.',
      'Tedi will pause a payment that matches a known scam pattern and explain why.',
    ],
  },
  {
    id: 'deepfake',
    title: 'AI voice clones & family emergencies',
    minutes: 1,
    tag: 'New',
    steps: [
      'Scammers can clone a voice from a few seconds of social media audio.',
      'Agree a family safe word and ask for it on any urgent money request.',
      'Add a trusted contact so TD can reach someone you trust if we spot unusual activity.',
    ],
  },
]

export const fraudStages = ['Reported', 'Card replaced', 'Provisional credit', 'Investigation', 'Resolved']

export const initialProfile: Profile = {
  legalName: 'Maya Lin Chen',
  preferredName: 'Maya',
  dob: '•• / •• / 1991',
  email: 'maya.chen@hey.com',
  phone: '(212) 555-0142',
  address: '350 W 42nd St, Apt 2104, New York, NY 10036',
  language: 'English',
  memberSince: '2014',
  trustedContact: null,
  paperless: true,
  channels: { push: true, email: true, sms: false },
  marketing: false,
  largeText: false,
}
