'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useTrust, type SecurityTab } from '../trust-provider'
import { OverlayFrame } from '../overlay'
import type { StoryArtName } from '../onboarding/story-art'
import { InternalTxnIcon } from '../transactions/internal-txn-icon'
import { PreventPanel } from '../security/prevent-panel'
import { DetectPanel } from '../security/detect-panel'
import { ResolvePanel } from '../security/resolve-panel'
import { DataPanel } from '../security/data-panel'

const checklistArt: Record<string, StoryArtName> = {
  device: 'devices',
  passkey: 'security',
  alerts: 'info',
  stale: 'mobile-wallet',
  trusted: 'partnership',
  contact: 'checklist',
  idguard: 'protection',
}

const tabs: { id: SecurityTab; label: string }[] = [
  { id: 'prevent', label: 'Prevent' },
  { id: 'detect', label: 'Detect' },
  { id: 'resolve', label: 'Resolve' },
  { id: 'data', label: 'My data' },
]

export function ScoreRing({ score, size = 96, light }: { score: number; size?: number; light?: boolean }) {
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className={light ? 'stroke-muted' : 'stroke-white/15'} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className={cn(light ? 'stroke-primary' : 'stroke-lime', 'transition-[stroke-dashoffset] duration-700')}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="tabular font-mono text-[26px] font-semibold">{score}</span>
        <span className="mt-1 text-xs uppercase tracking-wider opacity-70">of 100</span>
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
        <section aria-labelledby="score-h" className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} light />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{scoreLabel(score)}</p>
              <h2 id="score-h" className="mt-1 text-balance font-heading text-2xl font-bold leading-tight">
                {todo.length === 0
                  ? 'You\u2019re Legendary. Seriously.'
                  : todo.length === 1
                    ? 'One step from Legendary'
                    : `${todo.length} quick steps to Legendary`}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Last sign-in {lastLogin.when} · {lastLogin.device}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2">
            {[
              { k: 'Card', v: cardFrozen ? 'Locked' : 'On', tint: 'bg-[#c6f26b] text-[#0b2617]' },
              { k: 'Alerts', v: `${Object.values(alerts).filter(Boolean).length}/6`, tint: 'bg-[#9fd2dc] text-[#0b2e33]' },
              { k: 'Devices', v: String(devices.length), tint: 'bg-[#e1e5dd] text-[#1a1d1a]' },
            ].map((t) => (
              <div key={t.k} className={cn('rounded-2xl px-3 py-3', t.tint)}>
                <dt className="text-xs font-medium opacity-75">{t.k}</dt>
                <dd className="font-heading text-xl font-bold leading-tight">{t.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="todo-h" className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 id="todo-h" className="font-heading text-2xl font-bold">
              Your checklist
            </h2>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="flex h-9 items-center gap-0.5 text-sm font-semibold text-primary"
            >
              {showAll ? 'To-dos' : 'See all'}
              <ChevronDown className={cn('size-4 transition-transform', showAll && 'rotate-180')} aria-hidden />
            </button>
          </div>
          <ul className="flex flex-col gap-3">
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
                  className="flex min-h-20 w-full items-center gap-4 rounded-3xl bg-card p-4 text-left shadow-card disabled:opacity-60"
                >
                  <InternalTxnIcon art={checklistArt[item.id] ?? 'security'} zoom className="size-14 rounded-2xl" />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-base font-semibold leading-tight', item.done && 'line-through')}>{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{item.why}</span>
                  </span>
                  {item.done ? (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" aria-hidden />
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      +{item.points}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="rounded-3xl bg-card px-4 py-5 text-center text-sm text-muted-foreground shadow-card">
                Every step is done. You&apos;re officially Legendary.
              </li>
            )}
          </ul>
        </section>

        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Security sections"
          className="no-scrollbar sticky top-[60px] z-10 -mx-4 flex gap-2 overflow-x-auto bg-background px-4 py-2"
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
                'h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition-colors',
                securityTab === t.id ? 'bg-forest text-forest-foreground' : 'bg-card text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`sec-panel-${securityTab}`}
          aria-labelledby={`sec-tab-${securityTab}`}
          className="[&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-normal"
        >
          {securityTab === 'prevent' && <PreventPanel />}
          {securityTab === 'detect' && <DetectPanel />}
          {securityTab === 'resolve' && <ResolvePanel />}
          {securityTab === 'data' && <DataPanel />}
        </div>
      </div>
    </OverlayFrame>
  )
}
