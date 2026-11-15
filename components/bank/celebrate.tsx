'use client'

import { useState } from 'react'
import { Crown, PartyPopper, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
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

const icons = { legendary: Crown, product: PartyPopper, win: Sparkles }

export function CelebrationOverlay() {
  const { celebration, dispatch } = useBank()
  if (!celebration) return null
  const Icon = icons[celebration.kind]
  const close = () => dispatch({ type: 'celebrate', celebration: null })

  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center p-6">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-forest/70 animate-in fade-in" />
      <Confetti key={celebration.title} count={80} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="celebrate-title"
        aria-describedby="celebrate-body"
        className="relative flex w-full flex-col items-center gap-4 rounded-[16px] bg-forest px-6 pb-6 pt-8 text-center text-forest-foreground shadow-2xl animate-in zoom-in-90 fade-in"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-lime text-lime-foreground">
          <Icon className="size-8" aria-hidden />
        </span>
        {celebration.kind === 'legendary' && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime">Security status</p>
        )}
        <h2 id="celebrate-title" className="text-balance text-[34px] font-semibold leading-none tracking-tight">
          {celebration.title}
        </h2>
        <p id="celebrate-body" className="text-pretty text-sm leading-relaxed text-forest-foreground/80">
          {celebration.body}
        </p>
        <button
          type="button"
          onClick={close}
          autoFocus
          className="mt-2 h-12 w-full rounded-xl bg-shield font-semibold text-shield-foreground"
        >
          {celebration.kind === 'legendary' ? 'Keep being legendary' : 'Love it'}
        </button>
      </div>
    </div>
  )
}
