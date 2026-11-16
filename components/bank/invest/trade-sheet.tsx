'use client'

import { useState } from 'react'
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react'
import { accountDetails, formatMoney } from '@/lib/bank-data'
import { CHECKING_CUSHION, riskLabels, type Security } from '@/lib/invest-data'
import { cn } from '@/lib/utils'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'
import { useInvestPicture } from './use-invest'

export function RiskDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`Risk ${level} of 5: ${riskLabels[level as 1]}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn('size-1.5 rounded-full', i <= level ? (level >= 4 ? 'bg-destructive' : 'bg-primary') : 'bg-muted')} />
      ))}
    </span>
  )
}

function Outcomes({ sec, dollars }: { sec: Security; dollars: number }) {
  const base = dollars > 0 ? dollars : 1000
  const rows = [
    { label: 'A rough year', pct: sec.range.bad },
    { label: 'A typical year', pct: sec.range.typical },
    { label: 'A great year', pct: sec.range.good },
  ]
  const max = Math.max(...rows.map((r) => Math.abs(r.pct)))
  return (
    <section aria-labelledby="outcomes-h" className="rounded-2xl border p-4">
      <h3 id="outcomes-h" className="text-sm font-semibold">
        What {formatMoney(base).replace('.00', '')} could become in a year
      </h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[96px_1fr_84px] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-muted">
              <span
                className={cn('block h-full rounded-full', r.pct < 0 ? 'bg-destructive' : 'bg-primary')}
                style={{ width: `${Math.max(6, (Math.abs(r.pct) / max) * 100)}%` }}
              />
            </span>
            <span className="tabular text-right font-mono font-semibold">{formatMoney(base * (1 + r.pct))}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Based on historical ranges. Not a promise, just a gut check.</p>
    </section>
  )
}

export function TradeSheet({ sec, onClose }: { sec: Security; onClose: () => void }) {
  const { accounts, invest, positions, dispatch, notify, lens } = useInvestPicture()
  const held = positions.find((p) => p.symbol === sec.symbol)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('chk')
  const funding = accounts.filter((a) => a.id === 'chk' || a.id === 'sav')
  const account = funding.find((a) => a.id === accountId) ?? funding[0]
  const dollars = Number(amount)
  const has = Number.isFinite(dollars) && dollars > 0
  const firstTrade = Object.keys(invest.holdings).length === 0

  const after = account.balance - (side === 'buy' && has ? dollars : 0)
  const dipsCushion = side === 'buy' && account.id === 'chk' && has && after < CHECKING_CUSHION
  const tooMuch = side === 'buy' ? has && dollars > account.balance : has && dollars > (held?.value ?? 0) + 0.005
  const tooSmall = has && dollars < 1
  const valid = has && !tooMuch && !tooSmall
  const savingsApy = accountDetails.sav.apy ?? 4.6
  const bigSwing = side === 'buy' && sec.risk >= 4 && has && dollars >= 1000 && lens === 'starter'

  const submit = () => {
    if (!valid) return
    dispatch({ type: 'investTrade', side, symbol: sec.symbol, dollars, accountId: account.id })
    if (side === 'buy' && firstTrade) {
      dispatch({
        type: 'celebrate',
        celebration: { kind: 'win', title: 'You’re officially an investor', body: `You own a piece of ${sec.name}. Most people never take this step. You just did.` },
      })
    } else {
      notify(side === 'buy' ? `Bought ${formatMoney(dollars)} of ${sec.symbol}` : `Sold ${formatMoney(dollars)} of ${sec.symbol}. Cash is in ${account.name}.`)
    }
    onClose()
  }

  return (
    <BottomSheet title={`${sec.symbol} · ${formatMoney(sec.price)}`} description={sec.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{sec.kind}</span>
          <span className="flex items-center gap-1.5">
            <RiskDots level={sec.risk} /> {riskLabels[sec.risk]}
          </span>
          {sec.yield && <span>{sec.yield.toFixed(2)}% yield</span>}
          <span className={sec.dayChange >= 0 ? 'text-primary' : 'text-destructive'}>
            {sec.dayChange >= 0 ? '+' : ''}
            {sec.dayChange}% today
          </span>
        </div>
        <p className="rounded-2xl bg-secondary p-3 text-sm leading-relaxed">{sec.plain}</p>

        {sec.risk <= 2 && (
          <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Compared with your Growth Savings at {savingsApy.toFixed(2)}% interest{sec.yield ? `, this pays about ${sec.yield.toFixed(2)}%` : ''}. Savings are FDIC insured; this
            isn&apos;t, but it&apos;s {sec.risk === 1 ? 'backed by the US government' : 'diversified across thousands of bonds'}.
          </p>
        )}

        {held && (
          <div role="radiogroup" aria-label="Buy or sell" className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
            {(['buy', 'sell'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={side === s}
                onClick={() => setSide(s)}
                className={cn('min-h-11 rounded-xl text-sm font-semibold capitalize', side === s ? 'bg-card shadow-sm' : 'text-muted-foreground')}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <Field
          label={side === 'buy' ? 'How much to invest (USD)' : 'How much to sell (USD)'}
          hint={
            side === 'sell' && held
              ? `You own ${formatMoney(held.value)} · ${held.shares.toFixed(4)} shares`
              : has
                ? `About ${(dollars / sec.price).toFixed(4)} shares · $0 commission`
                : 'Invest in dollars, not shares. From $1.'
          }
        >
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputClass} />
        </Field>
        {side === 'buy' && (
          <div className="flex gap-2">
            {[25, 100, 500].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(String(n))}
                className="h-11 flex-1 rounded-xl border-2 border-shield text-sm font-semibold bg-card text-shield-700"
              >
                ${n}
              </button>
            ))}
          </div>
        )}

        <Field label={side === 'buy' ? 'Pay from' : 'Send cash to'}>
          <select value={account.id} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            {funding.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {formatMoney(a.balance)}
              </option>
            ))}
          </select>
        </Field>

        {side === 'buy' && <Outcomes sec={sec} dollars={has ? dollars : 0} />}

        {dipsCushion && !tooMuch && (
          <p role="alert" className="flex gap-2 rounded-2xl bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            This leaves {formatMoney(after)} in checking, under your {formatMoney(CHECKING_CUSHION)} cushion (about two months of spending). Try paying from Growth Savings instead.
          </p>
        )}
        {bigSwing && (
          <p className="flex gap-2 rounded-2xl bg-secondary p-3 text-sm leading-relaxed">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Single stocks can swing hard. Many first-time investors keep any one company under 10% of what they invest.
          </p>
        )}
        {tooMuch && (
          <p role="alert" className="text-sm text-destructive">
            {side === 'buy' ? `That’s more than the ${formatMoney(account.balance)} in ${account.name}.` : 'That’s more than you own.'}
          </p>
        )}
        {tooSmall && (
          <p role="alert" className="text-sm text-destructive">
            The minimum is $1.00.
          </p>
        )}

        <PrimaryButton disabled={!valid} onClick={submit}>
          {side === 'buy' ? `Buy ${valid ? formatMoney(dollars) : ''} of ${sec.symbol}` : `Sell ${valid ? formatMoney(dollars) : ''}`}
        </PrimaryButton>
        <p className="text-center text-xs text-muted-foreground">Market order · fills at the next price · cash moves instantly</p>
      </div>
    </BottomSheet>
  )
}
