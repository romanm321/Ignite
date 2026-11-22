'use client'

import { Fragment, useState } from 'react'
import { ArrowLeftRight, Landmark, Receipt, Send, TrendingUp, Users, FileText, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useFamily } from '../family/family-provider'
import { StickerImg } from '../family/kid-visuals'
import { accountApy, CARD_PAYMENT_DUE } from '../accounts/account-row'
import type { AccountGroup } from '../accounts/account-groups'
import { themeForKey, type AccountTheme } from '../accounts/account-theme'
import { TransferSheet } from '../accounts/transfer-sheet'
import { cardColors, stickerSlots, type Kid } from '@/lib/family-data'
import { SafeToSpend } from './money-position'

function splitMoney(value: number) {
  const [whole, cents] = Math.abs(value).toFixed(2).split('.')
  return { whole: `$${Number(whole).toLocaleString('en-US')}`, cents }
}

function Balance({ value, masked, className }: { value: number; masked: boolean; className: string }) {
  if (masked) return <span className={cn('font-mono font-bold leading-none', className)}>••••</span>
  const { whole, cents } = splitMoney(value)
  return (
    <span className={cn('tabular font-mono font-bold leading-none', className)}>
      {whole}
      <span className="text-[0.55em]">.{cents}</span>
    </span>
  )
}

function groupTitle(group: AccountGroup) {
  return group.accounts.length > 1 ? `${group.label} · ${group.accounts.length}` : group.accounts[0].name
}

/** The family card wears whatever colour and stickers the child picked for their own card. */
function familyTheme(kid: Kid | undefined): AccountTheme {
  const base = themeForKey('family')
  if (!kid) return base
  const color = cardColors[kid.cardColor]
  const onDark = color.text.includes('white') || color.text.includes('eaf5e6')
  return {
    card: `${color.cls} ${color.text}`,
    pill: onDark ? 'bg-white/20 active:bg-white/30' : 'bg-black/10 active:bg-black/20',
    muted: 'opacity-75',
    track: base.track,
  }
}

