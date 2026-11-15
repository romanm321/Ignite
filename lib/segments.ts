export type SegmentId = 'student' | 'complete'

export type PerkIcon =
  | 'safety'
  | 'early'
  | 'credit'
  | 'split'
  | 'perks'
  | 'globe'
  | 'grad'
  | 'learn'
  | 'boost'
  | 'rewards'
  | 'concierge'
  | 'sweep'
  | 'equity'
  | 'lounge'
  | 'home'
  | 'debt'

export type Perk = { icon: PerkIcon; title: string; body: string; firstAt?: boolean }

export type Segment = {
  id: SegmentId
  label: string
  who: string
  pitch: string
  perks: Perk[]
}

export const segments: Record<SegmentId, Segment> = {
  student: {
    id: 'student',
    label: 'Student',
    who: 'For students and anyone under 25',
    pitch: 'No fees, no overdraft stress, and a head start on credit before you graduate.',
    perks: [
      {
        icon: 'safety',
        title: 'SafetyNet, not overdraft fees',
        body: 'Go up to $100 under with zero fees. We nudge you before it happens, not after.',
        firstAt: true,
      },
      {
        icon: 'credit',
        title: 'Credit Builder',
        body: 'Rent, phone and streaming payments get reported to all 3 bureaus. Graduate with a score, not a blank file.',
        firstAt: true,
      },
      { icon: 'early', title: 'Paid up to 2 days early', body: 'Campus jobs, internships and refunds land as soon as we get them.' },
      { icon: 'split', title: 'Split anything', body: 'Rent, groceries, the Uber home. Split with roommates in one tap, even if they bank elsewhere.' },
      {
        icon: 'perks',
        title: 'Student Perks Pass',
        body: 'Pick a free perk each semester: Spotify Premium Student, Amazon Prime Student or Notion Plus.',
      },
      { icon: 'globe', title: 'Study-abroad ready', body: 'No foreign transaction fees and 4 free international ATM withdrawals a month.' },
      { icon: 'learn', title: 'Money Minutes', body: '3-minute lessons that pay $5 each, up to $50 a year. Learn budgeting, get paid for it.' },
      { icon: 'grad', title: 'Graduation glow-up', body: '$100 when you graduate and set up your first salary deposit, plus a free upgrade to Complete.' },
    ],
  },
  complete: {
    id: 'complete',
    label: 'Complete',
    who: 'For high earners building real wealth',
    pitch: 'Your paycheck is big. We help it turn into lasting wealth, not just a bigger checking balance.',
    perks: [
      {
        icon: 'sweep',
        title: 'Smart Sweep',
        body: 'Set a checking target. Anything above it moves into T-bills or high-yield savings every night, and back again when you need it.',
        firstAt: true,
      },
      { icon: 'boost', title: 'Relationship rate boost', body: '+0.50% APY on every TD savings account and CD while you’re a Complete customer.' },
      {
        icon: 'rewards',
        title: 'Complete Rewards',
        body: '1.5x points on all TD cards, plus 5% back on the boost category you choose each quarter.',
      },
      {
        icon: 'equity',
        title: 'Equity & RSU planner',
        body: 'Connect your stock plan. We map vesting dates, estimate taxes and build a sell-or-hold plan.',
        firstAt: true,
      },
      {
        icon: 'debt',
        title: 'Debt payoff optimizer',
        body: 'Student loans, car notes, cards. We compare paying down vs. investing and show the winner.',
      },
      { icon: 'concierge', title: 'Your own banker', body: 'A named banker plus 24/7 concierge by text. Real people, answers in minutes.' },
      { icon: 'home', title: 'Home-ready', body: 'Up to 0.25% off a TD mortgage and a pre-approval in 24 hours.' },
      { icon: 'lounge', title: 'Travel well', body: '4 airport lounge visits a year, worldwide ATM fees refunded and free wires.' },
    ],
  },
}

export type CompareRow = { label: string; everyday: string; student: string; complete: string }

export const compareRows: CompareRow[] = [
  { label: 'Monthly fee', everyday: '$15 or $500 min', student: '$0', complete: '$25, waived with $5k deposit' },
  { label: 'Overdraft', everyday: '$35 fee', student: 'No fees, $100 buffer', complete: 'No fees, $1,000 buffer' },
  { label: 'Early pay', everyday: '—', student: 'Up to 2 days', complete: 'Up to 2 days' },
  { label: 'Savings rate', everyday: '4.60% APY', student: '4.60% APY', complete: '5.10% APY' },
  { label: 'Card rewards', everyday: 'Standard', student: 'Student perks', complete: '1.5x + 5% boost' },
  { label: 'ATM fees', everyday: 'TD only', student: '4 refunded / mo', complete: 'All refunded' },
  { label: 'Support', everyday: 'In-app & branch', student: 'In-app & branch', complete: 'Dedicated banker' },
  { label: 'Welcome bonus', everyday: '—', student: '$100', complete: '$750' },
]

export const studentPerkChoices = [
  { id: 'spotify', label: 'Spotify Premium Student', detail: '6 months free' },
  { id: 'prime', label: 'Amazon Prime Student', detail: '12 months free' },
  { id: 'notion', label: 'Notion Plus', detail: '1 year free' },
] as const

export const boostCategories = [
  { id: 'dining', label: 'Dining & delivery', detail: 'Restaurants, DoorDash, Uber Eats' },
  { id: 'travel', label: 'Travel', detail: 'Flights, hotels, rideshare' },
  { id: 'home', label: 'Home & groceries', detail: 'Groceries, utilities, Costco' },
] as const

export const sweepTargets = [5000, 10000, 15000] as const
