import { appointmentReasons, bankers, branches, formatMoney, type Transaction, type Vault } from './bank-data'

export type ConfirmStatus = 'pending' | 'confirmed' | 'declined' | 'blocked'

export type Widget =
  | { kind: 'capabilities' }
  | { kind: 'action'; action: 'freeze' | 'unfreeze' | 'streetOn' | 'streetOff' | 'passkey'; text: string }
  | { kind: 'balances' }
  | { kind: 'spending' }
  | { kind: 'credit' }
  | { kind: 'controls' }
  | { kind: 'virtualCard'; last4: string }
  | { kind: 'security' }
  | { kind: 'scam' }
  | { kind: 'dispute'; status: ConfirmStatus; result?: string }
  | { kind: 'vault'; vaultId: string; amount: number; status: ConfirmStatus; result?: string }
  | { kind: 'send'; payee: string | null; amount: number; status: ConfirmStatus; result?: string }
  | { kind: 'branches'; ids: string[] }
  | { kind: 'book'; reasonId: string; status: ConfirmStatus; result?: string }
  | { kind: 'handoff'; topic: string }
  | { kind: 'offer'; productId: 'double-up' | 'step-cd' | 'auto-invest' }

export type Effect =
  | { type: 'freeze'; frozen: boolean }
  | { type: 'streetSafe'; on: boolean }
  | { type: 'passkey' }
  | { type: 'virtualCard'; last4: string }

export type SageReply = { text: string; widgets: Widget[]; chips: string[]; effects: Effect[] }

export type SageContext = {
  firstName: string
  cardFrozen: boolean
  streetSafe: boolean
  passkey: boolean
  score: number
  vaults: Vault[]
  transactions: Transaction[]
}

export const payees = [
  { id: 'alex', name: 'Alex Rivera', initials: 'AR', handle: 'Roommate' },
  { id: 'mom', name: 'Linda Chen', initials: 'LC', handle: 'Mom' },
  { id: 'priya', name: 'Priya Shah', initials: 'PS', handle: 'Friend' },
]

const languages = ['spanish', 'mandarin', 'cantonese', 'hindi', 'tamil', 'yoruba', 'asl']

const specialtyWords: [RegExp, string, string][] = [
  [/mortgage|home loan|buy(ing)? a (home|house)|pre-?approv/, 'Mortgages', 'mortgage'],
  [/invest|retire|401k|ira|wealth/, 'Investing', 'invest'],
  [/credit (build|score coach)|build (my )?credit/, 'Credit building', 'credit'],
  [/business|llc|merchant/, 'Business accounts', 'business'],
  [/dispute|fraud specialist/, 'Fraud & disputes', 'fraud'],
  [/open (an |a )?account|new account|joint account/, 'New accounts', 'account'],
]

function parseAmount(t: string) {
  const m = t.match(/\$?\s?(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?/)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1)
  return Number.isFinite(n) && n > 0 ? n : null
}

function matchVault(t: string, vaults: Vault[]) {
  if (/tokyo|japan|trip|travel|vacation/.test(t)) return vaults.find((v) => v.id === 'japan')
  if (/emergency|rainy/.test(t)) return vaults.find((v) => v.id === 'emergency')
  if (/home|house|down ?payment/.test(t)) return vaults.find((v) => v.id === 'home')
  return null
}

function matchPayee(t: string) {
  return payees.find((p) => t.includes(p.name.split(' ')[0].toLowerCase()) || t.includes(p.handle.toLowerCase())) ?? null
}

