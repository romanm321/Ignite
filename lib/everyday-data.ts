export type Payee = {
  id: string
  name: string
  category: 'Utilities' | 'Phone & internet' | 'Housing' | 'Insurance' | 'Other'
  mask: string
  amountDue: number
  dueIn: number
  autopay: boolean
  paid?: boolean
  domain?: string
  /** A logo bundled with the app, used instead of fetching one from the merchant's domain. */
  logo?: string
}

export type ScheduledBill = { id: string; payeeId: string; amount: number; date: string }

export type P2PNetwork = 'zelle' | 'wire'
export type WireScope = 'domestic' | 'international'

export type WireDetails = {
  scope: WireScope
  bank: string
  mask: string
  country: string
  currency: string
  swift?: string
}

export type Contact = {
  id: string
  name: string
  /** Zelle-enrolled email or mobile. Absent if they can only receive wires. */
  handle?: string
  wire?: WireDetails
  known: boolean
  /** Photo carried over from the phone's address book when the contact was imported. */
  photo?: string
}

/** What the phone's address book hands over when the customer allows access. */
export type DeviceContact = { id: string; name: string; phone: string; photo: string }

export const deviceContacts: DeviceContact[] = [
  { id: 'dev-hannah', name: 'Hannah Fischer', phone: '(415) 555-0117', photo: '/images/contacts/hannah.png' },
  { id: 'dev-daniel', name: 'Daniel Ortiz', phone: '(646) 555-0166', photo: '/images/contacts/daniel.png' },
  { id: 'dev-marcus', name: 'Marcus Webb', phone: '(212) 555-0189', photo: '/images/contacts/marcus.png' },
  { id: 'dev-molly', name: 'Molly Bennett', phone: '(718) 555-0134', photo: '/images/contacts/molly.png' },
  { id: 'dev-priya', name: 'Priya Nair', phone: '(347) 555-0152', photo: '/images/contacts/priya.png' },
  { id: 'dev-sofia', name: 'Sofia Rossi', phone: '(929) 555-0178', photo: '/images/contacts/sofia.png' },
]

export const REASON_EMOJIS = ['🍕', '🍽️', '🌮', '☕', '🍻', '🎬', '🎁', '🚕', '🏠', '💸']

export const ZELLE_MIN = 1
export const ZELLE_DAILY_LIMIT = 10000
export const WIRE_LIMITS: Record<WireScope, number> = { domestic: 250000, international: 100000 }
export const WIRE_FEES: Record<WireScope, number> = { domestic: 25, international: 45 }

export const wireCurrencies: { code: string; country: string; rate: number }[] = [
  { code: 'USD', country: 'United States', rate: 1 },
  { code: 'CAD', country: 'Canada', rate: 1.37 },
  { code: 'MXN', country: 'Mexico', rate: 17.12 },
  { code: 'GBP', country: 'United Kingdom', rate: 0.79 },
  { code: 'EUR', country: 'Eurozone', rate: 0.92 },
  { code: 'INR', country: 'India', rate: 83.2 },
  { code: 'JPY', country: 'Japan', rate: 152.3 },
  { code: 'PHP', country: 'Philippines', rate: 56.4 },
]

export const wirePurposes = ['Family support', 'Paying for goods or services', 'Tuition', 'Property purchase', 'Moving my own money']

export type SendRecommendation = {
  network: P2PNetwork
  scope?: WireScope
  title: string
  reason: string
}

/** Picks the cheapest rail that can actually carry the payment. */
export function recommendRail(amount: number, destination: WireScope, zelleRemaining: number): SendRecommendation {
  if (destination === 'international') {
    return {
      network: 'wire',
      scope: 'international',
      title: 'International wire',
      reason: 'Zelle only works between US bank accounts, so a wire is the way to reach banks in 200+ countries.',
    }
  }
  if (amount >= ZELLE_MIN && amount <= zelleRemaining) {
    return {
      network: 'zelle',
      title: 'Zelle®',
      reason: 'It fits inside your Zelle limit, so you can send it free and it usually lands in minutes.',
    }
  }
  return {
    network: 'wire',
    scope: 'domestic',
    title: 'Domestic wire',
    reason:
      amount > ZELLE_DAILY_LIMIT
        ? `That’s over Zelle’s ${'$'}10,000 daily limit. A wire handles big moves like a down payment, same day.`
        : 'That’s more than you have left on Zelle today. A wire gets it there same day instead.',
  }
}

