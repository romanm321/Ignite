'use client'

import { Gauge, Globe, PlusCircle, Repeat, TrendingUp, Users } from 'lucide-react'
import { customer, formatMoney } from '@/lib/bank-data'
import { creditBand } from '@/lib/everyday-data'
import { useBank } from '../bank-provider'
import { ScreenHeader, SectionHeader } from '../primitives'
import { AccountRow } from '../accounts/account-row'
import { LinkRow, SubNav, TediButton, accountsSubNav } from '../nav'

export function AccountsScreen() {
  const { accounts, wallets, streetSafe, dispatch } = useBank()
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const banking = accounts.filter((a) => a.kind !== 'credit')
  const credit = accounts.filter((a) => a.kind === 'credit')
  const assets = banking.reduce((s, a) => s + a.balance, 0)
  const owed = credit.reduce((s, a) => s + Math.abs(a.balance), 0)
  const foreign = wallets.filter((w) => w.code !== 'USD' && w.balance > 0)
  const band = creditBand(customer.creditScore)

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Accounts" subtitle="Everything you hold with TD" right={<TediButton />} />
      <SubNav label="Accounts sections" items={accountsSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <section aria-label="Summary" className="grid grid-cols-2 gap-2">
          <div className="rounded-3xl bg-forest p-4 text-forest-foreground">
            <p className="text-xs text-forest-foreground/70">You have</p>
            <p className="tabular mt-1 font-mono text-xl font-semibold">{show(assets)}</p>
          </div>
          <div className="rounded-3xl bg-card p-4">
            <p className="text-xs text-muted-foreground">You owe</p>
            <p className="tabular mt-1 font-mono text-xl font-semibold">{show(owed)}</p>
          </div>
        </section>

        <section aria-labelledby="banking-h" className="flex flex-col gap-3">
          <SectionHeader id="banking-h" title="Banking" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {banking.map((a) => (
              <li key={a.id}>
                <AccountRow account={a} masked={streetSafe} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credit-h" className="flex flex-col gap-3">
          <SectionHeader id="credit-h" title="Credit" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {credit.map((a) => (
              <li key={a.id}>
                <AccountRow account={a} masked={streetSafe} />
              </li>
            ))}
            <LinkRow
              icon={Gauge}
              title="Credit score"
              body={`${streetSafe ? '•••' : customer.creditScore} · ${band.label}`}
              onClick={() => dispatch({ type: 'overlay', overlay: 'credit' })}
            />
          </ul>
        </section>

        <section aria-labelledby="more-accts-h" className="flex flex-col gap-3">
          <SectionHeader id="more-accts-h" title="Also yours" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <LinkRow
              icon={Globe}
              title="Global wallets"
              body={foreign.length ? foreign.map((w) => w.code).join(' · ') : 'Hold and spend in 40+ currencies'}
              onClick={() => dispatch({ type: 'overlay', overlay: 'global' })}
            />
            <LinkRow
              icon={TrendingUp}
              title="Investing"
              body="Your TD investing account"
              onClick={() => dispatch({ type: 'overlay', overlay: 'invest' })}
            />
            <LinkRow
              icon={Users}
              title="TD Family"
              body="Accounts you manage for your kids"
              onClick={() => dispatch({ type: 'overlay', overlay: 'family' })}
            />
            <LinkRow
              icon={Repeat}
              title="Subscriptions"
              body="See and manage recurring charges"
              onClick={() => dispatch({ type: 'overlay', overlay: 'subscriptions' })}
            />
          </ul>
        </section>

        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'explore' })}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 text-sm font-semibold text-primary"
        >
          <PlusCircle className="size-5" aria-hidden />
          Open a new account
        </button>
      </div>
    </div>
  )
}
