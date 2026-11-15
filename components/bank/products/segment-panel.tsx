'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useBank } from '@/components/bank/bank-provider'
import { PerkIcon } from '@/components/bank/products/perk-icon'
import { Switch } from '@/components/bank/primitives'
import { boostCategories, segments, studentPerkChoices, type SegmentId } from '@/lib/segments'
import { formatMoney } from '@/lib/bank-data'
import { cn } from '@/lib/utils'

export function isSegmentAccount(id: string): id is SegmentId {
  return id === 'student' || id === 'complete'
}

function Progress({ label, value, max, detail }: { label: string; value: number; max: number; detail: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-xs opacity-75">{detail}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-black/10"
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StudentPanel() {
  const { productMeta } = useBank()
  const meta = productMeta.student ?? {}
  const perk = studentPerkChoices.find((p) => p.id === meta.perk) ?? studentPerkChoices[0]
  const [claimed, setClaimed] = useState(false)
  const [creditBuilder, setCreditBuilder] = useState(meta.creditBuilder !== false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-3xl bg-lime p-4 text-lime-foreground">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
            {meta.school ? `${meta.school} · ` : ''}Student perks
          </p>
          <p className="mt-1 text-lg font-semibold leading-snug">You&apos;re saving about $27 a month vs. a regular account</p>
        </div>
        <Progress label="SafetyNet buffer" value={100} max={100} detail="$100 of $100 ready" />
        <Progress label="Money Minutes earned" value={15} max={50} detail="$15 of $50 this year" />
      </div>

      <ul className="divide-y rounded-3xl border bg-card">
        <li className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <PerkIcon icon="perks" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{perk.label}</span>
            <span className="block text-xs text-muted-foreground">{perk.detail} with your Perks Pass</span>
          </span>
          <button
            type="button"
            onClick={() => setClaimed(true)}
            disabled={claimed}
            className={cn(
              'flex h-11 min-w-20 items-center justify-center gap-1 rounded-xl px-4 text-sm font-semibold',
              claimed ? 'bg-shield-50 text-shield-700' : 'bg-shield text-shield-foreground',
            )}
          >
            {claimed ? (
              <>
                <Check className="size-4" aria-hidden /> Claimed
              </>
            ) : (
              'Claim'
            )}
          </button>
        </li>
        <li className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <PerkIcon icon="credit" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Credit Builder</span>
            <span className="block text-xs text-muted-foreground">
              {creditBuilder ? 'Reporting rent & Spotify on time. Nice.' : 'Off · turn on to start building your score'}
            </span>
          </span>
          <Switch label="Credit Builder" checked={creditBuilder} onChange={setCreditBuilder} />
        </li>
        <li className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <PerkIcon icon="split" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Split with roommates</span>
            <span className="block text-xs text-muted-foreground">Maya owes you $42.50 for groceries</span>
          </span>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Nudge sent</span>
        </li>
      </ul>
    </div>
  )
}

function CompletePanel() {
  const { productMeta } = useBank()
  const meta = productMeta.complete ?? {}
  const [boost, setBoost] = useState(String(meta.boost ?? 'dining'))
  const [open, setOpen] = useState(false)
  const boostLabel = boostCategories.find((b) => b.id === boost)?.label ?? ''
  const target = Number(meta.sweepTarget ?? 10000)
  const sweeping = meta.sweep !== false

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-3xl bg-forest p-4 text-forest-foreground">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-foreground/70">Complete this month</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">$184.20 in extra value</p>
          <p className="text-sm text-forest-foreground/75">Rate boost, rewards and fees we refunded</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            { k: 'Rate boost', v: '$96.40' },
            { k: 'Rewards', v: '$71.80' },
            { k: 'Fees refunded', v: '$16.00' },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl bg-white/10 p-2.5">
              <dd className="text-sm font-semibold tabular-nums">{s.v}</dd>
              <dt className="text-[11px] text-forest-foreground/70">{s.k}</dt>
            </div>
          ))}
        </dl>
        <Progress label="Welcome bonus" value={6200} max={10000} detail="$6,200 of $10,000 new money" />
      </div>

      <ul className="divide-y rounded-3xl border bg-card">
        <li className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <PerkIcon icon="sweep" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Smart Sweep</span>
            <span className="block text-xs text-muted-foreground">
              {sweeping ? `Keeping ${formatMoney(target)} in checking. The rest earns 5.10%.` : 'Off'}
            </span>
          </span>
        </li>
        <li className="flex flex-col gap-3 p-4">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex min-h-11 items-center gap-3 text-left"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
              <PerkIcon icon="boost" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">5% boost: {boostLabel}</span>
              <span className="block text-xs text-muted-foreground">Switch once a quarter · 38 days left</span>
            </span>
            <ChevronDown className={cn('size-5 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
          {open && (
            <div role="radiogroup" aria-label="Boost category" className="flex flex-col gap-2">
              {boostCategories.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={boost === b.id}
                  onClick={() => {
                    setBoost(b.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'min-h-11 rounded-2xl border px-3 py-2 text-left text-sm',
                    boost === b.id ? 'border-primary bg-accent font-semibold' : 'bg-background',
                  )}
                >
                  {b.label}
                  <span className="block text-xs font-normal text-muted-foreground">{b.detail}</span>
                </button>
              ))}
            </div>
          )}
        </li>
        <li className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <PerkIcon icon="equity" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Equity planner</span>
            <span className="block text-xs text-muted-foreground">Next vest Dec 15 · est. $8,400 after tax</span>
          </span>
        </li>
        <li className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <PerkIcon icon="concierge" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Priya Shah, your banker</span>
            <span className="block text-xs text-muted-foreground">Usually replies in under 10 minutes</span>
          </span>
          <a
            href="sms:+18005550199"
            className="flex h-11 items-center rounded-xl bg-shield px-4 text-sm font-semibold text-shield-foreground"
          >
            Text
          </a>
        </li>
      </ul>
    </div>
  )
}

export function SegmentPanel({ id }: { id: SegmentId }) {
  return (
    <section aria-labelledby={`segment-${id}`} className="flex flex-col gap-3">
      <h2 id={`segment-${id}`} className="text-lg font-semibold">
        {id === 'student' ? 'Your student perks' : `Your ${segments.complete.label} benefits`}
      </h2>
      {id === 'student' ? <StudentPanel /> : <CompletePanel />}
    </section>
  )
}
