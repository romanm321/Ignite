import { accountDetails, spendingByCategory, type Account, type Transaction, type Vault } from './bank-data'
import { enrich } from './enrichment'
import type { Payee } from './everyday-data'
import { NEXT_PAYDAY, PAYCHECK, blendedApy, perPaycheckDeposit, roundUpsThisMonth, vaultTotal } from './vaults'

export type FlexibleCategory = 'Dining' | 'Groceries' | 'Shopping' | 'Transport' | 'Travel'
export type CategoryChoice = FlexibleCategory | 'Bills'

export const flexibleCategories: FlexibleCategory[] = ['Dining', 'Groceries', 'Shopping', 'Transport', 'Travel']
export const categoryChoices: CategoryChoice[] = [...flexibleCategories, 'Bills']
export const isFlexible = (c: string): c is FlexibleCategory => (flexibleCategories as string[]).includes(c)

export const LAST_PAYDAY = 'Nov 9'
export const CYCLE_LENGTH = 14

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const TODAY = new Date(2026, 10, 10)
const DAY_MS = 86_400_000

function parseLabel(label: string) {
  const m = label.match(/^([A-Z][a-z]{2}) (\d{1,2})/)
  if (!m) return null
  const month = MONTHS.indexOf(m[1])
  return month < 0 ? null : new Date(2026, month, Number(m[2]))
}

/** Whole days between today and a "Mon D" label. Positive means in the future. */
export function daysUntil(label: string) {
  const d = parseLabel(label)
  return d ? Math.round((d.getTime() - TODAY.getTime()) / DAY_MS) : 999
}

export function daysAgo(when: string) {
  if (/^(just now|today)/i.test(when)) return 0
  if (/^yesterday/i.test(when)) return 1
  const d = parseLabel(when)
  return d ? Math.round((TODAY.getTime() - d.getTime()) / DAY_MS) : 999
}

const accountOfTxn = (t: Transaction) => t.accountId ?? 'chk'
export const isSpend = (t: Transaction) => t.amount < 0 && t.category !== 'Transfer' && t.category !== 'Income'
export const categoryOf = (t: Transaction, overrides: Record<string, CategoryChoice>) => overrides[t.merchant] ?? t.category

export type ActiveSub = { id: string; name: string; amount: number; nextDate: string; dueIn: number; insight?: string }

export function activeSubscriptions(transactions: Transaction[], subs: Record<string, { status: string }>): ActiveSub[] {
  const seen = new Set<string>()
  const out: ActiveSub[] = []
  for (const t of transactions) {
    const e = enrich(t)
    const s = e.subscription
    if (!s || seen.has(s.id) || subs[s.id]?.status !== 'active') continue
    seen.add(s.id)
    out.push({ id: s.id, name: e.name, amount: Math.abs(t.amount), nextDate: s.nextDate, dueIn: daysUntil(s.nextDate), insight: s.insight?.text })
  }
  return out.sort((a, b) => a.dueIn - b.dueIn)
}

export type CommittedItem = {
  id: string
  kind: 'bill' | 'subscription'
  name: string
  detail: string
  amount: number
  dueIn: number
  autopay: boolean
  vaultId: string | null
}

type Inputs = {
  transactions: Transaction[]
  payees: Payee[]
  vaults: Vault[]
  subs: Record<string, { status: string }>
  overrides: Record<string, CategoryChoice>
}

export function committedItems({ transactions, payees, vaults, subs }: Omit<Inputs, 'overrides'>): CommittedItem[] {
  const bills: CommittedItem[] = payees
    .filter((p) => !p.paid)
    .map((p) => ({
      id: p.id,
      kind: 'bill' as const,
      name: p.name,
      detail: p.category,
      amount: p.amountDue,
      dueIn: p.dueIn,
      autopay: p.autopay,
      vaultId: vaults.find((v) => v.billPayeeIds.includes(p.id))?.id ?? null,
    }))
  const subscriptions: CommittedItem[] = activeSubscriptions(transactions, subs).map((s) => ({
    id: `sub-${s.id}`,
    kind: 'subscription' as const,
    name: s.name,
    detail: 'Subscription',
    amount: s.amount,
    dueIn: s.dueIn,
    autopay: true,
    vaultId: null,
  }))
  return [...bills, ...subscriptions].sort((a, b) => a.dueIn - b.dueIn)
}

