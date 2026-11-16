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
    pitch: 'No fees, no overdraft stress, and a head start on credit.',
    perks: [
      {
        icon: 'safety',
        title: 'SafetyNet, not overdraft fees',
        body: 'Dip up to $100 below zero with no fees. We’ll warn you first.',
        firstAt: true,
      },
      {
        icon: 'credit',
        title: 'Credit Builder',
        body: 'Your rent, phone and streaming bills help build your credit.',
        firstAt: true,
      },
      { icon: 'early', title: 'Paid up to 2 days early', body: 'Campus jobs and refunds land as soon as we get them.' },
      { icon: 'split', title: 'Split anything', body: 'Split rent, groceries and rides in one tap, even with friends at other banks.' },
      {
        icon: 'perks',
        title: 'Student Perks Pass',
        body: 'Pick one free perk each semester: Spotify, Amazon Prime or Notion.',
      },
      { icon: 'globe', title: 'Study-abroad ready', body: 'No fees abroad, plus 4 free ATM withdrawals a month.' },
      { icon: 'learn', title: 'Money Minutes', body: '3-minute lessons that pay $5 each, up to $50 a year.' },
      { icon: 'grad', title: 'Graduation glow-up', body: '$100 when you graduate and set up direct deposit, plus a free upgrade to Complete.' },
    ],
  },
  complete: {
    id: 'complete',
    label: 'Complete',
    who: 'For high earners building real wealth',
    pitch: 'Your paycheck is big. We help it grow into lasting wealth.',
    perks: [
      {
        icon: 'sweep',
        title: 'Smart Sweep',
        body: 'Pick a checking balance to keep. We move the extra into savings each night, and back when you need it.',
        firstAt: true,
      },
      { icon: 'boost', title: 'Extra savings interest', body: '+0.50% interest on every TD savings account and CD.' },
      {
        icon: 'rewards',
        title: 'Complete Rewards',
        body: '1.5x points on TD cards, plus 5% back on a category you pick each quarter.',
      },
      {
        icon: 'equity',
        title: 'Stock plan planner',
        body: 'Connect your stock plan. We track vesting dates, estimate taxes and suggest when to sell or hold.',
        firstAt: true,
      },
      {
        icon: 'debt',
        title: 'Debt payoff planner',
        body: 'We compare paying down loans with investing, and show you the better move.',
      },
      { icon: 'concierge', title: 'Your own banker', body: 'A personal banker plus 24/7 help by text. Real people, answers in minutes.' },
      { icon: 'home', title: 'Home-ready', body: 'Up to 0.25% off a TD mortgage, with pre-approval in 24 hours.' },
      { icon: 'lounge', title: 'Travel well', body: '4 airport lounge visits a year, ATM fees refunded worldwide and free wires.' },
    ],
  },
}

export type CompareRow = { label: string; everyday: string; student: string; complete: string }

export const compareRows: CompareRow[] = [
  { label: 'Monthly fee', everyday: '$15, or $0 with $500', student: '$0', complete: '$25, free with $5k deposits' },
  { label: 'Overdraft', everyday: '$35 fee', student: 'No fees, $100 buffer', complete: 'No fees, $1,000 buffer' },
  { label: 'Early pay', everyday: '—', student: 'Up to 2 days', complete: 'Up to 2 days' },
  { label: 'Savings rate', everyday: '4.60% interest', student: '4.60% interest', complete: '5.10% interest' },
  { label: 'Card rewards', everyday: 'Standard', student: 'Student perks', complete: '1.5x + 5% boost' },
  { label: 'ATM fees', everyday: 'TD ATMs only', student: '4 refunded a month', complete: 'All refunded' },
  { label: 'Support', everyday: 'In-app & branch', student: 'In-app & branch', complete: 'Personal banker' },
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
