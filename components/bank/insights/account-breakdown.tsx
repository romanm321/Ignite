'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { Switch } from '../primitives'
import { AccountMark } from './account-mark'
import { PlaidLinkSheet } from './plaid-link-sheet'
import { useInsightsView } from './use-insights-view'

/**
 * Every account with a switch. Switched-on accounts are added together in the charts above, and the last one stays on.
 * Linking an account from another bank sits at the end of the same list.
 */
export function AccountBreakdown() {
  const { all, ids, selected, balance, setSelected } = useInsightsView()
  const { streetSafe, dispatch } = useBank()
  const [linking, setLinking] = useState(false)
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const total = selected.reduce((s, a) => s + Math.abs(a.balance), 0) || 1
  const allOn = ids.length === all.length

  const toggle = (id: string, on: boolean) => {
    if (on) setSelected([...ids, id])
    else setSelected(ids.filter((x) => x !== id))
  }

  return (
    <section aria-labelledby="breakdown-h" className="flex flex-col gap-3">
      <SectionHeader
        id="breakdown-h"
        title="Breakdown"
        action={
          <button
            type="button"
            onClick={() => setSelected(allOn ? [] : all.map((a) => a.id))}
            className="flex h-11 items-center text-sm font-semibold text-primary"
          >
            {allOn ? 'Deselect all' : 'Select all'}
          </button>
        }
      />
      <p className="-mt-1 px-1 text-sm text-muted-foreground">
        {ids.length === 0 ? 'Switch an account on to see its numbers.' : 'Switch an account off to take it out of the charts.'}
      </p>
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {all.map((a) => {
          const on = ids.includes(a.id)
          return (
            <li key={a.id} className={cn('flex items-center gap-3 px-4 py-3', !on && 'opacity-60')}>
              <AccountMark account={a} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.subtitle}</span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: on ? `${(Math.abs(a.balance) / total) * 100}%` : '0%' }} />
                </span>
              </span>
              <span className="tabular shrink-0 font-mono text-sm font-semibold">{show(a.balance)}</span>
              {a.kind === 'external' && (
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => dispatch({ type: 'unlinkExternal', id: a.id })}
                  className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              )}
              <Switch checked={on} label={`Include ${a.name}`} onChange={(v) => toggle(a.id, v)} />
            </li>
          )
        })}
        {selected.length > 1 && (
          <li className="flex min-h-12 items-center justify-between bg-muted/50 px-4 py-3 text-sm">
            <span className="font-medium">Combined</span>
            <span className="tabular font-mono font-semibold">{show(balance)}</span>
          </li>
        )}
      </ul>
      <button
        type="button"
        onClick={() => setLinking(true)}
        className="flex h-14 items-center justify-between rounded-2xl border-2 border-dashed border-primary/50 px-4 font-semibold text-primary"
      >
        Add external account
        <Plus className="size-5" aria-hidden />
      </button>
      {linking && <PlaidLinkSheet onClose={() => setLinking(false)} />}
    </section>
  )
}
