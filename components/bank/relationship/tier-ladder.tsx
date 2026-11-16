'use client'

import { useEffect, useRef } from 'react'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bankers } from '@/lib/bank-data'
import { formatPct, formatWhole, tiers } from '@/lib/relationship'
import { SectionHeader } from '../primitives'
import { useBank } from '../bank-provider'
import { useRelationship } from './use-relationship'

const LIST_PADDING = 16

export function TierLadder() {
  const rel = useRelationship()
  const { dispatch } = useBank()
  const banker = bankers[0]
  const listRef = useRef<HTMLUListElement>(null)

  // The screen can mount while hidden (zero width), so wait until the list has a size before scrolling.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    let anchored = false
    const anchor = () => {
      if (anchored || list.clientWidth === 0) return
      const card = list.children[rel.tierIndex] as HTMLElement | undefined
      if (!card) return
      anchored = true
      const offset = card.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft - LIST_PADDING
      list.scrollLeft = Math.max(0, offset)
    }
    anchor()
    const observer = new ResizeObserver(anchor)
    observer.observe(list)
    return () => observer.disconnect()
  }, [rel.tierIndex])

  return (
    <section aria-labelledby="ladder-h" className="flex flex-col gap-3">
      <SectionHeader id="ladder-h" title="Better every time you grow" />
      <ul ref={listRef} className="no-scrollbar -mx-4 flex scroll-px-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1" aria-label="Relationship tiers">
        {tiers.map((t, i) => {
          const reached = i <= rel.tierIndex
          const current = i === rel.tierIndex
          const lines = [
            t.apyBoost ? `+${formatPct(t.apyBoost)} on savings interest` : 'Standard savings interest',
            t.cardBoost ? `+${formatPct(t.cardBoost)} card cash back` : 'Standard card rewards',
            `${formatPct(t.debitRate)} debit cash back`,
            t.loanDiscount ? `${formatPct(t.loanDiscount)} off loan interest` : 'Standard loan rates',
            t.fees,
            t.service,
          ]
          return (
            <li
              key={t.id}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'w-[78%] shrink-0 snap-start rounded-3xl p-4',
                current ? 'bg-forest text-forest-foreground' : 'bg-card',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{t.name}</p>
                {current ? (
                  <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-semibold text-lime-foreground">You are here</span>
                ) : reached ? (
                  <Check className="size-5 text-primary" aria-label="Reached" />
                ) : (
                  <Lock className="size-4 text-muted-foreground" aria-label="Locked" />
                )}
              </div>
              <p className={cn('text-xs', current ? 'text-forest-foreground/70' : 'text-muted-foreground')}>
                {t.min === 0 ? 'Everyone starts here' : `${formatWhole(t.min)} in deposits and investments`}
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {lines.map((l) => (
                  <li key={l} className="flex items-start gap-2">
                    <Check className={cn('mt-0.5 size-4 shrink-0', current ? 'text-lime' : 'text-primary')} aria-hidden />
                    {l}
                  </li>
                ))}
              </ul>
              <p className={cn('mt-3 border-t pt-3 text-sm font-medium', current ? 'border-white/15' : '')}>{t.banker}</p>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-3 rounded-3xl bg-card p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-sm font-semibold text-lime">
          {rel.tierIndex >= 2 ? banker.initials : '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">
            {rel.tierIndex >= 2 ? `Your ${rel.tier.id === 'wealth' ? 'wealth' : 'Premier'} banker, ${banker.name}` : 'A banker of your own'}
          </p>
          <p className="text-sm text-muted-foreground">
            {rel.tierIndex >= 2 ? 'Call, message or book time any time.' : 'Premier gets you a personal banker. Meet an advisor today.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'navigate', tab: 'branches' })}
          className="h-11 shrink-0 rounded-xl border px-3.5 text-sm font-semibold"
        >
          Book time
        </button>
      </div>
    </section>
  )
}