export type Cycle = {
  hasPaycheck: boolean
  paycheck: number
  sorted: number
  committed: CommittedItem[]
  committedTotal: number
  room: number
  spent: number
  left: number
  perDay: number
  dayOfCycle: number
  length: number
  daysLeft: number
  lastPayday: string
  nextPayday: string
  spentByCategory: Record<FlexibleCategory, number>
}

export function buildCycle(input: Inputs): Cycle {
  const { transactions, vaults, overrides } = input
  const daysLeft = Math.max(1, daysUntil(NEXT_PAYDAY))
  const sinceLastPayday = Math.max(0, daysAgo(LAST_PAYDAY))
  const hasPaycheck = transactions.some((t) => t.category === 'Income' && /payroll/i.test(t.merchant))
  const paycheck = hasPaycheck ? PAYCHECK : 0
  const sorted = hasPaycheck ? vaults.reduce((s, v) => s + perPaycheckDeposit(v), 0) : 0

  const committed = committedItems(input).filter((c) => c.dueIn >= 0 && c.dueIn < daysLeft)
  const committedTotal = committed.reduce((s, c) => s + c.amount, 0)

  const spentByCategory: Record<FlexibleCategory, number> = { Dining: 0, Groceries: 0, Shopping: 0, Transport: 0, Travel: 0 }
  for (const t of transactions) {
    if (!isSpend(t) || daysAgo(t.when) > sinceLastPayday) continue
    const c = categoryOf(t, overrides)
    if (isFlexible(c)) spentByCategory[c] += Math.abs(t.amount)
  }
  const spent = Object.values(spentByCategory).reduce((s, n) => s + n, 0)
  const room = Math.max(0, paycheck - sorted - committedTotal)
  const left = room - spent

  return {
    hasPaycheck,
    paycheck,
    sorted,
    committed,
    committedTotal,
    room,
    spent,
    left,
    perDay: Math.max(0, left) / daysLeft,
    dayOfCycle: sinceLastPayday + 1,
    length: CYCLE_LENGTH,
    daysLeft,
    lastPayday: LAST_PAYDAY,
    nextPayday: NEXT_PAYDAY,
    spentByCategory,
  }
}

export type MonthRow = { category: string; amount: number; change: number; previous: number }

export type Month = {
  flexible: MonthRow[]
  flexibleTotal: number
  committedRows: { label: string; amount: number }[]
  committedTotal: number
  all: MonthRow[]
}

export function buildMonth(input: { transactions: Transaction[]; payees: Payee[]; overrides: Record<string, CategoryChoice>; useAggregates: boolean }): Month {
  const { transactions, payees, overrides, useAggregates } = input
  const base = new Map<string, { amount: number; previous: number }>()
  if (useAggregates) for (const s of spendingByCategory) base.set(s.category, { amount: s.amount, previous: s.amount / (1 + s.change / 100) })

  const add = (category: string, amount: number) => {
    const row = base.get(category)
    base.set(category, { amount: (row?.amount ?? 0) + amount, previous: row?.previous ?? 0 })
  }

  for (const t of transactions) {
    if (!isSpend(t) || daysAgo(t.when) > 30) continue
    const amount = Math.abs(t.amount)
    const to = categoryOf(t, overrides)
    if (to === t.category) {
      if (!useAggregates) add(to, amount)
      continue
    }
    if (useAggregates) add(t.category, -amount)
    add(to, amount)
  }

  const rows: MonthRow[] = [...base.entries()]
    .map(([category, v]) => {
      const amount = Math.max(0, Math.round(v.amount))
      const previous = v.previous > 0 ? Math.round(v.previous) : amount
      return { category, amount, previous, change: previous > 0 ? Math.round((amount / previous - 1) * 100) : 0 }
    })
    .sort((a, b) => b.amount - a.amount)
  const flexible = rows.filter((r) => isFlexible(r.category))
  const bills = rows.find((r) => r.category === 'Bills')?.amount ?? 0
  const housing = payees.filter((p) => p.category === 'Housing' || p.category === 'Insurance').reduce((s, p) => s + p.amountDue, 0)
  const committedRows = [
    { label: 'Bills & subscriptions', amount: bills },
    { label: 'Rent & insurance', amount: Math.round(housing) },
  ].filter((r) => r.amount > 0)

  return {
    flexible,
    flexibleTotal: flexible.reduce((s, r) => s + r.amount, 0),
    committedRows,
    committedTotal: committedRows.reduce((s, r) => s + r.amount, 0),
    all: rows,
  }
}

