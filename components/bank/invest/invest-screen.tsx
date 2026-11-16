'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Crown,
  Landmark,
  Layers,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  Zap,
} from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import {
  CHECKING_CUSHION,
  cdChoices,
  cdMaturity,
  securities,
  securityBySymbol,
  styleCopy,
  type CdChoice,
  type Security,
} from '@/lib/invest-data'
import { cn } from '@/lib/utils'
import { OverlayFrame } from '../overlay'
import { SectionHeader } from '../primitives'
import { OpenInvestSheet } from './open-invest-sheet'
import { RiskDots, TradeSheet } from './trade-sheet'
import { useInvestPicture } from './use-invest'

const whole = (n: number) => formatMoney(n).replace(/\.\d\d$/, '')

type Pending = { kind: 'trade'; sec: Security } | { kind: 'cd'; choice: CdChoice } | { kind: 'sweep' } | null

export function InvestScreen() {
  const pic = useInvestPicture()
  const { invest, dispatch, notify, streetSafe } = pic
  const [trade, setTrade] = useState<Security | null>(null)
  const [opening, setOpening] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const mask = (s: string) => (streetSafe ? '••••' : s)

  const requireOpen = (next: Exclude<Pending, null>) => {
    if (invest.opened) return run(next)
    setPending(next)
    setOpening(true)
  }

  const run = (next: Exclude<Pending, null>) => {
    if (next.kind === 'trade') setTrade(next.sec)
    if (next.kind === 'cd') {
      dispatch({ type: 'investPatch', patch: { cdChoice: next.choice } })
      notify(`Done. When your CD ends in ${cdMaturity.daysLeft} days, we’ll ${next.choice === 'treasury' ? 'move it into safe government bonds' : 'split it 50/50'}.`)
    }
    if (next.kind === 'sweep') {
      dispatch({ type: 'investPatch', patch: { sweep: true } })
      notify('Smart Sweep is on. Your extra cash will earn more each night.')
    }
  }

  const picks = (invest.profile ? styleCopy[invest.profile.style].picks : styleCopy.balanced.picks).map((s) => securityBySymbol[s])

  return (
    <OverlayFrame title="Investing" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-4 pb-10">
        {!invest.opened && <WhyTd onOpen={() => setOpening(true)} />}

        {invest.opened && <WholePicture mask={mask} />}

        {pic.cd > 0 && (
          <CdCard
            mask={mask}
            onChoose={(choice) => {
              if (choice === 'renew') {
                dispatch({ type: 'investPatch', patch: { cdChoice: 'renew' } })
                notify(`Got it. We’ll renew your CD at ${cdMaturity.renewRate.toFixed(2)}% interest.`)
              } else requireOpen({ kind: 'cd', choice })
            }}
          />
        )}

        <MoneyMap mask={mask} />

        <WealthTools mask={mask} onSweep={() => requireOpen({ kind: 'sweep' })} />

        {invest.opened && (
        <section aria-labelledby="picks-h" className="flex flex-col gap-3">
          <SectionHeader
            id="picks-h"
            title={invest.profile ? `Picked for a ${styleCopy[invest.profile.style].label} investor` : 'Popular first picks'}
          />
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {picks.map((s) => (
              <li key={s.symbol} className="w-60 shrink-0">
                <button
                  type="button"
                  onClick={() => requireOpen({ kind: 'trade', sec: s })}
                  className="flex h-full w-full flex-col gap-2 rounded-3xl bg-card p-4 text-left"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold">{s.symbol}</span>
                    <RiskDots level={s.risk} />
                  </span>
                  <span className="text-sm font-semibold leading-snug">{s.name}</span>
                  <span className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{s.plain}</span>
                  <span className="mt-auto flex items-center gap-1 pt-1 text-sm font-semibold text-primary">
                    Invest from $1 <ArrowRight className="size-4" aria-hidden />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        )}

        {pic.positions.length > 0 && <Holdings mask={mask} onPick={setTrade} />}

        {invest.opened && (
        <section aria-labelledby="all-h" className="flex flex-col gap-3">
          <SectionHeader id="all-h" title="Explore" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {securities.map((s) => (
              <li key={s.symbol}>
                <button
                  type="button"
                  onClick={() => requireOpen({ kind: 'trade', sec: s })}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-[11px] font-bold">
                    {s.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {s.kind} <RiskDots level={s.risk} />
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="tabular block font-mono text-sm font-semibold">{formatMoney(s.price)}</span>
                    <span className={cn('block text-xs font-medium', s.dayChange >= 0 ? 'text-primary' : 'text-destructive')}>
                      {s.dayChange >= 0 ? '+' : ''}
                      {s.dayChange}%
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        )}

        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          Investments are not FDIC insured, not bank guaranteed and may lose value. Brokerage services by TD Securities (USA) LLC, member SIPC.
        </p>
      </div>

      {opening && (
        <OpenInvestSheet
          onClose={() => {
            setOpening(false)
            setPending(null)
          }}
          onOpened={(profile) => {
            dispatch({ type: 'investOpen', profile })
            setOpening(false)
            if (pending) run(pending)
            else notify('Your investing account is open. Pick your first move.')
            setPending(null)
          }}
        />
      )}
      {trade && <TradeSheet sec={trade} onClose={() => setTrade(null)} />}
    </OverlayFrame>
  )
}

function WholePicture({ mask }: { mask: (s: string) => string }) {
  const { cash, bondValue, stockValue, investedValue, investedCost } = useInvestPicture()
  const total = cash + investedValue
  const parts = [
    { label: 'Cash & CDs', value: cash, cls: 'bg-lime' },
    { label: 'Bonds', value: bondValue, cls: 'bg-sky-400' },
    { label: 'Stocks', value: stockValue, cls: 'bg-white' },
  ]
  const rawGain = investedValue - investedCost
  const gain = Math.abs(rawGain) < 0.005 ? 0 : rawGain
  const cashPct = Math.round((cash / total) * 100)

  return (
    <section aria-labelledby="picture-h" className="rounded-3xl bg-forest p-5 text-forest-foreground">
      <p id="picture-h" className="text-sm text-forest-foreground/70">
        Invested
      </p>
      <p className="tabular font-mono text-3xl font-semibold">{mask(formatMoney(investedValue))}</p>
      <p className={cn('mt-1 text-sm', gain >= 0 ? 'text-lime' : 'text-red-300')}>
        {investedValue > 0 ? `${gain >= 0 ? 'Up' : 'Down'} ${mask(formatMoney(Math.abs(gain)))} all time` : 'Nothing invested yet. That’s fine, everyone starts here.'}
      </p>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-forest-foreground/70">Your whole TD picture · {mask(whole(total))}</p>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/10" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(', ')}>
          {parts.map((p) => (p.value > 0 ? <span key={p.label} className={p.cls} style={{ width: `${(p.value / total) * 100}%` }} /> : null))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {parts.map((p) => (
            <li key={p.label} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', p.cls)} aria-hidden />
              {p.label} {Math.round((p.value / total) * 100)}%
            </li>
          ))}
        </ul>
        {cashPct >= 80 && (
          <p className="mt-3 text-sm leading-relaxed text-forest-foreground/80">
            {cashPct}% of your money is in cash. Great for safety, but for goals 5+ years out, inflation quietly eats it.
          </p>
        )}
      </div>
    </section>
  )
}

function WhyTd({ onOpen }: { onOpen: () => void }) {
  const { readyToInvest } = useInvestPicture()
  const points = [
    { icon: Wallet, title: 'Starts with money you already have', body: `We found about ${whole(readyToInvest)} beyond your cushion and safety net.` },
    { icon: Zap, title: 'Instant from checking', body: 'No linking, no 3-day transfers. Tap buy and it’s done.' },
    { icon: ShieldCheck, title: 'Guardrails, not hype', body: 'We protect your cushion and explain every pick in plain English.' },
  ]
  return (
    <section aria-labelledby="why-h" className="flex flex-col gap-4 rounded-3xl bg-card p-5">
      <h2 id="why-h" className="text-balance text-lg font-semibold leading-snug">
        Investing that starts from your savings, not from scratch
      </h2>
      <ul className="flex flex-col gap-3">
        {points.map((p) => (
          <li key={p.title} className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
              <p.icon className="size-5" aria-hidden />
            </span>
            <span className="text-sm">
              <span className="block font-semibold">{p.title}</span>
              <span className="block leading-relaxed text-muted-foreground">{p.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onOpen} className="h-12 rounded-xl bg-shield font-semibold text-shield-foreground">
        Open in 60 seconds
      </button>
      <p className="text-center text-xs text-muted-foreground">$0 commissions · No minimum · Fractional shares from $1</p>
    </section>
  )
}

function CdCard({ mask, onChoose }: { mask: (s: string) => string; onChoose: (c: CdChoice) => void }) {
  const { cd, invest } = useInvestPicture()
  const chosen = cdChoices.find((c) => c.id === invest.cdChoice)
  return (
    <section aria-labelledby="cd-h" className="flex flex-col gap-3 rounded-3xl border-2 border-primary/30 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
          <CalendarClock className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="cd-h" className="font-semibold">
            Your CD ends in {cdMaturity.daysLeft} days
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {mask(formatMoney(cd))} at {cdMaturity.rate.toFixed(2)}% interest. Decide now so it never sits idle.
          </p>
        </div>
      </div>
      {chosen ? (
        <p className="flex items-center gap-2 rounded-2xl bg-accent p-3 text-sm font-medium text-accent-foreground">
          <Check className="size-4 shrink-0" aria-hidden /> Plan set: {chosen.title.toLowerCase()} ({chosen.rate})
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cdChoices.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onChoose(c.id)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">{c.detail}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-primary">{c.rate}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function MoneyMap({ mask }: { mask: (s: string) => string }) {
  const { checking, emergency, emergencyGap, readyToInvest } = useInvestPicture()
  const buckets = [
    {
      icon: Wallet,
      title: 'Keep in checking',
      value: Math.min(checking, CHECKING_CUSHION),
      body: 'About two months of your spending. We never invest this.',
      tone: 'bg-secondary',
    },
    {
      icon: ShieldCheck,
      title: emergencyGap > 0 ? 'Finish your safety net' : 'Safety net: done',
      value: emergencyGap > 0 ? emergencyGap : (emergency?.balance ?? 0),
      body: emergencyGap > 0 ? `Left to reach your ${whole(emergency?.goal ?? 0)} Rainy day goal. Do this first.` : 'Your Rainy day fund is fully funded.',
      tone: 'bg-accent',
    },
    {
      icon: Sparkles,
      title: 'Ready to grow',
      value: readyToInvest,
      body: 'Sitting in checking and savings with nothing to do. This is what we’d invest.',
      tone: 'bg-lime text-lime-foreground',
    },
  ]
  return (
    <section aria-labelledby="map-h" className="flex flex-col gap-3">
      <SectionHeader id="map-h" title="Your money map" />
      <p className="-mt-1 px-1 text-sm leading-relaxed text-muted-foreground">
        Built from your real balances. Investing comes last, after the essentials.
      </p>
      <ol className="flex flex-col gap-2">
        {buckets.map((b, i) => (
          <li key={b.title} className={cn('flex items-center gap-3 rounded-2xl p-4', b.tone)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card font-mono text-sm font-bold text-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{b.title}</span>
              <span className="block text-xs leading-relaxed opacity-80">{b.body}</span>
            </span>
            <span className="tabular shrink-0 font-mono text-sm font-semibold">{mask(whole(b.value))}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function WealthTools({ mask, onSweep }: { mask: (s: string) => string; onSweep: () => void }) {
  const { readyToInvest, spareChecking, savings, positions, invest, owned, dispatch, notify } = useInvestPicture()
  const sweepGain = spareChecking * 0.05 + savings * (0.05 - 0.046)
  const losses = positions.filter((p) => p.gain < 0).reduce((s, p) => s + Math.abs(p.gain), 0)
  const isComplete = owned.includes('complete')

  const tools = [
    {
      icon: Layers,
      title: invest.sweep ? 'Smart Sweep is on' : 'Put idle cash to work',
      body: invest.sweep
        ? `Cash above your cushion earns more every night. About ${whole(sweepGain)} more a year.`
        : `${mask(whole(readyToInvest))} is sitting idle. It could earn about ${whole(sweepGain)} more a year, and you can still spend it.`,
      cta: invest.sweep ? 'Turn off' : 'Turn on',
      onClick: invest.sweep
        ? () => {
            dispatch({ type: 'investPatch', patch: { sweep: false } })
            notify('Smart Sweep is off')
          }
        : onSweep,
    },
    {
      icon: Receipt,
      title: 'Tax-smart investing',
      body:
        losses > 0
          ? `We found ${formatMoney(losses)} in losses that could lower your taxes. We’ll swap you into a similar fund so you stay invested.`
          : 'We look every day for ways to lower your taxes. Nothing to act on right now.',
      cta: losses > 0 ? 'Harvest' : undefined,
      onClick: () => notify(`Harvested ${formatMoney(losses)} in losses. We’ll note it on your 1099.`),
    },
    {
      icon: isComplete ? Crown : Landmark,
      title: isComplete ? 'Complete perks are on' : 'Your perks',
      body: isComplete
        ? 'Your deposits unlock +0.50% extra interest, free wires and a yearly planning session.'
        : 'Keep $25,000 across banking and investing to get TD Complete perks: extra interest, free wires and a personal banker.',
      cta: isComplete ? undefined : 'See Complete',
      onClick: () => dispatch({ type: 'overlay', overlay: 'explore' }),
    },
    {
      icon: UserRound,
      title: 'Talk to a TD Wealth advisor',
      body: 'Retirement, stock pay, an inheritance: get one plan for your banking and investing.',
      cta: 'Book',
      onClick: () => dispatch({ type: 'navigate', tab: 'branches' }),
    },
  ]

  return (
    <section aria-labelledby="wealth-h" className="flex flex-col gap-3">
      <SectionHeader id="wealth-h" title="Working harder for you" />
      <ul className="flex flex-col gap-2">
        {tools.map((t) => (
          <li key={t.title} className="flex gap-3 rounded-2xl bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
              <t.icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t.title}</span>
              <span className="block text-xs leading-relaxed text-muted-foreground">{t.body}</span>
              {t.cta && (
                <button type="button" onClick={t.onClick} className="mt-2 min-h-11 rounded-xl bg-shield-50 px-4 text-sm font-semibold text-shield-700">
                  {t.cta}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Holdings({ mask, onPick }: { mask: (s: string) => string; onPick: (s: Security) => void }) {
  const { positions } = useInvestPicture()
  return (
    <section aria-labelledby="hold-h" className="flex flex-col gap-3">
      <SectionHeader id="hold-h" title="You own" />
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {positions.map((p) => (
          <li key={p.symbol}>
            <button type="button" onClick={() => onPick(p.sec)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime font-mono text-[11px] font-bold text-lime-foreground">
                {p.symbol}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.sec.name}</span>
                <span className="block text-xs text-muted-foreground">{p.shares.toFixed(4)} shares</span>
              </span>
              <span className="text-right">
                <span className="tabular block font-mono text-sm font-semibold">{mask(formatMoney(p.value))}</span>
                <span className={cn('block text-xs font-medium', p.gain >= 0 ? 'text-primary' : 'text-destructive')}>
                  {p.gain >= 0 ? '+' : '−'}
                  {mask(formatMoney(Math.abs(p.gain)))}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
