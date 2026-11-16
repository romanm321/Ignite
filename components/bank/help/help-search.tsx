'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { TediIcon } from '../tedi-icon'
import { cn } from '@/lib/utils'
import { useBank, type GrowSection, type Overlay, type Tab } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { inputClass } from '../overlay'

type Destination = {
  label: string
  where: string
  keywords: string
  go: { overlay: Overlay } | { tab: Tab; plan?: GrowSection } | { security: 'prevent' | 'detect' | 'resolve' | 'data' }
}

const destinations: Destination[] = [
  { label: 'Send & request', where: 'Pay & Transfer', keywords: 'send money zelle p2p transfer friend request', go: { overlay: 'send' } },
  { label: 'Move money', where: 'Pay & Transfer', keywords: 'transfer between accounts checking savings move', go: { overlay: 'move' } },
  { label: 'Wire transfer', where: 'Pay & Transfer', keywords: 'wire domestic international swift bank transfer', go: { overlay: 'wire' } },
  { label: 'Pay a bill', where: 'Pay & Transfer', keywords: 'bills payee utilities autopay', go: { overlay: 'billpay' } },
  { label: 'Deposit a check', where: 'Pay & Transfer', keywords: 'cheque mobile deposit camera', go: { overlay: 'deposit' } },
  { label: 'Freeze my card', where: 'Settings', keywords: 'freeze lock card stolen lost', go: { tab: 'more' } },
  { label: 'Your accounts', where: 'Home', keywords: 'checking savings balance statement routing number', go: { tab: 'home' } },
  { label: 'My tier & benefits', where: 'Benefits', keywords: 'tier select premier wealth relationship status cash back offers deals', go: { tab: 'rewards' } },
  { label: 'Cash back, deals & offers', where: 'Benefits', keywords: 'rewards offers cash back deals shop online browser extension', go: { tab: 'cards' } },
  { label: 'Vaults & savings', where: 'Plan', keywords: 'save goal round-ups salary sorter pot', go: { tab: 'grow', plan: 'vaults' } },
  { label: 'Investing', where: 'Plan', keywords: 'stocks etf invest portfolio', go: { overlay: 'invest' } },
  { label: 'Credit score', where: 'Home', keywords: 'credit report score fico', go: { overlay: 'credit' } },
  { label: 'TD Family accounts', where: 'Plan', keywords: 'kids teen child allowance family', go: { overlay: 'family' } },
  { label: 'Spending insights & trends', where: 'Plan', keywords: 'spending trends insights categories payday cycle safe to spend', go: { tab: 'grow', plan: 'insights' } },
  { label: 'Budget', where: 'Plan', keywords: 'budget limit dining groceries flexible leftover', go: { tab: 'grow', plan: 'insights' } },
  { label: 'Bills due before payday', where: 'Plan', keywords: 'committed bills rent upcoming due subscriptions apart', go: { tab: 'grow', plan: 'insights' } },
  { label: 'Subscriptions', where: 'Home', keywords: 'recurring cancel netflix spotify', go: { overlay: 'subscriptions' } },
  { label: 'Report fraud', where: 'Settings', keywords: 'scam stolen fraud unauthorized', go: { security: 'resolve' } },
  { label: 'Dispute a charge', where: 'Settings', keywords: 'dispute refund chargeback wrong charge', go: { security: 'resolve' } },
  { label: 'Security alerts', where: 'Settings', keywords: 'suspicious login alert device', go: { security: 'detect' } },
  { label: 'Security hub', where: 'Settings', keywords: 'passkey password 2fa security score', go: { security: 'prevent' } },
  { label: 'Alerts & notifications', where: 'Settings', keywords: 'low balance notification push', go: { overlay: 'alerts' } },
  { label: 'Profile & settings', where: 'Settings', keywords: 'address phone email name street safe sign out', go: { tab: 'more' } },
  { label: 'Accessibility', where: 'Settings', keywords: 'text size contrast read aloud motion', go: { overlay: 'accessibility' } },
  { label: 'Branches & ATMs', where: 'Settings', keywords: 'branch atm location wait time line', go: { tab: 'branches' } },
  { label: 'Book an appointment', where: 'Settings', keywords: 'advisor banker meeting video appointment', go: { tab: 'branches' } },
  { label: 'Explore TD products', where: 'Settings', keywords: 'open account cd card new product', go: { overlay: 'explore' } },
]

export function HelpSearch() {
  const { dispatch } = useBank()
  const trust = useTrust()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const results = useMemo(
    () => (q ? destinations.filter((d) => `${d.label} ${d.where} ${d.keywords}`.toLowerCase().includes(q)).slice(0, 6) : []),
    [q],
  )

  const go = (d: Destination) => {
    if ('overlay' in d.go) dispatch({ type: 'overlay', overlay: d.go.overlay })
    else if ('tab' in d.go) {
      if (d.go.plan) dispatch({ type: 'growSection', section: d.go.plan })
      dispatch({ type: 'navigate', tab: d.go.tab })
    }
    else {
      trust.dispatch({ type: 'securityTab', tab: d.go.security })
      dispatch({ type: 'overlay', overlay: 'security' })
    }
  }

  return (
    <section aria-labelledby="help-search-h" className="flex flex-col gap-3">
      <h2 id="help-search-h" className="sr-only">
        Search
      </h2>
      <label className="relative">
        <span className="sr-only">Search the app and help topics</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: “dispute”, “routing number”…"
          className={cn(inputClass, 'rounded-full pl-10')}
        />
      </label>
      {q && (
        <ul className="divide-y overflow-hidden rounded-3xl bg-card" aria-live="polite">
          {results.map((d) => (
            <li key={d.label}>
              <button type="button" onClick={() => go(d)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{d.label}</span>
                  <span className="block text-xs text-muted-foreground">{d.where}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => dispatch({ type: 'askTedi', prompt: query.trim() })}
              className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground">
                <TediIcon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                {results.length ? 'Not it? ' : 'No matches. '}
                <span className="font-semibold">Ask Tedi “{query.trim()}”</span>
              </span>
            </button>
          </li>
        </ul>
      )}
    </section>
  )
}
