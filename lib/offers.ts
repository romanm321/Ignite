export type ProductId = 'double-up' | 'step-cd' | 'auto-invest' | 'student' | 'complete'

export type Product = {
  id: ProductId
  name: string
  category: 'Credit card' | 'Savings' | 'Investing' | 'Bank account'
  tagline: string
  headline: string
  benefits: string[]
  keyTerms: { label: string; value: string }[]
  decision: string
  softPull: boolean
  setup: 'card' | 'deposit' | 'invest' | 'account'
  accountKind: 'credit' | 'savings' | 'checking'
  mask: string
  /** Big number on the intro hero for non-card products. */
  hero?: string
  /** Third promise chip on the intro screen. */
  promise?: string
}

export const products: Record<ProductId, Product> = {
  'double-up': {
    id: 'double-up',
    name: 'TD Double Up Card',
    category: 'Credit card',
    tagline: '2% back on everything',
    headline: "You're pre-approved for up to $8,000",
    benefits: [
      '2% back on every purchase',
      '$200 bonus when you spend $1,000 in 90 days',
      'No yearly fee, no fees abroad',
      'Use it in your phone wallet right away',
    ],
    keyTerms: [
      { label: 'Interest rate (APR)', value: '19.24% – 29.24%, can change' },
      { label: 'Intro rate', value: '0% for 15 months on transfers' },
      { label: 'Yearly fee', value: '$0' },
      { label: 'Fees abroad', value: 'None' },
    ],
    decision: '$8,000 credit limit',
    softPull: true,
    setup: 'card',
    accountKind: 'credit',
    mask: '2208',
  },
  'step-cd': {
    id: 'step-cd',
    name: 'TD Step Rate CD',
    category: 'Savings',
    tagline: 'Lock in up to 4.25% interest',
    headline: 'Your rate stays the same until the end',
    benefits: [
      'Up to 4.25% interest, locked in',
      'Start with just $250 from checking',
      'Insured up to $250,000 by the FDIC',
      'Take money out once a year, no penalty',
    ],
    keyTerms: [
      { label: 'Start with', value: '$250' },
      { label: 'How interest grows', value: 'Added daily, paid monthly' },
      { label: 'Taking money out early', value: '1 free time a year, then 90 days of interest' },
      { label: 'When it ends', value: 'It renews unless you tell us otherwise' },
    ],
    decision: 'Account opened and funded',
    softPull: false,
    setup: 'deposit',
    accountKind: 'savings',
    mask: '5530',
  },
  'auto-invest': {
    id: 'auto-invest',
    name: 'TD Auto Invest',
    category: 'Investing',
    tagline: 'A ready-made portfolio from $5',
    headline: 'Experts manage it. You watch it grow.',
    benefits: [
      'A mix of funds built around your goals',
      'Start with $5 and invest your spare change',
      'We keep it balanced for you',
      'Talk to an advisor anytime, free',
    ],
    keyTerms: [
      { label: 'Yearly fee', value: '0.25% of your balance' },
      { label: 'Start with', value: '$5' },
      { label: 'Account', value: 'Individual investing account' },
      { label: 'Protection', value: 'SIPC up to $500,000. Not FDIC insured.' },
    ],
    decision: 'Portfolio funded and invested',
    softPull: false,
    setup: 'invest',
    accountKind: 'savings',
    mask: '7104',
  },
  student: {
    id: 'student',
    name: 'TD Student Banking',
    category: 'Bank account',
    tagline: 'Free until you graduate',
    headline: 'Banking that gets student life',
    benefits: [
      'No monthly fee until 25, plus a year after you graduate',
      'No overdraft fees, with a $100 safety cushion',
      'Get paid up to 2 days early',
      'Build credit with bills you already pay',
      '$100 bonus after $250 in direct deposits',
    ],
    keyTerms: [
      { label: 'Monthly fee', value: '$0 until 25, or a year after you graduate' },
      { label: 'To open', value: '$0' },
      { label: 'Overdraft fees', value: 'None. SafetyNet covers up to $100' },
      { label: 'ATM fees', value: 'Free at 2,600 TD and campus ATMs. 4 other ATM fees refunded a month' },
      { label: 'Fees abroad', value: 'None. Great for study abroad' },
    ],
    decision: 'Student account opened',
    softPull: false,
    setup: 'account',
    accountKind: 'checking',
    mask: '3118',
    hero: '$0 fees',
    promise: 'No minimum',
  },
  complete: {
    id: 'complete',
    name: 'TD Complete',
    category: 'Bank account',
    tagline: 'Extra rewards for everything you do with TD',
    headline: 'You’re doing well. Your bank should too.',
    benefits: [
      '+0.50% extra interest on savings and CDs',
      '1.5x points on TD cards, 5% back on a category you pick',
      'A personal banker and 24/7 help by text or call',
      'Extra cash earns more automatically with Smart Sweep',
      '$750 bonus when you bring $10,000 in new money',
    ],
    keyTerms: [
      { label: 'Monthly fee', value: '$25, free with $5,000 in direct deposits or $25,000 in balances' },
      { label: 'Extra interest', value: '+0.50% on TD savings and CDs' },
      { label: 'ATM and wire fees', value: 'ATM fees refunded worldwide, free wires' },
      { label: 'Mortgage rate', value: 'Up to 0.25% off' },
      { label: 'Welcome bonus', value: '$750 when you add $10,000 in 60 days' },
    ],
    decision: 'Complete relationship activated',
    softPull: false,
    setup: 'account',
    accountKind: 'checking',
    mask: '6604',
    hero: '+0.50% interest',
    promise: 'Fee is easy to skip',
  },
}

