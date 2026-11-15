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
    tagline: '2% cash back on everything',
    headline: "You're pre-approved for up to $8,000",
    benefits: [
      '2% cash back on every purchase, no categories',
      '$200 bonus after $1,000 spent in 90 days',
      '$0 annual fee and no foreign transaction fees',
      'Virtual card ready the second you’re approved',
    ],
    keyTerms: [
      { label: 'Purchase APR', value: '19.24% – 29.24% variable' },
      { label: 'Intro APR', value: '0% for 15 months on balance transfers' },
      { label: 'Annual fee', value: '$0' },
      { label: 'Foreign transaction fee', value: 'None' },
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
    tagline: 'Lock in up to 4.25% APY',
    headline: 'Your rate is guaranteed for the full term',
    benefits: [
      'Rates up to 4.25% APY, locked for the term',
      'Open with as little as $250 from checking',
      'FDIC insured up to $250,000',
      'One penalty-free withdrawal each year',
    ],
    keyTerms: [
      { label: 'Minimum deposit', value: '$250' },
      { label: 'Compounding', value: 'Daily, credited monthly' },
      { label: 'Early withdrawal', value: '1 free per year, then 90 days interest' },
      { label: 'At maturity', value: 'Renews unless you choose otherwise' },
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
    tagline: 'A managed portfolio from $5',
    headline: 'Experts manage it, you watch it grow',
    benefits: [
      'Diversified ETF portfolio built around your goals',
      'Start with $5 and add round-ups automatically',
      'Automatic rebalancing and tax-loss harvesting',
      'Talk to a TD advisor anytime, free',
    ],
    keyTerms: [
      { label: 'Advisory fee', value: '0.25% per year' },
      { label: 'Minimum to start', value: '$5' },
      { label: 'Account type', value: 'Individual taxable brokerage' },
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
    tagline: 'Built for campus life, free until you graduate',
    headline: 'Banking that gets student life',
    benefits: [
      '$0 monthly fee until 25, plus a year after you graduate',
      'No overdraft fees, ever, with a $100 SafetyNet buffer',
      'Get paid up to 2 days early from campus jobs and payroll',
      'Build credit from rent and subscriptions you already pay',
      '$100 welcome bonus with $250 in direct deposits',
    ],
    keyTerms: [
      { label: 'Monthly fee', value: '$0 until age 25 or graduation + 1 year' },
      { label: 'Minimum to open', value: '$0' },
      { label: 'Overdraft fees', value: 'None. SafetyNet covers up to $100' },
      { label: 'ATM fees', value: 'Free at 2,600 TD and campus ATMs, 4 reimbursed per month' },
      { label: 'Foreign transaction fee', value: 'None, great for study abroad' },
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
    tagline: 'Premium banking that rewards how much you earn',
    headline: 'Your income is growing. Your bank should keep up.',
    benefits: [
      '+0.50% APY relationship boost on savings and CDs',
      '1.5x points on every TD card, 5% back on your boost category',
      'A dedicated banker and 24/7 concierge, by text or call',
      'Smart Sweep moves extra cash into Treasuries automatically',
      '$750 bonus when you bring $10,000 in new money',
    ],
    keyTerms: [
      { label: 'Monthly fee', value: '$25, waived with $5,000 direct deposit or $25,000 combined balances' },
      { label: 'Relationship boost', value: '+0.50% APY on TD savings and CDs' },
      { label: 'ATM & wire fees', value: 'All worldwide ATM fees refunded, free wires' },
      { label: 'Mortgage discount', value: 'Up to 0.25% off your rate' },
      { label: 'Welcome bonus', value: '$750 with $10,000 new money in 60 days' },
    ],
    decision: 'Complete relationship activated',
    softPull: false,
    setup: 'account',
    accountKind: 'checking',
    mask: '6604',
    hero: '+0.50% APY',
    promise: 'Fee easily waived',
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
    body: 'Based on your October spending, Double Up would have earned you $28.82. No categories to track.',
    cta: 'See my offer',
    tone: 'forest',
  },
  {
    id: 's-cd',
    productId: 'step-cd',
    label: '4.25% CD',
    kicker: 'Rates may drop soon',
    title: 'Lock in 4.25% APY',
    body: 'Put idle cash to work. $5,000 for 12 months earns about $212, guaranteed.',
    cta: 'Lock my rate',
    tone: 'lime',
  },
  {
    id: 's-invest',
    productId: 'auto-invest',
    label: 'Invest $5',
    kicker: 'New',
    title: 'Investing on autopilot',
    body: 'Round up every card purchase and invest the change in a portfolio built for you.',
    cta: 'Start with $5',
    tone: 'primary',
  },
]

export const offerReasons: Record<ProductId, string> = {
  'double-up':
    'You spend about $1,441 a month on your cards and pay your TD Clear Card in full. We checked eligibility with a soft inquiry, which never affects your credit score.',
  'step-cd':
    'You’ve kept more than $5,000 in Everyday Checking for 3 months. Moving some into a CD could earn more without changing how you bank day to day.',
  'auto-invest':
    'Your emergency fund is fully funded and you have a long-term home goal. Investing can help savings outpace inflation over time.',
  student:
    'Shown to customers who are enrolled in school or under 25. If that’s you (or someone you’re helping), it’s the most generous account we offer.',
  complete:
    'Your direct deposits average about $7,840 a month, so the $25 monthly fee would be waived automatically. With your balances, the rate boost alone is worth about $107 a year.',
}

export const cdTerms = [
  { months: 6, apy: 3.75 },
  { months: 12, apy: 4.25 },
  { months: 18, apy: 4.0 },
]

export const riskProfiles = [
  { id: 'conservative', label: 'Conservative', stocks: 30, ret: 4.1, blurb: 'Steadier, mostly bonds' },
  { id: 'balanced', label: 'Balanced', stocks: 60, ret: 6.2, blurb: 'A mix for 5+ year goals' },
  { id: 'growth', label: 'Growth', stocks: 90, ret: 7.8, blurb: 'Higher ups and downs' },
] as const

export const cardDesigns = [
  { id: 'forest', label: 'Forest', className: 'bg-forest text-forest-foreground' },
  { id: 'lime', label: 'Lime', className: 'bg-lime text-lime-foreground' },
  { id: 'mist', label: 'Mist', className: 'bg-gradient-to-br from-white to-accent text-foreground border' },
] as const
