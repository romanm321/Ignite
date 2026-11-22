'use client'

import { useMemo } from 'react'
import { BellRing, CalendarSync, Smartphone, Wallet, Zap, type LucideIcon } from 'lucide-react'
import { SETUP_REWARD, useBank } from '../bank-provider'

export type SetupId = 'fund' | 'zelle' | 'wallet' | 'alerts' | 'subscriptions'

export type SetupItem = {
  id: SetupId
  title: string
  body: string
  cta: string
  /** Dollars added to checking when this step is done. */
  reward: number
  icon: LucideIcon
  done: boolean
}

export function useAccountSetup() {
  const { setupDone } = useBank()

  return useMemo(() => {
    const items: SetupItem[] = [
      { id: 'fund', title: 'Fund your account', body: 'Add money with Apple Pay, Google Pay or a transfer.', cta: 'Add money', reward: SETUP_REWARD, icon: Wallet, done: !!setupDone.fund },
      { id: 'zelle', title: 'Turn on Zelle', body: 'Send money with just a phone number or email.', cta: 'Turn on', reward: SETUP_REWARD, icon: Zap, done: !!setupDone.zelle },
      { id: 'wallet', title: 'Add card to wallet', body: 'Tap to pay before the plastic card arrives.', cta: 'Add', reward: SETUP_REWARD, icon: Smartphone, done: !!setupDone.wallet },
      { id: 'alerts', title: 'Set up alerts', body: 'Hear about deposits, bills and low balances.', cta: 'Choose', reward: SETUP_REWARD, icon: BellRing, done: !!setupDone.alerts },
      { id: 'subscriptions', title: 'Manage subscriptions', body: 'Catch price rises and free trials that are ending.', cta: 'Set up', reward: SETUP_REWARD, icon: CalendarSync, done: !!setupDone.subscriptions },
    ]
    const completed = items.filter((i) => i.done).length
    const earned = items.filter((i) => i.done).reduce((s, i) => s + i.reward, 0)
    const total = items.reduce((s, i) => s + i.reward, 0)
    return { items, earned, total, completed, count: items.length, next: items.find((i) => !i.done) ?? null }
  }, [setupDone])
}
