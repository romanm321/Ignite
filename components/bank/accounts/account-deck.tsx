'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Account } from '@/lib/bank-data'
import type { AccountTheme } from './account-theme'

const SWIPE_DISTANCE = 56

/**
 * Accounts of the same type, laid out like the cards on Home: the others sit behind with just their name and balance
 * showing, and the open account is the full card in front. Tap a card behind it, or swipe the front card, to bring another forward.
 */
export function AccountDeck({
  accounts,
  activeId,
  onSelect,
  themeOf,
  balanceLabel,
  children,
}: {
  accounts: Account[]
  activeId: string
  onSelect: (id: string) => void
  themeOf: (account: Account) => AccountTheme
  balanceLabel: (account: Account) => string
  children: ReactNode
}) {
  const index = Math.max(
    0,
    accounts.findIndex((a) => a.id === activeId),
  )
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const go = (step: number) => {
    const next = accounts[(index + step + accounts.length) % accounts.length]
    if (next) onSelect(next.id)
  }

  // Same order as Home: the open card last, the rest above it.
  const behind = accounts.filter((a) => a.id !== activeId)

  const finish = () => {
    if (dx <= -SWIPE_DISTANCE) go(1)
    else if (dx >= SWIPE_DISTANCE) go(-1)
    setDx(0)
    setDragging(false)
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${accounts.length} accounts. Showing ${index + 1} of ${accounts.length}. Tap a card or swipe to switch.`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      className="flex flex-col rounded-3xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
    >
      {behind.map((a, i) => {
        const theme = themeOf(a)
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            aria-label={`Show ${a.name} ending ${a.mask}, ${balanceLabel(a)}`}
            className={cn(
              'relative flex h-28 w-full items-start justify-between gap-3 rounded-3xl px-4 pt-4 text-left',
              theme.card,
              i > 0 ? '-mt-12 shadow-[0_-6px_14px_rgb(0_0_0/0.16)]' : 'shadow-card',
            )}
          >
            <span className="min-w-0 truncate font-heading text-base font-bold">{a.name}</span>
            <span className="tabular shrink-0 font-mono text-xl font-bold leading-none">{balanceLabel(a)}</span>
          </button>
        )
      })}

      <div
        className={cn(
          'relative z-20 touch-pan-y select-none rounded-3xl',
          behind.length > 0 ? '-mt-12 shadow-[0_-6px_14px_rgb(0_0_0/0.16)]' : 'shadow-card',
          !dragging && 'transition-transform duration-200',
        )}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 60}deg)` }}
        onPointerDown={(e) => {
          startX.current = e.clientX
          setDragging(true)
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            // Capture only keeps a drag tracking outside the card, so it is fine to go without.
          }
        }}
        onPointerMove={(e) => {
          if (dragging) setDx(Math.max(-140, Math.min(140, e.clientX - startX.current)))
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {children}
      </div>
    </div>
  )
}