export type A11yPrefs = {
  textSize: 'default' | 'large' | 'xl'
  highContrast: boolean
  reduceMotion: boolean
  simpleHome: boolean
}

export type AlertPrefs = {
  lowBalance: boolean
  lowBalanceAt: number
  deposits: boolean
  billsDue: boolean
  largePurchaseAt: number
  subscriptionChanges: boolean
  creditScore: boolean
  push: boolean
  email: boolean
  sms: boolean
  quietHours: boolean
}

export type Celebration = {
  kind: 'legendary' | 'product' | 'win' | 'clap'
  title: string
  body: string
  /** A cash amount to count up on the celebration, like a welcome bonus. */
  amount?: number
  /** Match the deep green sign-up screens: white button with dark green text. */
  cta?: 'onboarding'
}

export const initialPayees: Payee[] = [
  { id: 'coned', name: 'Con Edison', category: 'Utilities', mask: '2210', amountDue: 118.42, dueIn: 3, autopay: false, domain: 'coned.com' },
  { id: 'verizon', name: 'Verizon Wireless', category: 'Phone & internet', mask: '8834', amountDue: 85.0, dueIn: 6, autopay: true, domain: 'verizon.com', logo: '/images/merchants/verizon.png' },
  { id: 'parkside', name: 'Parkside Apartments', category: 'Housing', mask: '0401', amountDue: 2150.0, dueIn: 9, autopay: false, logo: '/images/merchants/parkside.png' },
  { id: 'geico', name: 'GEICO Auto', category: 'Insurance', mask: '5517', amountDue: 96.3, dueIn: 14, autopay: true, domain: 'geico.com', logo: '/images/merchants/geico.png' },
]

export const initialContacts: Contact[] = [
  {
    id: 'alex',
    name: 'Alex Rivera',
    handle: 'alex.rivera@gmail.com',
    wire: { scope: 'domestic', bank: 'Chase', mask: '4410', country: 'United States', currency: 'USD' },
    known: true,
    photo: '/images/contacts/alex.png',
  },
  { id: 'jordan', name: 'Jordan Lee', handle: '(917) 555-0142', known: true, photo: '/images/contacts/jordan.png' },
  { id: 'sam', name: 'Sam Okafor', handle: 'sam.okafor@outlook.com', known: true, photo: '/images/contacts/sam.png' },
  {
    id: 'escrow',
    name: 'Hudson Title & Escrow',
    wire: { scope: 'domestic', bank: 'Wells Fargo', mask: '0921', country: 'United States', currency: 'USD' },
    known: true,
  },
  {
    id: 'mom',
    name: 'Mom',
    wire: { scope: 'international', bank: 'TD Canada Trust', mask: '8812', country: 'Canada', currency: 'CAD', swift: 'TDOMCATTTOR' },
    known: true,
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    wire: { scope: 'international', bank: 'HDFC Bank', mask: '3307', country: 'India', currency: 'INR', swift: 'HDFCINBB' },
    known: true,
  },
  {
    id: 'kenji',
    name: 'Kenji Tanaka',
    wire: { scope: 'international', bank: 'MUFG Bank', mask: '5561', country: 'Japan', currency: 'JPY', swift: 'BOTKJPJT' },
    known: true,
  },
]

export const defaultA11y: A11yPrefs = {
  textSize: 'default',
  highContrast: false,
  reduceMotion: false,
  simpleHome: false,
}

export const defaultAlertPrefs: AlertPrefs = {
  lowBalance: true,
  lowBalanceAt: 250,
  deposits: true,
  billsDue: true,
  largePurchaseAt: 250,
  subscriptionChanges: true,
  creditScore: false,
  push: true,
  email: true,
  sms: false,
  quietHours: false,
}

export const creditHistory = [
  { month: 'May', score: 721 },
  { month: 'Jun', score: 724 },
  { month: 'Jul', score: 729 },
  { month: 'Aug', score: 731 },
  { month: 'Sep', score: 736 },
  { month: 'Oct', score: 742 },
]

export function creditBand(score: number) {
  if (score >= 800) return { label: 'Exceptional', note: 'Top of the class. Lenders love this.' }
  if (score >= 740) return { label: 'Very good', note: 'You qualify for most of the best rates out there.' }
  if (score >= 670) return { label: 'Good', note: 'Solid footing. A few tweaks unlock better rates.' }
  if (score >= 580) return { label: 'Fair', note: 'Room to grow, and we can help you get there.' }
  return { label: 'Building', note: 'Everyone starts somewhere. Small steps add up fast.' }
}