/** What someone typically spends in a single payday cycle, from a month of spend. */
export const usualPerCycle = (monthly: number) => Math.round((monthly * CYCLE_LENGTH) / 30)

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

export const starterBudgets: Record<string, number> = { Dining: 100, Groceries: 150, Shopping: 75, Transport: 40 }

/** Fits last month's habits into the money actually left after vaults and bills. */
export function suggestBudgets(room: number, rows: MonthRow[]): Record<string, number> {
  const usual = rows.filter((r) => isFlexible(r.category) && r.category !== 'Travel').map((r) => ({ category: r.category, usual: usualPerCycle(r.amount) }))
  const total = usual.reduce((s, r) => s + r.usual, 0)
  if (total === 0) return { ...starterBudgets }
  const scale = room > 0 && total > room ? (room * 0.95) / total : 1
  return Object.fromEntries(usual.map((r) => [r.category, roundTo5(r.usual * scale)]))
}

export function defaultBudgets(input: Omit<Inputs, 'overrides'>): Record<string, number> {
  const cycle = buildCycle({ ...input, overrides: {} })
  const month = buildMonth({ transactions: input.transactions, payees: input.payees, overrides: {}, useAggregates: true })
  return suggestBudgets(cycle.room, month.all)
}

export type BudgetStatus = 'ok' | 'near' | 'over'
export type BudgetRow = { category: FlexibleCategory; limit: number; spent: number; left: number; pct: number; status: BudgetStatus; usual: number }

export function buildBudgetRows(cycle: Cycle, budgets: Record<string, number>, month: Month): BudgetRow[] {
  return flexibleCategories
    .filter((c) => budgets[c] !== undefined || month.flexible.some((r) => r.category === c) || cycle.spentByCategory[c] > 0)
    .map((category) => {
      const limit = budgets[category] ?? 0
      const spent = cycle.spentByCategory[category]
      const pct = limit > 0 ? (spent / limit) * 100 : 0
      return {
        category,
        limit,
        spent,
        left: limit - spent,
        pct,
        status: (pct > 100 ? 'over' : pct >= 80 ? 'near' : 'ok') as BudgetStatus,
        usual: usualPerCycle(month.flexible.find((r) => r.category === category)?.amount ?? 0),
      }
    })
}

export type ProductRow = { id: string; name: string; kind: Account['kind'] | 'vaults'; headline: string; detail: string }

