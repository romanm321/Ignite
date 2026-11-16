'use client'

import { useMemo } from 'react'
import type { Transaction } from '@/lib/bank-data'
import { dealOffers, formatPct, offerEarned } from '@/lib/relationship'
import { rewardFor } from '@/lib/rewards'
import { accountOf, useBank } from '../bank-provider'
import { useRelationship } from './use-relationship'

export type EarningEvent = { txn: Transaction; amount: number; source: 'offer' | 'credit' | 'debit'; detail: string }

const notEarning = new Set<Transaction['category']>(['Transfer', 'Income', 'Bills'])
const round = (n: number) => Math.round(n * 100) / 100

/** Cash back across credit, debit and merchant offers, plus the latest purchases that earned it. */
export function useEarnings(enrolled: string[] = []) {
  const { transactions, rewardsBalance } = useBank()
  const rel = useRelationship()
  const activeOffers = dealOffers.filter((o) => !o.needsActivation || enrolled.includes(o.id))

  return useMemo(() => {
    const events: EarningEvent[] = []
    for (const t of transactions) {
      if (t.amount >= 0 || notEarning.has(t.category)) continue
      const spend = Math.abs(t.amount)
      const offer = activeOffers.find((o) => t.merchant.toLowerCase().includes(o.match.toLowerCase()))
      if (offer) {
        events.push({ txn: t, amount: round((spend * offer.rate) / 100), source: 'offer', detail: `${formatPct(offer.rate)} merchant offer` })
        continue
      }
      if (accountOf(t) === 'cc') {
        const reward = rewardFor(t, 'cc')
        if (reward) events.push({ txn: t, amount: reward.amount, source: 'credit', detail: `${formatPct(reward.rate * 100)} on your card` })
        continue
      }
      if (accountOf(t) === 'chk') {
        events.push({ txn: t, amount: round((spend * rel.tier.debitRate) / 100), source: 'debit', detail: `${formatPct(rel.tier.debitRate)} on debit` })
      }
    }

    const debit = (rel.ctx.debitSpend * rel.tier.debitRate) / 100
    const offers = activeOffers.reduce((sum, o) => sum + offerEarned(o, transactions), 0)
    return { events, ready: rewardsBalance, debit, offers, total: rewardsBalance + debit + offers }
    // activeOffers is derived from `enrolled`, so that is the dependency to watch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, rewardsBalance, rel, enrolled.join('|')])
}