export function AccountStack({
  groups,
  activeKey,
  onSelect,
  balanceOf,
  masked,
}: {
  groups: AccountGroup[]
  activeKey: string
  onSelect: (key: string) => void
  balanceOf: (account: Account) => number
  masked: boolean
}) {
  const { dispatch } = useBank()
  const { kids } = useFamily()
  const [moving, setMoving] = useState<{ account: Account; mode: 'in' | 'out' | 'pay' } | null>(null)
  const active = groups.find((g) => g.key === activeKey) ?? groups[0]
  if (!active) return null

  const kid = kids[0]
  const themeOf = (g: AccountGroup) => (g.key === 'family' ? familyTheme(kid) : themeForKey(g.key))

  // The chosen account sits at the front; the others peek out above it, like cards in a wallet.
  const ordered = [...groups.filter((g) => g !== active), active]
  const first = (g: AccountGroup) => g.accounts[0]
  const totalOf = (g: AccountGroup) => g.accounts.reduce((sum, a) => sum + balanceOf(a), 0)
  const open = (g: AccountGroup) =>
    g.key === 'family' ? dispatch({ type: 'overlay', overlay: 'family' }) : dispatch({ type: 'openAccount', id: first(g).id })

  const actionsFor = (g: AccountGroup): { label: string; icon: LucideIcon; run: () => void }[] => {
    switch (g.key) {
      case 'checking':
        return [
          { label: 'Send', icon: Send, run: () => dispatch({ type: 'overlay', overlay: 'send' }) },
          { label: 'Transfer', icon: ArrowLeftRight, run: () => dispatch({ type: 'overlay', overlay: 'move' }) },
        ]
      case 'savings':
        return []
      case 'cd':
        return []
      case 'credit':
        return [{ label: 'Pay Card', icon: Receipt, run: () => setMoving({ account: first(g), mode: 'pay' }) }]
      case 'family':
        return [{ label: 'Open Family', icon: Users, run: () => open(g) }]
      case 'investing':
        return [
          { label: 'Invest', icon: TrendingUp, run: () => dispatch({ type: 'overlay', overlay: 'invest' }) },
          { label: 'Details', icon: FileText, run: () => open(g) },
        ]
      default:
        return [{ label: 'Details', icon: FileText, run: () => open(g) }]
    }
  }

  const subtitle = (g: AccountGroup) => {
    const a = first(g)
    if (g.key === 'family') return `For ${a.mask}`
    if (g.key === 'credit') {
      const available = g.accounts.reduce((sum, acc) => sum + (acc.limit ?? 0) + acc.balance, 0)
      return masked ? `Due ${CARD_PAYMENT_DUE}` : `$${Math.floor(available).toLocaleString('en-US')} available · Due ${CARD_PAYMENT_DUE}`
    }
    if (g.accounts.length > 1) return `${g.accounts.length} accounts`
    const apy = accountApy(a)
    return `•••• ${a.mask}${apy && a.kind !== 'checking' ? ` · ${apy.toFixed(2)}% interest` : ''}`
  }

  return (
    <section aria-label="Your accounts" className="flex flex-col">
      {ordered.map((g, i) => {
        const theme = themeOf(g)
        const isFront = g === active
        const overlap = i > 0 ? '-mt-12 shadow-[0_-6px_14px_rgb(0_0_0/0.16)]' : 'shadow-card'

        if (!isFront) {
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => onSelect(g.key)}
              aria-label={`Show ${groupTitle(g)}${masked ? '' : `, ${g.key === 'credit' ? 'owed' : 'balance'} ${splitMoney(totalOf(g)).whole}.${splitMoney(totalOf(g)).cents}`}`}
              className={cn('relative flex h-28 w-full items-start justify-between gap-3 rounded-3xl px-4 pt-4 text-left', theme.card, overlap)}
            >
              <span className="min-w-0 truncate font-heading text-base font-bold">{groupTitle(g)}</span>
              <Balance value={totalOf(g)} masked={masked} className="shrink-0 text-xl" />
            </button>
          )
        }

        const several = g.accounts.length > 1 && g.key !== 'family'
        // With more than one account the card lists each one, so the shortcuts for a single account no longer apply.
        const actions = several ? [] : actionsFor(g)
        return (
          <Fragment key={g.key}>
            <div
              aria-label={`${groupTitle(g)} selected`}
              className={cn('relative min-h-44 animate-in fade-in slide-in-from-bottom-2 rounded-3xl p-4 duration-300', theme.card, overlap)}
            >
              {g.key === 'family' && kid && (
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                  {kid.stickers.map((s) => {
                    const slot = stickerSlots[s.slot % stickerSlots.length]
                    return (
                      <span
                        key={s.id}
                        className="absolute size-11"
                        style={{ top: `${44 + slot.top * 0.55}%`, left: `${46 + slot.left * 0.42}%`, transform: `rotate(${slot.rotate}deg)` }}
                      >
                        <StickerImg id={s.sticker} className="size-full" />
                      </span>
                    )
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => open(g)}
                aria-label={`Open ${groupTitle(g)} details`}
                className="absolute inset-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              <div className="pointer-events-none relative">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 pt-1 font-heading text-lg font-bold leading-tight">{groupTitle(g)}</h2>
                  <div className="shrink-0 text-right">
                    <Balance value={totalOf(g)} masked={masked} className="text-3xl" />
                    <p className={cn('mt-1 text-sm', theme.muted)}>{g.key === 'credit' ? 'Owed' : 'Balance'}</p>
                  </div>
                </div>
                {several ? (
                  <ul className="pointer-events-auto mt-3 divide-y divide-current/15 border-t border-current/15">
                    {g.accounts.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'openAccount', id: a.id })}
                          aria-label={`Open ${a.name} details`}
                          className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{a.name}</span>
                            <span className={cn('block text-xs', theme.muted)}>•••• {a.mask}</span>
                          </span>
                          <Balance value={balanceOf(a)} masked={masked} className="shrink-0 text-lg" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={cn('mt-1 flex items-center gap-1.5 text-sm', theme.muted)}>
                    <Landmark className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 truncate">{subtitle(g)}</span>
                  </p>
                )}
                {actions.length > 0 && (
                  <div className="pointer-events-auto mt-4 flex items-center gap-2">
                    {actions.map(({ label, icon: Icon, run }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={run}
                        className={cn('flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors', theme.pill)}
                      >
                        <Icon className="size-4" aria-hidden />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {g.key === 'checking' && (
                  <div className="pointer-events-auto mt-4 empty:hidden">
                    <SafeToSpend masked={masked} embedded />
                  </div>
                )}
              </div>
            </div>
          </Fragment>
        )
      })}
      {moving && <TransferSheet account={moving.account} mode={moving.mode} onClose={() => setMoving(null)} />}
    </section>
  )
}