function findBranchIds(specialty?: string, language?: string) {
  return branches
    .filter((b) => {
      const team = bankers.filter((bk) => b.bankerIds.includes(bk.id))
      const specialtyOk = !specialty || team.some((bk) => bk.specialties.includes(specialty))
      const languageOk =
        !language ||
        b.languages.some((l) => l.toLowerCase() === language) ||
        team.some((bk) => bk.languages.some((l) => l.toLowerCase() === language))
      return specialtyOk && languageOk
    })
    .sort((a, b) => Number(b.openNow) - Number(a.openNow) || a.waitMins - b.waitMins)
    .slice(0, 3)
    .map((b) => b.id)
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const reply = (text: string, widgets: Widget[] = [], chips: string[] = [], effects: Effect[] = []): SageReply => ({
  text,
  widgets,
  chips,
  effects,
})

export function respond(raw: string, ctx: SageContext): SageReply {
  const t = raw.toLowerCase().trim()
  const amount = parseAmount(t)

  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b|what can you do|^help$|capabilit/.test(t)) {
    return reply(
      `Hi ${ctx.firstName}! I'm Tedi. I can act on your accounts, not just answer questions. Pick a topic or just tell me what you need.`,
      [{ kind: 'capabilities' }],
    )
  }

  if (/^(thanks|thank you|thx|ty|perfect|great|awesome)\b/.test(t)) {
    return reply("Anytime. I'm here 24/7 if anything else comes up.", [], ['How secure is my account?', "What's my balance?"])
  }

  if (/human|agent|representative|real person|talk to (someone|a person)|speak (to|with)|call me/.test(t)) {
    return reply(
      "Of course. I'm bringing in a TD specialist and sharing our conversation so you won't have to repeat yourself.",
      [{ kind: 'handoff', topic: 'Customer asked for a person from the Tedi chat. Full transcript attached.' }],
    )
  }

  if (/clicked|gave (them|my)|shared my (code|password|pin)|entered my/.test(t)) {
    return reply(
      "Okay, let's lock things down right now. I've frozen your card and turned on Street Safe so transfers are capped. A fraud specialist is joining to review your account with you.",
      [
        { kind: 'action', action: 'freeze', text: 'Card frozen — new charges blocked' },
        { kind: 'action', action: 'streetOn', text: 'Street Safe on — transfers capped at $200' },
        { kind: 'handoff', topic: 'Possible phishing: customer interacted with a suspicious message. Card frozen, Street Safe on.' },
      ],
      ['Review signed-in devices', 'How secure is my account?'],
      [
        { type: 'freeze', frozen: true },
        { type: 'streetSafe', on: true },
      ],
    )
  }

  if (/scam|phish|weird|suspicious|strange|sketchy|text (from|about|saying)|got a (text|call|email)|is this (really )?td|fake/.test(t)) {
    return reply(
      "Good call checking. Here's what I see in messages like this, and what TD will never ask you for.",
      [{ kind: 'scam' }],
      ['I clicked the link', 'Talk to a person'],
    )
  }

  if (/unfreeze|unlock|un-freeze|found (my )?(card|wallet)/.test(t)) {
    if (!ctx.cardFrozen) return reply('Your card is already active, nothing to unlock.', [], ['Show card controls'])
    return reply(
      'Welcome back! Your card is unlocked and ready to use.',
      [{ kind: 'action', action: 'unfreeze', text: 'Card unfrozen — ready to use' }],
      ['Show card controls'],
      [{ type: 'freeze', frozen: false }],
    )
  }

  if (/freeze|lock (my )?card|lost|stolen|missing (card|wallet)|can't find my (card|wallet)/.test(t)) {
    if (ctx.cardFrozen) {
      return reply('Your card is already frozen, so no new charges can go through.', [], ['Report fraud', 'Unfreeze my card'])
    }
    return reply(
      "Done. I froze your TD Clear Card instantly. Recurring bills like Netflix will still go through, so nothing breaks. If you find it, just say \"unfreeze\".",
      [{ kind: 'action', action: 'freeze', text: 'Card frozen — new charges blocked' }],
      ["I don't recognize a charge", 'Create a virtual card', 'Unfreeze my card'],
      [{ type: 'freeze', frozen: true }],
    )
  }

  if (/street safe|going out|night out|heading out|concert|bar /.test(t)) {
    const off = /\boff\b|disable|stop/.test(t)
    if (off) {
      return reply(
        'Street Safe is off. Your balances are back and limits are normal.',
        [{ kind: 'action', action: 'streetOff', text: 'Street Safe off' }],
        [],
        [{ type: 'streetSafe', on: false }],
      )
    }
    return reply(
      'Have fun! Street Safe is on: balances are hidden and transfers are capped at $200 until you turn it off.',
      [{ kind: 'action', action: 'streetOn', text: 'Street Safe on — balances hidden, $200 cap' }],
      ['Turn Street Safe off'],
      [{ type: 'streetSafe', on: true }],
    )
  }

  if (/don.?t recogni[sz]e|unrecogni[sz]ed|dispute|wasn.?t me|didn.?t (make|buy)|report fraud|fraud(ulent)? charge|charged twice/.test(t)) {
    return reply(
      "Let's sort that out. Tap any charges you don't recognize. I'll dispute them, credit you back for now, and lock the card in one step.",
      [{ kind: 'dispute', status: 'pending' }],
    )
  }

  if (/passkey/.test(t)) {
    if (ctx.passkey) return reply('Your passkey is already on. Nice, that is the strongest sign-in we offer.', [], ['How secure is my account?'])
    return reply(
      "Passkey created. From now on you'll sign in with Face ID, and there's no password for scammers to phish.",
      [{ kind: 'action', action: 'passkey', text: 'Passkey on — +14 security points' }],
      ['How secure is my account?'],
      [{ type: 'passkey' }],
    )
  }

  if (/secur|protect|safe is my|hack|score/.test(t) && !/credit score/.test(t)) {
    return reply(
      ctx.score >= 85
        ? `Your security score is ${ctx.score}. You're in great shape.`
        : `Your security score is ${ctx.score}/100. A few quick fixes would make your account much harder to break into:`,
      [{ kind: 'security' }],
      ctx.passkey ? ['Review signed-in devices'] : ['Turn on a passkey', 'Review signed-in devices'],
    )
  }

  if (/device|signed in|logged in|sign-?in/.test(t)) {
    return reply(
      'Every device signed in to your account is one you recognize. You can review or sign any of them out in the Security hub.',
      [{ kind: 'security' }],
      ['I clicked the link', 'Talk to a person'],
    )
  }

  if (/virtual|single.?use|burner|one.?time card/.test(t)) {
    const last4 = String(Math.floor(1000 + Math.random() * 9000))
    return reply(
      "Here's a single-use virtual card. It works once, then the number self-destructs. Perfect for sites you don't fully trust.",
      [{ kind: 'virtualCard', last4 }],
      ['Show card controls'],
      [{ type: 'virtualCard', last4 }],
    )
  }

  if (/control|international|abroad|online (purchase|shopping)|atm (limit|withdraw)|contactless|tap to pay|card limit|spending limit/.test(t)) {
    return reply('Here are your live card controls. Changes apply instantly.', [{ kind: 'controls' }], [
      'Create a virtual card',
      'Freeze my card',
    ])
  }

  if (/credit score|fico|my credit/.test(t)) {
    return reply(
      'Your score is 742, up 18 points since spring. Keeping card use under 10% of your limit is the fastest way to keep climbing.',
      [{ kind: 'credit' }],
      ['Find a credit-building banker'],
    )
  }

  const vault = matchVault(t, ctx.vaults)
  if (vault && /move|save|put|transfer|add|stash/.test(t)) {
    const amt = amount ?? 100
    const left = vault.goal - vault.balance
    return reply(
      `${amount ? '' : "I've set $100, just tell me if you want a different amount. "}After this, you'll be ${formatMoney(Math.max(0, left - amt))} from your ${vault.name} goal.`,
      [{ kind: 'vault', vaultId: vault.id, amount: amt, status: 'pending' }],
    )
  }

  if (/send|pay |zelle|venmo|transfer .* to|owe|split/.test(t)) {
    const payee = matchPayee(t)
    const amt = amount ?? 50
    return reply(
      payee
        ? `Ready to send ${formatMoney(amt)} to ${payee.name}. It arrives in seconds. Confirm when you're ready.`
        : `Who should I send ${formatMoney(amt)} to? Pick a contact below.`,
      [{ kind: 'send', payee: payee?.id ?? null, amount: amt, status: 'pending' }],
    )
  }

  if (/book|appointment|schedule|meet (with|a)|consult/.test(t)) {
    const reasonId = specialtyWords.find(([re]) => re.test(t))?.[2] ?? 'account'
    const reason = appointmentReasons.find((r) => r.id === reasonId)!
    return reply(
      `I found the best-matched banker for "${reason.label.toLowerCase()}". Pick a time and how you'd like to meet.`,
      [{ kind: 'book', reasonId, status: 'pending' }],
    )
  }

  const language = languages.find((l) => t.includes(l))
  const specialtyMatch = specialtyWords.find(([re]) => re.test(t))
  const specialty = specialtyMatch?.[1]
  const bookChip: Record<string, string> = {
    mortgage: 'Book a mortgage appointment',
    invest: 'Book an investing appointment',
    credit: 'Book a credit-building appointment',
    business: 'Book a business appointment',
    fraud: 'Book a fraud specialist',
    account: 'Book an account opening',
  }
  if (/branch|banker|near(by| me)|closest|wait time|atm|location/.test(t) || language || specialty) {
    const ids = findBranchIds(specialty, language)
    const filters = [language && `${cap(language === 'asl' ? 'ASL' : language)}-speaking`, specialty?.toLowerCase()]
      .filter(Boolean)
      .join(' ')
    return reply(
      ids.length
        ? `Here are the closest branches${filters ? ` with ${filters} bankers` : ''}, sorted by live wait time.`
        : "I couldn't find an exact match nearby, but I can set up a video appointment with the right specialist.",
      [{ kind: 'branches', ids }],
      specialtyMatch ? [bookChip[specialtyMatch[2]]] : ['Book an appointment'],
    )
  }

  if (/\b(cd|certificate)\b|best rate|higher rate|more interest|lock (in )?a rate/.test(t)) {
    return reply(
      'Your checking has more than you usually need. A 12-month CD locks in 4.25%, about $212 on $5,000.',
      [{ kind: 'offer', productId: 'step-cd' }],
      ['Start investing instead', "What's my balance?"],
    )
  }

  if (/credit card|cash ?back|rewards card|new card|double up|pre-?approv/.test(t)) {
    return reply(
      "Good news: you're pre-approved for TD Double Up with no impact to your credit score. Based on your spending, it'd earn about $340 a year.",
      [{ kind: 'offer', productId: 'double-up' }],
      ['What is my credit score?', 'How much did I spend this month?'],
    )
  }

  if (/\binvest|portfolio|stocks|etf|robo|grow my money/.test(t)) {
    return reply(
      'TD Auto Invest builds a mix of funds from $5 and keeps it balanced for you. You can invest your round-ups too.',
      [{ kind: 'offer', productId: 'auto-invest' }],
      ['Open a CD instead', 'How much did I spend this month?'],
    )
  }

  if (/balance|how much (money )?do i have|net worth|my accounts|available/.test(t)) {
    return reply("Here's where everything stands right now.", [{ kind: 'balances' }], [
      'How much did I spend this month?',
      'Move $100 to my Tokyo trip',
    ])
  }

  if (/spend|spent|budget|dining|groceries|shopping|where.*money (go|went)|expenses/.test(t)) {
    const focus = ['dining', 'groceries', 'shopping', 'bills', 'transport'].find((c) => t.includes(c))
    const text =
      focus === 'dining'
        ? 'You spent $412 on dining in October, 32% less than September. That\u2019s $194 saved — want me to move it to your Tokyo trip?'
        : focus === 'shopping'
          ? 'Shopping is up 18% to $291 this month, mostly Uniqlo SoHo. Want a spending cap on the category?'
          : 'You spent $1,441 in October. Dining is down 32%, and shopping is the one category trending up.'
    return reply(text, [{ kind: 'spending' }], ['Move $194 to my Tokyo trip', 'Set a spending limit'])
  }

  return reply(
    "I'm not sure I caught that. Here's what I can help with. Or I can connect you with a person.",
    [{ kind: 'capabilities' }],
    ['Talk to a person'],
  )
}
