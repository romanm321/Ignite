'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatMoney, type Account } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { BottomSheet, PrimaryButton } from '../overlay'

type Destination = 'statement' | 'checking'

export function RedeemSheet({ card, onClose }: { card: Account; onClose: () => void }) {
  const { rewardsBalance, accounts, dispatch, notify } = useBank()
  const [to, setTo] = useState<Destination>('statement')
  const [amountKey, setAmountKey] = useState('all')
  const presets = [25, 50].filter((n) => n < rewardsBalance)
  const amount = amountKey === 'all' ? rewardsBalance : Number(amountKey)
  const checking = accounts.find((a) => a.id === 'chk')

  const destinations: { id: Destination; label: string; detail: string }[] = [
    { id: 'statement', label: 'Statement credit', detail: `Lowers your ${card.name} balance` },
    {
      id: 'checking',
      label: 'Deposit to checking',
      detail: checking ? `${checking.name} ··${checking.mask}` : 'Your checking account',
    },
  ]

  const redeem = () => {
    dispatch({ type: 'redeemRewards', amount, to, cardId: card.id })
    notify(
      to === 'statement'
        ? `${formatMoney(amount)} credited to ${card.name}`
        : `${formatMoney(amount)} deposited to ${checking?.name ?? 'checking'}`,
    )
    onClose()
  }

  return (
    <BottomSheet title="Redeem cash back" description={`${formatMoney(rewardsBalance)} available`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div role="group" aria-label="Amount to redeem" className="flex gap-2">
          {[...presets.map((n) => ({ key: String(n), label: formatMoney(n) })), { key: 'all', label: `All · ${formatMoney(rewardsBalance)}` }].map(
            (o) => (
              <button
                key={o.key}
                type="button"
                aria-pressed={amountKey === o.key}
                onClick={() => setAmountKey(o.key)}
                className={cn(
                  'h-11 flex-1 rounded-xl border text-sm font-semibold',
                  amountKey === o.key ? 'border-shield bg-shield-50 text-shield-700' : 'bg-card',
                )}
              >
                {o.label}
              </button>
            ),
          )}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Send it to</legend>
          {destinations.map((d) => (
            <label
              key={d.id}
              className={cn(
                'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                to === d.id && 'border-shield bg-shield-50',
              )}
            >
              <input
                type="radio"
                name="redeem-to"
                checked={to === d.id}
                onChange={() => setTo(d.id)}
                className="size-5 accent-[var(--primary)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{d.label}</span>
                <span className="block text-xs text-muted-foreground">{d.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <PrimaryButton onClick={redeem}>Redeem {formatMoney(amount)}</PrimaryButton>
      </div>
    </BottomSheet>
  )
}
