'use client'

import { useState } from 'react'
import {
  BadgeCheck,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  Phone,
  Repeat,
  ShieldAlert,
  Snowflake,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { enrich, isDisputable } from '@/lib/enrichment'
import { accountOf, useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { Pill } from '../primitives'
import { MerchantLogo } from './merchant-logo'
import { DisputeSheet } from './dispute-sheet'
import { ManageSubscriptionSheet } from './manage-subscription-sheet'
import { TediIcon } from '../tedi-icon'

export function TransactionDetail() {
  const { txnId, transactions, accounts, disputes, subs, cardFrozen, dispatch, notify } = useBank()
  const [sheet, setSheet] = useState<null | 'dispute' | 'manage'>(null)
  const txn = transactions.find((t) => t.id === txnId)
  if (!txn) return null
  const account = accounts.find((a) => a.id === accountOf(txn))

  const e = enrich(txn)
  const dispute = disputes[txn.id]
  const sub = e.subscription
  const subState = sub ? subs[sub.id] : undefined
  const amount = Math.abs(txn.amount)
  const maxHist = Math.max(...e.history.map((h) => h.amount), 1)
  const total6 = e.history.reduce((s, h) => s + h.amount, 0)
  const close = () => dispatch({ type: 'openTxn', id: null })

  return (
    <div className="absolute inset-0 z-40">
      <OverlayFrame title="Transaction" onBack={close}>
        <div className="flex flex-col gap-4 px-4">
          <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-4 pb-5 pt-6 text-center">
            <MerchantLogo enrichment={e} size="lg" />
            <div>
              <h2 className="text-lg font-semibold">{e.name}</h2>
              <p className="text-sm text-muted-foreground">{e.time}</p>
            </div>
            <p className={cn('tabular font-mono text-4xl font-semibold tracking-tight', txn.amount > 0 && 'text-primary')}>
              {formatMoney(txn.amount, 'USD', { signed: true })}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {e.pending && <Pill className="bg-muted text-muted-foreground">Pending</Pill>}
              {!e.pending && <Pill className="bg-accent text-accent-foreground">Posted</Pill>}
              {sub && subState && (
                <Pill className={cn(subState.status === 'canceled' ? 'bg-muted text-muted-foreground' : 'bg-lime text-lime-foreground')}>
                  <Repeat className="size-3" aria-hidden />
                  {subState.status === 'active' ? sub.cadence : subState.status === 'paused' ? 'Paused' : 'Canceled'}
                </Pill>
              )}
              {dispute && (
                <Pill className="bg-destructive/10 text-destructive">
                  <Flag className="size-3" aria-hidden />
                  Disputed
                </Pill>
              )}
            </div>
          </section>

          {dispute && (
            <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-medium">Dispute in review · {dispute.caseId}</p>
                <p className="text-muted-foreground">
                  {formatMoney(dispute.amount)} credited for now. Reason: {dispute.reason.toLowerCase()}.
                </p>
              </div>
            </div>
          )}

          {sub && subState && (
            <section aria-labelledby="sub-h" className="rounded-3xl bg-forest p-4 text-forest-foreground">
              <div className="flex items-center justify-between">
                <h3 id="sub-h" className="flex items-center gap-2 font-semibold">
                  <Repeat className="size-4 text-lime" aria-hidden />
                  Subscription
                </h3>
                <span className="text-xs opacity-70">Since {sub.since}</span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs opacity-70">Plan</dt>
                  <dd className="font-medium">{sub.plan}</dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">Next charge</dt>
                  <dd className="font-medium">{subState.status === 'active' ? sub.nextDate : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">Per year</dt>
                  <dd className="tabular font-mono font-medium">{formatMoney(amount * 12)}</dd>
                </div>
              </dl>
              {sub.insight && subState.status === 'active' && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
                  {sub.insight.text}
                </p>
              )}
              <p className="mt-3 text-xs opacity-70">Billed to {subState.card}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSheet('manage')}
                  disabled={subState.status === 'canceled'}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-shield font-semibold text-shield-foreground disabled:opacity-50"
                >
                  {subState.status === 'canceled' ? 'Canceled' : 'Cancel, pause or switch'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close()
                    dispatch({ type: 'overlay', overlay: 'subscriptions' })
                  }}
                  className="flex h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-medium"
                >
                  All subs
                </button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-3 gap-2">
            <ActionTile
              icon={Flag}
              label={dispute ? 'Disputed' : 'Dispute'}
              disabled={!isDisputable(txn) || !!dispute}
              onClick={() => setSheet('dispute')}
            />
            <ActionTile
              icon={TediIcon}
              label="Ask Tedi"
              onClick={() => {
                close()
                dispatch({ type: 'navigate', tab: 'sage' })
              }}
            />
            <ActionTile
              icon={Snowflake}
              label={cardFrozen ? 'Unfreeze card' : 'Freeze card'}
              onClick={() => {
                dispatch({ type: 'freeze', frozen: !cardFrozen })
                notify(cardFrozen ? 'Card unfrozen' : 'Card frozen')
              }}
            />
          </div>

          <section aria-labelledby="statement-h" className="rounded-3xl bg-card p-4">
            <h3 id="statement-h" className="text-sm font-semibold">
              How we cleaned this up
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Raw bank descriptor</p>
                <p className="mt-0.5 break-all font-mono text-xs">{e.descriptor}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border p-3">
                <MerchantLogo enrichment={e} size="sm" className="size-8 rounded-lg p-1" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.legalName}</p>
                </div>
                <BadgeCheck className="size-5 shrink-0 text-primary" aria-label="Verified merchant" />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              <Detail label="Category" value={e.primary} />
              <Detail label="Subcategory" value={e.detailed} />
              <Detail label="Payment" value={e.channel} />
              <Detail label="Match confidence" value={e.confidence} />
              {e.mcc && <Detail label="Merchant code" value={e.mcc} className="col-span-2" />}
              <div className="col-span-2 flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-muted-foreground">Paid with</span>
                {account ? (
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      dispatch({ type: 'openAccount', id: account.id })
                    }}
                    className="min-h-11 font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {account.name} ••{account.mask}
                  </button>
                ) : (
                  <span className="font-medium">{e.card}</span>
                )}
              </div>
            </dl>
          </section>

          {(e.location || e.domain || e.phone) && (
            <section aria-labelledby="merchant-h" className="overflow-hidden rounded-3xl bg-card">
              <h3 id="merchant-h" className="px-4 pt-4 text-sm font-semibold">
                Merchant
              </h3>
              <ul className="mt-2 divide-y">
                {e.location && (
                  <li>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${e.name} ${e.location.address} ${e.location.city}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-14 items-center gap-3 px-4 py-3"
                    >
                      <MapPin className="size-5 text-muted-foreground" aria-hidden />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{e.location.address}</span>
                        <span className="block text-xs text-muted-foreground">
                          {e.location.city}
                          {e.location.hours ? ` · ${e.location.hours}` : ''}
                        </span>
                      </span>
                      <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
                    </a>
                  </li>
                )}
                {e.domain && (
                  <li>
                    <a
                      href={`https://${e.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-14 items-center gap-3 px-4 py-3"
                    >
                      <Globe className="size-5 text-muted-foreground" aria-hidden />
                      <span className="flex-1 text-sm font-medium">{e.domain}</span>
                      <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
                    </a>
                  </li>
                )}
                {e.phone && (
                  <li>
                    <a href={`tel:${e.phone.replace(/\D/g, '')}`} className="flex min-h-14 items-center gap-3 px-4 py-3">
                      <Phone className="size-5 text-muted-foreground" aria-hidden />
                      <span className="flex-1 text-sm font-medium">{e.phone}</span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          <section aria-labelledby="history-h" className="rounded-3xl bg-card p-4">
            <div className="flex items-baseline justify-between">
              <h3 id="history-h" className="text-sm font-semibold">
                You &amp; {e.name}
              </h3>
              <span className="text-xs text-muted-foreground">Last 6 months</span>
            </div>
            <div className="mt-4 flex h-24 items-end gap-2" role="img" aria-label={`Spend over 6 months totals ${formatMoney(total6)}`}>
              {e.history.map((h, i) => (
                <div key={h.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={cn('w-full rounded-md', i === e.history.length - 1 ? 'bg-primary' : 'bg-primary/20')}
                    style={{ height: `${Math.max((h.amount / maxHist) * 72, h.amount > 0 ? 6 : 2)}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{h.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">6-month total</p>
                <p className="tabular font-mono font-semibold">{formatMoney(total6)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">This month</p>
                <p className="font-semibold">
                  {e.visits} {e.visits === 1 ? 'charge' : 'charges'}
                </p>
              </div>
            </div>
            {e.insight && (
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {e.insight}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={() => notify('Thanks. We will review this merchant info.')}
            className="mb-4 min-h-11 text-sm font-medium text-muted-foreground"
          >
            Something look wrong? Report merchant info
          </button>
        </div>
      </OverlayFrame>

      {sheet === 'dispute' && (
        <DisputeSheet
          txn={txn}
          enrichment={e}
          onClose={() => setSheet(null)}
          onManageSub={sub && subState?.status !== 'canceled' ? () => setSheet('manage') : undefined}
        />
      )}
      {sheet === 'manage' && sub && <ManageSubscriptionSheet enrichment={e} amount={amount} onClose={() => setSheet(null)} />}
    </div>
  )
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Flag
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-card text-sm font-medium disabled:opacity-40"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-muted">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      {label}
    </button>
  )
}
