'use client'

import { useState } from 'react'
import { ArrowLeftRight, CreditCard, Receipt, Send, Snowflake, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { BottomSheet } from '../overlay'
import { Switch } from '../primitives'

/** The four things people open a bank app to do, one tap from Home. */
export function QuickActions() {
  const { cardFrozen, dispatch } = useBank()
  const [cardOpen, setCardOpen] = useState(false)

  const actions: { label: string; icon: LucideIcon; run: () => void; badge?: boolean }[] = [
    { label: 'Send', icon: Send, run: () => dispatch({ type: 'overlay', overlay: 'send' }) },
    { label: 'Transfer', icon: ArrowLeftRight, run: () => dispatch({ type: 'overlay', overlay: 'move' }) },
    { label: 'Pay bill', icon: Receipt, run: () => dispatch({ type: 'overlay', overlay: 'billpay' }) },
    { label: cardFrozen ? 'Frozen' : 'Card', icon: cardFrozen ? Snowflake : CreditCard, run: () => setCardOpen(true), badge: cardFrozen },
  ]

  return (
    <nav aria-label="Quick actions" className="text-forest-foreground [text-shadow:0_1px_8px_rgb(0_0_0/0.55)]">
      <ul className="grid grid-cols-4">
        {actions.map(({ label, icon: Icon, run, badge }) => (
          <li key={label}>
            <button
              type="button"
              onClick={run}
              aria-label={label === 'Send' ? 'Send with Zelle' : label === 'Frozen' ? 'Card frozen. Manage card' : undefined}
              className="group flex min-h-20 w-full flex-col items-center justify-center gap-2 rounded-2xl text-xs font-medium"
            >
              <span
                className={cn(
                  'flex size-14 items-center justify-center rounded-full ring-1 backdrop-blur-md transition-colors [text-shadow:none]',
                  badge
                    ? 'bg-sky-200/35 text-white ring-sky-100/60'
                    : 'bg-white/20 text-white ring-white/30 group-active:bg-white/35',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              {label}
            </button>
          </li>
        ))}
      </ul>
      {cardOpen && <CardSheet onClose={() => setCardOpen(false)} />}
    </nav>
  )
}

function CardSheet({ onClose }: { onClose: () => void }) {
  const { accounts, cardFrozen, dispatch, notify } = useBank()
  const card = accounts.find((a) => a.kind === 'credit')
  const available = card?.limit ? card.limit + card.balance : null

  return (
    <BottomSheet title="Your card" description="Freeze it in a tap if it goes missing. Unfreeze any time." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            'relative flex aspect-[1.6] flex-col justify-between overflow-hidden rounded-2xl bg-forest p-5 text-forest-foreground transition-opacity',
            cardFrozen && 'opacity-60',
          )}
        >
          <span aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
          <span className="text-sm font-semibold">{card?.name ?? 'TD card'}</span>
          <span>
            <span className="tabular block font-mono text-lg tracking-widest">•••• {card?.mask}</span>
            {available !== null && <span className="text-xs text-forest-foreground/75">{formatMoney(available)} available</span>}
          </span>
          {cardFrozen && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
              <Snowflake className="size-3.5" aria-hidden /> Frozen
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 py-1 pl-4 pr-2">
          <Snowflake className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Freeze card</span>
            <span className="block text-xs text-muted-foreground">{cardFrozen ? 'New purchases are blocked' : 'Blocks new purchases instantly'}</span>
          </span>
          <Switch
            checked={cardFrozen}
            label="Freeze card"
            onChange={(frozen) => {
              dispatch({ type: 'freeze', frozen })
              notify(frozen ? 'Card frozen instantly' : 'Card unfrozen. You’re good to go.')
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onClose()
            if (card) dispatch({ type: 'openAccount', id: card.id })
          }}
          className="h-12 rounded-xl border text-sm font-semibold"
        >
          Card details and controls
        </button>
      </div>
    </BottomSheet>
  )
}
