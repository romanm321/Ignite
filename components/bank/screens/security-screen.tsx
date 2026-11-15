'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useTrust, type SecurityTab } from '../trust-provider'
import { OverlayFrame } from '../overlay'
import { PreventPanel } from '../security/prevent-panel'
import { DetectPanel } from '../security/detect-panel'
import { ResolvePanel } from '../security/resolve-panel'
import { DataPanel } from '../security/data-panel'

const tabs: { id: SecurityTab; label: string }[] = [
  { id: 'prevent', label: 'Prevent' },
  { id: 'detect', label: 'Detect' },
  { id: 'resolve', label: 'Resolve' },
  { id: 'data', label: 'My data' },
]

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-white/15" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className="stroke-lime transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="tabular font-mono text-[26px] font-semibold">{score}</span>
        <span className="mt-1 text-[10px] uppercase tracking-wider opacity-70">of 100</span>
      </span>
    </div>
  )
}

export function scoreLabel(score: number) {
  if (score >= 100) return 'Legendary'
  if (score >= 90) return 'Almost legendary'
  if (score >= 70) return 'Rock solid'
  if (score >= 45) return 'Getting there'
  return 'Let’s lock this down'
}

export function SecurityScreen() {
  const { dispatch: bankDispatch, cardFrozen } = useBank()
  const { score, checklist, securityTab, dispatch, logins, alerts, devices } = useTrust()
  const [showAll, setShowAll] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const todo = checklist.filter((c) => !c.done)
  const visible = showAll ? checklist : todo.slice(0, 3)
  const lastLogin = logins[0]

  return (
    <OverlayFrame
      title="Security hub"
      onBack={() => bankDispatch({ type: 'overlay', overlay: null })}
      right={
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'securityTab', tab: 'resolve' })
            bankDispatch({ type: 'navigate', tab: 'sage' })
          }}
          aria-label="Ask Tedi about security"
          className="flex size-11 items-center justify-center rounded-full"
        >
          <Search className="size-5" aria-hidden />
        </button>
      }
    >
      <div className="flex flex-col gap-5 px-4">
        <section aria-labelledby="score-h" className="rounded-3xl bg-forest p-5 text-forest-foreground">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-lime">{scoreLabel(score)}</p>
              <h2 id="score-h" className="mt-1 text-balance text-xl font-semibold leading-tight">
                {todo.length === 0
                  ? 'You\u2019re Legendary. Seriously.'
                  : todo.length === 1
                    ? 'One step from Legendary'
                    : `${todo.length} quick steps to Legendary`}
              </h2>
              <p className="mt-1 text-sm text-forest-foreground/70">
                Last sign-in {lastLogin.when} · {lastLogin.device}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { k: 'Card', v: cardFrozen ? 'Locked' : 'On' },
              { k: 'Alerts', v: `${Object.values(alerts).filter(Boolean).length}/6` },
              { k: 'Devices', v: String(devices.length) },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white/10 px-2 py-2.5">
                <dt className="text-[11px] text-forest-foreground/70">{s.k}</dt>
                <dd className="font-semibold">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="todo-h" className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 id="todo-h" className="text-[15px] font-semibold tracking-tight">
              Your security checklist
            </h2>
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              aria-expanded={showAll}
              className="flex h-9 items-center gap-0.5 text-sm font-medium text-primary"
            >
              {showAll ? 'To-dos' : 'See all'}
              <ChevronDown className={cn('size-4 transition-transform', showAll && 'rotate-180')} aria-hidden />
            </button>
          </div>
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={item.done}
                  onClick={() => {
                    dispatch({ type: 'securityTab', tab: item.tab })
                    requestAnimationFrame(() => {
                      const target = document.getElementById(`sec-target-${item.id}`)
                      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      else tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    })
                  }}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                      item.done ? 'border-primary bg-primary text-primary-foreground' : 'border-dashed border-primary/40',
                    )}
                  >
                    {item.done && <Check className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block font-medium', item.done && 'line-through')}>{item.title}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{item.why}</span>
                  </span>
                  {!item.done && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-primary">
                      +{item.points}
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
                  )}
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-4 py-5 text-center text-sm text-muted-foreground">Every step is done. You&apos;re officially Legendary.</li>
            )}
          </ul>
        </section>

        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Security sections"
          className="sticky top-[60px] z-10 grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`sec-tab-${t.id}`}
              aria-selected={securityTab === t.id}
              aria-controls={`sec-panel-${t.id}`}
              onClick={() => dispatch({ type: 'securityTab', tab: t.id })}
              className={cn(
                'h-11 rounded-xl text-sm font-medium transition-colors',
                securityTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`sec-panel-${securityTab}`} aria-labelledby={`sec-tab-${securityTab}`}>
          {securityTab === 'prevent' && <PreventPanel />}
          {securityTab === 'detect' && <DetectPanel />}
          {securityTab === 'resolve' && <ResolvePanel />}
          {securityTab === 'data' && <DataPanel />}
        </div>
      </div>
    </OverlayFrame>
  )
}
