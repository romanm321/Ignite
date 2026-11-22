'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { securities, securityBySymbol, styleCopy, type Security } from '@/lib/invest-data'
import { cn } from '@/lib/utils'
import { BigAmount } from '../big-amount'
import { OverlayFrame } from '../overlay'
import { OpenInvestSheet } from './open-invest-sheet'
import { TradeSheet } from './trade-sheet'
import { useInvestPicture } from './use-invest'

const whole = (n: number) => formatMoney(n).replace(/\.\d\d$/, '')

/** Friendly tile colours for the first picks, taken from the soft palette used on Products. */
const pickTints = ['bg-[#9fd2dc] text-[#0b2e33]', 'bg-[#c6f26b] text-[#0b2617]', 'bg-[#ffb9da] text-[#4a0f2c]']

type Pending = { sec: Security } | null

export function InvestScreen() {
  const pic = useInvestPicture()
  const { invest, dispatch, notify, streetSafe } = pic
  const [trade, setTrade] = useState<Security | null>(null)
  const [opening, setOpening] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [browsing, setBrowsing] = useState(false)
  const mask = (s: string) => (streetSafe ? '••••' : s)

  const picks = (invest.profile ? styleCopy[invest.profile.style].picks : styleCopy.balanced.picks).map((s) => securityBySymbol[s])

  return (
    <OverlayFrame title="Investing" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-8 px-4 pb-10">
        {!invest.opened ? (
          <Welcome onOpen={() => setOpening(true)} />
        ) : (
          <>
            <Hero mask={mask} />

            <section aria-labelledby="picks-h" className="flex flex-col gap-3">
              <h2 id="picks-h" className="px-1 font-heading text-2xl font-bold">
                Good first picks
              </h2>
              <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
                {picks.map((s, i) => (
                  <li key={s.symbol} className="w-44 shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => setTrade(s)}
                      className={cn('relative flex h-40 w-full flex-col items-start justify-between rounded-3xl p-4 text-left active:opacity-90', pickTints[i % pickTints.length])}
                    >
                      <span>
                        <span className="block font-heading text-3xl font-bold leading-none">{s.symbol}</span>
                        <span className="mt-1 block text-sm opacity-80">{s.kind}</span>
                      </span>
                      <span className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold">From $1</span>
                        <span aria-hidden className="flex size-9 items-center justify-center rounded-xl bg-black text-white">
                          <ArrowUpRight className="size-4" />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {pic.positions.length > 0 && <Holdings mask={mask} onPick={setTrade} />}

            <section aria-labelledby="all-h" className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setBrowsing((b) => !b)}
                aria-expanded={browsing}
                className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-4 text-left shadow-card"
              >
                <h2 id="all-h" className="font-heading text-lg font-bold">
                  Browse everything
                </h2>
                <ChevronDown className={cn('size-5 text-muted-foreground transition-transform', browsing && 'rotate-180')} aria-hidden />
              </button>
              {browsing && (
                <ul className="divide-y overflow-hidden rounded-3xl bg-card">
                  {securities.map((s) => (
                    <li key={s.symbol}>
                      <button type="button" onClick={() => setTrade(s)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-[11px] font-bold">{s.symbol}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{s.name}</span>
                          <span className="block text-sm text-muted-foreground">{s.kind}</span>
                        </span>
                        <span className="tabular font-mono font-semibold">{formatMoney(s.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <Advisor />

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
            if (pending) setTrade(pending.sec)
            else notify('You’re in! Pick your first investment.')
            setPending(null)
          }}
        />
      )}
      {trade && <TradeSheet sec={trade} onClose={() => setTrade(null)} />}
    </OverlayFrame>
  )
}

function Welcome({ onOpen }: { onOpen: () => void }) {
  const chips = ['$1 to start', '$0 fees', 'Cushion stays safe']
  return (
    <section aria-labelledby="welcome-h" className="flex flex-col gap-5">
      <div className="relative h-[300px] overflow-hidden rounded-3xl bg-[#dbe0d9] p-5 text-[#10261a]">
        <Image
          src="/images/products/direct-investing.png"
          alt=""
          aria-hidden
          width={1408}
          height={768}
          sizes="(max-width: 440px) 100vw, 440px"
          className="pointer-events-none absolute bottom-0 right-0 h-auto w-[135%] max-w-none"
          style={{ maskImage: 'linear-gradient(to bottom, transparent 0, #000 24%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 24%)' }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #dbe0d9 0%, #dbe0d9 36%, transparent 64%)' }} />
        <h2 id="welcome-h" className="relative max-w-[60%] text-balance font-heading text-[34px] font-bold leading-[1.02]">
          Let’s start small.
        </h2>
        <p className="relative mt-2 max-w-[55%] text-lg opacity-85">Invest from $1.</p>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {chips.map((c, i) => (
          <li key={c} className={cn('flex min-h-16 items-center justify-center rounded-2xl p-2 text-center text-sm font-semibold leading-tight', pickTints[i])}>
            {c}
          </li>
        ))}
      </ul>

      <button type="button" onClick={onOpen} className="h-14 rounded-2xl bg-primary font-semibold text-primary-foreground active:opacity-90">
        Get started
      </button>
      <p className="-mt-2 text-center text-sm text-muted-foreground">Takes about a minute.</p>
    </section>
  )
}

function Hero({ mask }: { mask: (s: string) => string }) {
  const { cash, bondValue, stockValue, investedValue, investedCost } = useInvestPicture()
  const [open, setOpen] = useState(false)
  const total = cash + investedValue
  const parts = [
    { label: 'Cash & CDs', value: cash, cls: 'bg-lime' },
    { label: 'Bonds', value: bondValue, cls: 'bg-sky-400' },
    { label: 'Stocks', value: stockValue, cls: 'bg-forest' },
  ]
  const rawGain = investedValue - investedCost
  const gain = Math.abs(rawGain) < 0.005 ? 0 : rawGain

  return (
    <section aria-labelledby="picture-h" className="rounded-3xl bg-card p-5 shadow-card">
      <h2 id="picture-h" className="text-sm font-semibold text-primary">
        You’re investing
      </h2>
      <BigAmount value={mask(formatMoney(investedValue))} className="mt-2 block text-5xl" />
      <p className={cn('mt-3 text-base', gain >= 0 ? 'text-foreground' : 'text-destructive')}>
        {investedValue > 0
          ? gain > 0
            ? `Up ${mask(formatMoney(gain))}. Nice start!`
            : gain < 0
              ? `Down ${mask(formatMoney(Math.abs(gain)))}. Hang in there.`
              : 'You’re in. Let it grow.'
          : 'Nothing yet. Everyone starts somewhere.'}
      </p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        {open ? 'Hide' : 'See'} the bigger picture <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <div
            className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(', ')}
          >
            {parts.map((p) => (p.value > 0 ? <span key={p.label} className={cn('h-full', p.cls)} style={{ width: `${(p.value / total) * 100}%` }} /> : null))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {parts.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', p.cls)} aria-hidden />
                {p.label} {Math.round((p.value / total) * 100)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Holdings({ mask, onPick }: { mask: (s: string) => string; onPick: (s: Security) => void }) {
  const { positions } = useInvestPicture()
  return (
    <section aria-labelledby="hold-h" className="flex flex-col gap-3">
      <h2 id="hold-h" className="px-1 font-heading text-2xl font-bold">
        What you own
      </h2>
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {positions.map((p) => (
          <li key={p.symbol}>
            <button type="button" onClick={() => onPick(p.sec)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime font-mono text-[11px] font-bold text-lime-foreground">{p.symbol}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.sec.name}</span>
                <span className={cn('block text-sm', p.gain >= 0 ? 'text-primary' : 'text-destructive')}>
                  {p.gain >= 0 ? '+' : '−'}
                  {mask(formatMoney(Math.abs(p.gain)))}
                </span>
              </span>
              <span className="tabular font-mono font-semibold">{mask(formatMoney(p.value))}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Advisor() {
  const { dispatch } = useInvestPicture()
  return (
    <button
      type="button"
      onClick={() => {
        dispatch({ type: 'overlay', overlay: null })
        dispatch({ type: 'navigate', tab: 'branches' })
      }}
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-card"
    >
      <span className="text-base font-medium">Want a hand? Chat with an advisor.</span>
      <ArrowUpRight className="size-5 shrink-0 text-primary" aria-hidden />
    </button>
  )
}