export const productList = Object.values(products)

export type Story = {
  id: string
  productId: ProductId | null
  label: string
  kicker: string
  title: string
  body: string
  cta: string
  tone: 'forest' | 'lime' | 'primary'
}

export const stories: Story[] = [
  {
    id: 's-double',
    productId: 'double-up',
    label: '2% back',
    kicker: 'Pre-approved for you',
    title: 'Every purchase, 2% back',
    body: 'Last month it would have earned you $28.82.',
    cta: 'See my offer',
    tone: 'forest',
  },
  {
    id: 's-cd',
    productId: 'step-cd',
    label: '4.25% CD',
    kicker: 'Fixed for 12 months',
    title: 'A fixed 4.25%',
    body: 'It can’t change for 12 months. $5,000 earns about $212.',
    cta: 'Lock in my rate',
    tone: 'lime',
  },
  {
    id: 's-invest',
    productId: 'auto-invest',
    label: 'Invest $5',
    kicker: 'New',
    title: 'Invest your spare change',
    body: 'Round up each purchase and invest the difference.',
    cta: 'Start with $5',
    tone: 'primary',
  },
]

export const offerReasons: Record<ProductId, string> = {
  'double-up':
    'You spend about $1,441 a month and pay your card in full. Checking if you’re approved won’t affect your credit score.',
  'step-cd':
    'Your checking balance has stayed above $5,000 for 3 months. A CD could earn you more on money you don’t need right now.',
  'auto-invest':
    'Your emergency fund is covered and you’re saving for a home. Investing can help your money grow faster over time.',
  student:
    'For students and anyone under 25. If that’s you, it’s our best account.',
  complete:
    'You deposit about $7,840 a month, so the $25 fee is waived. The extra interest alone is worth about $107 a year.',
}

export const cdTerms = [
  { months: 6, apy: 3.75 },
  { months: 12, apy: 4.25 },
  { months: 18, apy: 4.0 },
]

export const riskProfiles = [
  { id: 'conservative', label: 'Conservative', stocks: 30, ret: 4.1, blurb: 'Steady and careful' },
  { id: 'balanced', label: 'Balanced', stocks: 60, ret: 6.2, blurb: 'A good mix for 5+ years' },
  { id: 'growth', label: 'Growth', stocks: 90, ret: 7.8, blurb: 'Bigger swings, more growth' },
] as const

export const cardDesigns = [
  { id: 'forest', label: 'Forest', className: 'bg-forest text-forest-foreground' },
  { id: 'lime', label: 'Lime', className: 'bg-lime text-lime-foreground' },
  { id: 'mist', label: 'Mist', className: 'bg-gradient-to-br from-white to-accent text-foreground border' },
] as const