export function buildProducts(input: { accounts: Account[]; transactions: Transaction[]; vaults: Vault[] }) {
  const { accounts, transactions, vaults } = input
  const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
  let interestPerMonth = 0
  const rows: ProductRow[] = accounts.map((a) => {
    const recent = transactions.filter((t) => accountOfTxn(t) === a.id && daysAgo(t.when) <= 30)
    const spent = recent.filter(isSpend).reduce((s, t) => s + Math.abs(t.amount), 0)
    const count = recent.filter(isSpend).length
    const incoming = recent.filter((t) => t.category === 'Income' && t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const apy = accountDetails[a.id]?.apy
    if (a.kind === 'credit') {
      const used = a.limit ? Math.round((Math.abs(a.balance) / a.limit) * 100) : 0
      return { id: a.id, name: a.name, kind: a.kind, headline: `${money(spent)} charged`, detail: `${count} purchase${count === 1 ? '' : 's'} · ${used}% of limit used` }
    }
    if (a.kind === 'savings' && apy) {
      const monthly = (a.balance * apy) / 100 / 12
      interestPerMonth += monthly
      return { id: a.id, name: a.name, kind: a.kind, headline: `~${money(monthly)} a month`, detail: `${apy}% interest on ${money(a.balance)}` }
    }
    return {
      id: a.id,
      name: a.name,
      kind: a.kind,
      headline: `${money(spent)} spent`,
      detail: incoming > 0 ? `${money(incoming)} came in · ${count} purchase${count === 1 ? '' : 's'}` : `${count} purchase${count === 1 ? '' : 's'}`,
    }
  })

  if (vaults.length > 0) {
    const monthly = (vaultTotal(vaults) * blendedApy(vaults)) / 100 / 12
    interestPerMonth += monthly
    rows.push({
      id: 'vaults',
      name: `${vaults.length} vault${vaults.length === 1 ? '' : 's'}`,
      kind: 'vaults',
      headline: `~${money(monthly)} a month`,
      detail: `${money(vaultTotal(vaults))} at ${blendedApy(vaults).toFixed(2)}% interest`,
    })
  }
  return { rows, interestPerMonth }
}

export type TrendAction =
  | { kind: 'vaultMove'; vaultId: string; amount: number; label: string }
  | { kind: 'budget'; category: FlexibleCategory; label: string }
  | { kind: 'subs'; label: string }
  | { kind: 'vaultBill'; vaultId: string; payeeId: string; label: string }
  | { kind: 'openVault'; vaultId: string; label: string }
  | { kind: 'createVault'; label: string }
  | { kind: 'roundUps'; vaultId: string; label: string }
  | { kind: 'tab'; tab: 'spending' | 'bills'; label: string }

export type TrendItem = {
  id: string
  tone: 'good' | 'watch' | 'info'
  icon: 'down' | 'up' | 'repeat' | 'vault' | 'coins' | 'bills' | 'pace'
  title: string
  body: string
  compare?: { previous: number; now: number }
  actions: TrendAction[]
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export function buildTrends(input: {
  isNew: boolean
  cycle: Cycle
  month: Month
  vaults: Vault[]
  transactions: Transaction[]
  subs: ActiveSub[]
  budgets: Record<string, number>
  roundUpsVaultId: string | null
  overrides: Record<string, CategoryChoice>
}): TrendItem[] {
  const { isNew, cycle, month, vaults, transactions, subs, budgets, roundUpsVaultId, overrides } = input
  const items: TrendItem[] = []

  const goalVault = [...vaults].filter((v) => !v.lockedUntil).sort((a, b) => b.goal - b.balance - (a.goal - a.balance))[0]

  if (vaults.length === 0) {
    items.push({
      id: 'first-vault',
      tone: 'info',
      icon: 'vault',
      title: 'Save for a goal',
      body: 'Pick a goal and add a little each payday.',
      actions: [{ kind: 'createVault', label: 'Create a Vault' }],
    })
  }

  const faller = month.flexible.filter((r) => r.change <= -10).sort((a, b) => a.change - b.change)[0]
  if (faller) {
    const saved = faller.previous - faller.amount
    const move = Math.max(25, Math.min(100, Math.floor((saved / 2) / 25) * 25))
    items.push({
      id: `down-${faller.category}`,
      tone: 'good',
      icon: 'down',
      title: `You spent less on ${faller.category}`,
      body: `${usd(saved)} less than last month. Save some of it?`,
      compare: { previous: faller.previous, now: faller.amount },
      actions: goalVault
        ? [{ kind: 'vaultMove', vaultId: goalVault.id, amount: move, label: `Move ${usd(move)} to ${goalVault.name}` }]
        : [{ kind: 'createVault', label: 'Start a Vault' }],
    })
  }

  const riser = month.flexible.filter((r) => r.change >= 10).sort((a, b) => b.change - a.change)[0]
  if (riser && isFlexible(riser.category)) {
    const top = transactions
      .filter((t) => isSpend(t) && categoryOf(t, overrides) === riser.category && daysAgo(t.when) <= 30)
      .sort((a, b) => a.amount - b.amount)[0]
    const category = riser.category
    items.push({
      id: `up-${category}`,
      tone: 'watch',
      icon: 'up',
      title: `${category} is up`,
      body: `${usd(riser.amount - riser.previous)} more than last month.`,
      compare: { previous: riser.previous, now: riser.amount },
      actions: [{ kind: 'budget', category, label: budgets[category] ? 'Change limit' : 'Set a limit' }],
    })
  }

  if (cycle.hasPaycheck) {
    const usual = month.flexible.filter((r) => r.category !== 'Travel').reduce((s, r) => s + usualPerCycle(r.amount), 0)
    if (usual > cycle.room) {
      items.push({
        id: 'pace',
        tone: 'watch',
        icon: 'pace',
        title: 'Tighter than usual',
        body: `You usually spend about ${usd(usual)} between paydays. You have ${usd(cycle.room)} this time.`,
        actions: [{ kind: 'tab', tab: 'spending', label: 'See spending' }],
      })
    }
  }

  for (const s of subs.filter((x) => x.insight).slice(0, 1)) {
    items.push({
      id: `sub-${s.id}`,
      tone: 'watch',
      icon: 'repeat',
      title: `${s.name} costs more`,
      body: s.insight ?? '',
      actions: [{ kind: 'subs', label: 'Review' }],
    })
  }

  const billsVault = vaults.find((v) => v.billPayeeIds.length > 0)
  const uncovered = cycle.committed.filter((c) => c.kind === 'bill' && !c.vaultId).sort((a, b) => b.amount - a.amount)[0]
  if (billsVault && uncovered && uncovered.amount >= 100) {
    items.push({
      id: `cover-${uncovered.id}`,
      tone: 'info',
      icon: 'bills',
      title: `${uncovered.name} isn’t set aside`,
      body: `${usd(uncovered.amount)} is due in ${uncovered.dueIn} days.`,
      actions: [{ kind: 'vaultBill', vaultId: billsVault.id, payeeId: uncovered.id, label: `Pay from ${billsVault.name}` }],
    })
  }

  if (vaults.length > 0) {
    const roundUpsVault = vaults.find((v) => v.id === roundUpsVaultId)
    if (roundUpsVault) {
      items.push({
        id: 'roundups-on',
        tone: 'good',
        icon: 'coins',
        title: 'Round-ups are working',
        body: `${roundUpsThisMonth(transactions).toFixed(2)} added to ${roundUpsVault.name} this month.`,
        actions: [{ kind: 'openVault', vaultId: roundUpsVault.id, label: 'Manage' }],
      })
    } else {
      items.push({
        id: 'roundups-off',
        tone: 'info',
        icon: 'coins',
        title: 'Save your spare change',
        body: `Round up each purchase. About ${Math.max(1, roundUpsThisMonth(transactions)).toFixed(2)} this month.`,
        actions: [{ kind: 'roundUps', vaultId: vaults[0].id, label: 'Turn on round-ups' }],
      })
    }
  }

  if (isNew && items.length === 0) {
    items.push({
      id: 'warming-up',
      tone: 'info',
      icon: 'pace',
      title: 'Tips come after your first payday',
      body: 'We’ll show what changed and what to do.',
      actions: [],
    })
  }

  return items
}
