'use client'

import { ChevronRight, Landmark, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatWhole, tiers } from '@/lib/relationship'
import { useBank } from '../bank-provider'
import { openVaultsLanding } from '../vaults/open-vaults'
import { BigAmount } from '../big-amount'
import { useRelationship } from './use-relationship'

type Unlock = { id: string; icon: LucideIcon; title: string; detail: string; run: () => void }

function useUnlocks() {
  const rel = useRelationship()
  const { invest, owned, dispatch } = useBank()
  const { next } = rel

  const unlocks: Unlock[] = []
  if (next) {
    unlocks.push(
      invest.opened
        ? {
            id: 'invest',
            icon: TrendingUp,
            title: 'Add to your investments',
            detail: `Investing counts toward ${next.name}`,
            run: () => dispatch({ type: 'overlay', overlay: 'invest' }),
          }
        : {
            id: 'invest',
            icon: TrendingUp,
            title: 'Start investing from $5',
            detail: `Every dollar counts toward ${next.name}`,
            run: () => dispatch({ type: 'startOnboarding', productId: 'auto-invest' }),
          },
    )
    if (!owned.includes('step-cd')) {
      unlocks.push({
        id: 'cd',
        icon: Landmark,
        title: 'Lock in a Step Rate CD',
        detail: 'Counts in full. Earns up to 4.25%.',
        run: () => dispatch({ type: 'startOnboarding', productId: 'step-cd' }),
      })
    }
    unlocks.push({
      id: 'save',
      icon: PiggyBank,
      title: 'Add to your Vaults',
      detail: 'Round-ups do it for you',
      run: () => openVaultsLanding(dispatch),
    })
  }

  return unlocks
}

/** Where the customer stands: tier, what is left to the next one, and a bar for each tier. */
export function TierProgress() {
  const rel = useRelationship()
  const { streetSafe } = useBank()
  const show = (n: number) => (streetSafe ? '••••' : formatWhole(n))
  const { tier, next } = rel

  return (
    <div aria-labelledby="tier-h">
      <h3 id="tier-h" className="text-balance font-heading text-xl font-bold leading-tight tracking-tight">
        {tier.id === 'member' ? `You're a Member.` : next ? `You're ${tier.name}.` : `You're ${tier.name}, our top tier.`}
      </h3>
      {next && (
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <BigAmount value={show(rel.toGo)} className="text-3xl" />
          <span className="text-base font-light text-muted-foreground">to {next.name}</span>
        </p>
      )}
      <ol className="mt-3 grid grid-cols-4 gap-2" aria-label="Relationship tiers">
        {tiers.map((t, i) => {
          const fill = i < rel.tierIndex ? 100 : i === rel.tierIndex ? Math.max(rel.progress * 100, 6) : 0
          return (
            <li key={t.id} aria-current={i === rel.tierIndex ? 'step' : undefined}>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} />
              </div>
              <p className={cn('mt-1 text-xs', i === rel.tierIndex ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{t.name}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Ways to reach the next tier. Renders nothing at the top tier. */
export function UnlockPanel() {
  const rel = useRelationship()
  const unlocks = useUnlocks()
  const { next } = rel
  if (!next) return null

  return (
    <div className="rounded-2xl bg-muted/60 p-2">
      <p className="px-2 pt-1 font-heading text-sm font-bold uppercase leading-tight tracking-tight">
        Unlock {next.name}
        {rel.uplift > 0 ? ` + ${formatWhole(rel.uplift)} a year` : ''}
      </p>
      <ul className="mt-1">
        {unlocks.map((u) => (
          <li key={u.id}>
            <button type="button" onClick={u.run} className="flex min-h-12 w-full items-center gap-2.5 rounded-xl px-2 py-1 text-left active:bg-muted">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-forest text-lime">
                <u.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{u.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{u.detail}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
