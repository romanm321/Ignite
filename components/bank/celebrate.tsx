'use client'

import { useEffect, useState } from 'react'
import { Crown, PartyPopper, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptic, playApplause, playCelebrationChime } from '@/lib/feedback'
import { ClappingHandsIcon } from './clapping-hands-icon'
import { useBank } from './bank-provider'

const colors = ['var(--lime)', 'var(--primary)', '#ffd54a', '#ffffff', 'var(--accent)']

type Piece = { left: number; delay: number; duration: number; size: number; color: string; drift: number; round: boolean }

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    size: 6 + Math.random() * 6,
    color: colors[i % colors.length],
    drift: (Math.random() - 0.5) * 120,
    round: i % 3 === 0,
  }))
}

export function Confetti({ count = 60, className }: { count?: number; className?: string }) {
  const { a11y } = useBank()
  const [pieces] = useState(() => makePieces(count))
  if (a11y.reduceMotion) return null

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 z-[60] overflow-hidden', className)}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute -top-4"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              background: p.color,
              borderRadius: p.round ? '9999px' : '2px',
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

const icons = { legendary: Crown, product: PartyPopper, win: Sparkles, clap: ClappingHandsIcon }

/** Counts a number up from zero with an ease-out curve. */
function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = useState(enabled ? 0 : target)
  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, enabled])
  return value
}

export function CelebrationOverlay() {
  const { celebration, a11y, dispatch } = useBank()
  const title = celebration?.title
  const kind = celebration?.kind
  const amount = useCountUp(celebration?.amount ?? 0, Boolean(celebration?.amount) && !a11y.reduceMotion)

  // A buzz and a chime to go with the visuals. The buzz is skipped when the customer prefers calmer motion.
  useEffect(() => {
    if (!title) return
    if (!a11y.reduceMotion) haptic([30, 50, 30, 50, 90])
    if (kind === 'clap') playApplause()
    else playCelebrationChime()
  }, [title, kind, a11y.reduceMotion])

  if (!celebration) return null
  const Icon = icons[celebration.kind]
  const close = () => dispatch({ type: 'celebrate', celebration: null })

  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center p-6">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-black/75 animate-in fade-in" />
      <Confetti key={celebration.title} count={90} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="celebrate-title"
        aria-describedby="celebrate-body"
        className="relative flex w-full flex-col items-center gap-4 rounded-[24px] bg-black px-6 pb-6 pt-9 text-center text-white shadow-2xl ring-1 ring-white/15 animate-in zoom-in-90 fade-in duration-300"
      >
        <span className="relative flex size-20 items-center justify-center">
          {!a11y.reduceMotion && (
            <>
              <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-lime/40 [animation-duration:1.6s]" />
              <span aria-hidden className="absolute -inset-3 animate-ping rounded-full bg-lime/20 [animation-delay:0.3s] [animation-duration:2s]" />
            </>
          )}
          <span className="relative flex size-20 items-center justify-center rounded-full bg-lime text-lime-foreground shadow-[0_0_48px_rgb(56_182_48/0.6)] animate-in zoom-in-50 duration-500">
            <Icon className="size-10" aria-hidden />
          </span>
        </span>
        {celebration.kind === 'legendary' && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime">Security status</p>}
        <h2 id="celebrate-title" className="text-balance font-heading text-[34px] font-bold leading-none">
          {celebration.title}
        </h2>
        {celebration.amount != null && (
          <p className="flex flex-col items-center" aria-label={`$${celebration.amount} welcome bonus`}>
            <span aria-hidden className="tabular font-heading text-6xl font-bold leading-none text-lime [text-shadow:0_0_40px_rgb(56_182_48/0.5)]">
              ${amount}
            </span>
            <span className="mt-1 text-sm font-medium text-white/70">welcome bonus</span>
          </p>
        )}
        <p id="celebrate-body" className="text-pretty text-sm leading-relaxed text-white/75">
          {celebration.body}
        </p>
        <button
          type="button"
          onClick={close}
          autoFocus
          className={cn(
            'mt-2 h-14 w-full rounded-2xl font-semibold active:opacity-80',
            celebration.cta === 'onboarding' ? 'bg-white text-[#002b1a]' : 'bg-white text-black',
          )}
        >
          {celebration.kind === 'legendary' ? 'Keep being legendary' : celebration.kind === 'product' ? 'Let’s go' : celebration.kind === 'clap' ? 'Keep going' : 'Love it'}
        </button>
      </div>
    </div>
  )
}
