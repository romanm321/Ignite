'use client'

import { useState } from 'react'
import { ChevronRight, ShieldCheck, TriangleAlert } from 'lucide-react'
import { committedItems, type CommittedItem } from '@/lib/insights'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { CreateVaultSheet } from '../vaults/vault-sheets'
import { useInsights } from './use-insights'

const dueLabel = (dueIn: number) => (dueIn <= 0 ? 'Due today' : dueIn === 1 ? 'Due tomorrow' : `Due in ${dueIn} days`)

function BillRow({ item, beforePayday }: { item: CommittedItem; beforePayday: boolean }) {
  const { vaults, dispatch } = useBank()
  const { show } = useInsights()
  const vault = vaults.find((v) => v.id === item.vaultId)
  return (
    <li>
      <button
        type="button"
        onClick={() => dispatch({ type: 'overlay', overlay: item.kind === 'bill' ? 'billpay' : 'subscriptions' })}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold">{item.name.slice(0, 1)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{item.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {dueLabel(item.dueIn)}
            {item.kind === 'bill' ? ` · ${item.autopay ? 'Autopay on' : 'Pay by hand'}` : ' · Renews'}
          </span>
          {vault && <span className="block truncate text-xs font-medium text-primary">Paid from {vault.name}</span>}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="tabular font-mono text-sm font-semibold">{show(item.amount)}</span>
          {!beforePayday && <span className="text-xs text-muted-foreground">Next payday</span>}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  )
}

function Group({ title, items, cycleDays, id }: { title: string; items: CommittedItem[]; cycleDays: number; id: string }) {
  const { showWhole } = useInsights()
  if (items.length === 0) return null
  const total = items.filter((i) => i.dueIn < cycleDays).reduce((s, i) => s + i.amount, 0)
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <SectionHeader
        id={id}
        title={title}
        action={<span className="tabular font-mono text-sm text-muted-foreground">{showWhole(total)} before payday</span>}
      />
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {items.map((i) => (
          <BillRow key={i.id} item={i} beforePayday={i.dueIn < cycleDays} />
        ))}
      </ul>
    </section>
  )
}

function VaultCover() {
  const { vaults, payees, transactions, subs, dispatch, notify } = useBank()
  const { cycle, showWhole } = useInsights()
  const [creating, setCreating] = useState(false)
  const billsVault = vaults.find((v) => v.billPayeeIds.length > 0)
  const items = committedItems({ transactions, payees, vaults, subs })

  if (!billsVault) {
    return (
      <section className="rounded-3xl bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold">Set bills aside before they land</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">A Bills vault holds money for rent and utilities, so you never spend it by accident.</p>
          </div>
        </div>
        <button type="button" onClick={() => setCreating(true)} className="mt-3 h-12 w-full rounded-xl bg-forest text-sm font-semibold text-forest-foreground">
          Create a Bills vault
        </button>
        {creating && <CreateVaultSheet onClose={() => setCreating(false)} />}
      </section>
    )
  }

  const covered = items.filter((i) => i.vaultId === billsVault.id).reduce((s, i) => s + i.amount, 0)
  const short = Math.max(0, covered - billsVault.balance)
  const topUp = Math.max(25, Math.ceil((short || 100) / 25) * 25)

  return (
    <section aria-labelledby="cover-h" className="rounded-3xl bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 id="cover-h" className="font-semibold">
            {billsVault.name} covers {showWhole(covered)} of bills
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {short > 0 ? `It holds ${showWhole(billsVault.balance)}, ${showWhole(short)} short of what it pays.` : `It holds ${showWhole(billsVault.balance)}, enough for everything linked to it.`}
            {cycle.committedTotal > covered && ` ${showWhole(cycle.committedTotal - covered)} due before payday is paid from checking.`}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'vaultTransfer', vaultId: billsVault.id, amount: topUp })
            notify(`${showWhole(topUp)} added to ${billsVault.name}`)
          }}
          className="h-12 rounded-xl bg-forest text-sm font-semibold text-forest-foreground"
        >
          Add {showWhole(topUp)}
        </button>
        <button type="button" onClick={() => dispatch({ type: 'openVault', id: billsVault.id })} className="h-12 rounded-xl border text-sm font-semibold">
          Manage vault
        </button>
      </div>
    </section>
  )
}

export function BillsTab() {
  const { payees, vaults, transactions, subs, dispatch } = useBank()
  const { cycle, subsActive, showWhole } = useInsights()
  const all = committedItems({ transactions, payees, vaults, subs })
  const bills = all.filter((i) => i.kind === 'bill')
  const subscriptions = all.filter((i) => i.kind === 'subscription')
  const flagged = subsActive.find((s) => s.insight)

  return (
    <>
      <section aria-labelledby="committed-h" className="rounded-3xl bg-forest p-5 text-forest-foreground">
        <h3 id="committed-h" className="text-sm text-forest-foreground/70">
          Due before payday ({cycle.nextPayday})
        </h3>
        <p className="tabular font-mono text-4xl font-semibold">{showWhole(cycle.committedTotal)}</p>
        <p className="mt-1 text-sm text-lime">
          {cycle.committed.length === 0
            ? 'Nothing due yet. Add a bill and it will show up here.'
            : `${cycle.committed.length} bill${cycle.committed.length === 1 ? '' : 's'} and subscription${cycle.committed.length === 1 ? '' : 's'}, kept apart from everyday spending`}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-3 text-sm">
          <div>
            <dt className="text-forest-foreground/70">Bills</dt>
            <dd className="tabular font-mono font-semibold">{showWhole(cycle.committed.filter((c) => c.kind === 'bill').reduce((s, c) => s + c.amount, 0))}</dd>
          </div>
          <div>
            <dt className="text-forest-foreground/70">Subscriptions</dt>
            <dd className="tabular font-mono font-semibold">{showWhole(cycle.committed.filter((c) => c.kind === 'subscription').reduce((s, c) => s + c.amount, 0))}</dd>
          </div>
        </dl>
      </section>

      {flagged && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'subscriptions' })}
          className="flex items-start gap-3 rounded-2xl border border-lime bg-lime/25 p-4 text-left"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="flex-1 text-sm">
            <span className="block font-semibold">{flagged.name}</span>
            <span className="block text-muted-foreground">{flagged.insight}</span>
          </span>
          <span className="self-center text-sm font-semibold text-primary">Review</span>
        </button>
      )}

      <Group id="bills-h" title="Bills" items={bills} cycleDays={cycle.daysLeft} />
      <Group id="subs-h" title="Subscriptions" items={subscriptions} cycleDays={cycle.daysLeft} />
      <VaultCover />
    </>
  )
}
