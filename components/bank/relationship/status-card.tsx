'use client'

import { ChevronRight, Crown, Landmark, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatWhole, tiers } from '@/lib/relationship'
import { useBank } from '../bank-provider'
import { openVaultsSection } from '../vaults/open-vaults'
import { useRelationship } from './use-relationship'

type Unlock = { id: string; icon: LucideIcon; title: string; detail: string; run: () => void }

export function StatusCard() {
  const rel = useRelationship()
  const { streetSafe, invest, owned, dispatch } = useBank()
  const show = (n: number) => (streetSafe ? '••••' : formatWhole(n))
  const { tier, next } = rel

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
      run: () => openVaultsSection(dispatch),
    })
  }

  return (
    <section aria-labelledby="tier-h" className="relative overflow-hidden rounded-3xl bg-forest p-5 text-forest-foreground">
      <div aria-hidden className="absolute -right-12 -top-12 size-44 rounded-full bg-lime/15" />
      <div className="relative flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-lime-foreground">
          <Crown className="size-3.5" aria-hidden /> {tier.name}
        </span>
        <span className="text-xs text-forest-foreground/70">Your status</span>
      </div>

      <h2 id="tier-h" className="relative mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight">
        {next
          ? `You're ${tier.id === 'member' ? 'a Member' : tier.name}. ${show(rel.toGo)} to ${next.name}.`
          : `You're ${tier.name}, our top tier.`}
      </h2>
      <p className="relative mt-1 text-sm text-forest-foreground/75">
        Based on {show(rel.qualifying)} across your accounts{rel.invested > 0 ? ' and investments' : ''}.
      </p>

      <ol className="relative mt-5 grid grid-cols-4 gap-1.5" aria-label="Relationship tiers">
        {tiers.map((t, i) => {
          const fill = i < rel.tierIndex ? 100 : i === rel.tierIndex ? Math.max(rel.progress * 100, 6) : 0
          return (
            <li key={t.id} aria-current={i === rel.tierIndex ? 'step' : undefined}>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-lime" style={{ width: `${fill}%` }} />
              </div>
              <p
                className={cn(
                  'mt-1.5 text-xs',
                  i === rel.tierIndex ? 'font-semibold text-forest-foreground' : 'text-forest-foreground/55',
                )}
              >
                {t.name}
              </p>
            </li>
          )
        })}
      </ol>

      {next && (
        <div className="relative mt-5 rounded-2xl bg-white/10 p-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-lime">
            Unlock {next.name}
            {rel.uplift > 0 ? ` · +${formatWhole(rel.uplift)} a year` : ''}
          </p>
          <ul className="mt-1">
            {unlocks.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={u.run}
                  className="flex min-h-14 w-full items-center gap-3 rounded-xl px-1 py-2 text-left active:bg-white/10"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime">
                    <u.icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{u.title}</span>
                    <span className="block text-xs text-forest-foreground/65">{u.detail}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-forest-foreground/60" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
