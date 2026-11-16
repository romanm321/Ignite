'use client'

import { useMemo } from 'react'
import { BellRing, Fingerprint, Landmark, Leaf, PiggyBank, Repeat, Smartphone, Zap, type LucideIcon } from 'lucide-react'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'

export type SetupId = 'zelle' | 'wallet' | 'directDeposit' | 'security' | 'alerts' | 'paperless' | 'paymentSwitch' | 'savings'

export type SetupItem = {
  id: SetupId
  title: string
  body: string
  cta: string
  points: number
  icon: LucideIcon
  done: boolean
}

const levels = [
  { min: 0, label: 'Getting started' },
  { min: 25, label: 'Building momentum' },
  { min: 60, label: 'Almost there' },
  { min: 100, label: 'Fully set up' },
]

export function useAccountSetup() {
  const { setupDone, accounts } = useBank()
  const { biometrics, passkey, profile } = useTrust()

  return useMemo(() => {
    const items: SetupItem[] = [
      { id: 'zelle', title: 'Turn on Zelle', body: 'Send money with just a phone number or email.', cta: 'Enroll', points: 10, icon: Zap, done: !!setupDone.zelle },
      { id: 'wallet', title: 'Add your card to your phone', body: 'Tap to pay before the plastic card arrives.', cta: 'Add', points: 10, icon: Smartphone, done: !!setupDone.wallet },
      { id: 'directDeposit', title: 'Set up direct deposit', body: 'Get paid up to 2 days early.', cta: 'Set up', points: 20, icon: Landmark, done: !!setupDone.directDeposit },
      { id: 'security', title: 'Secure your sign-in', body: 'Use Face ID and a passkey.', cta: 'Secure', points: 15, icon: Fingerprint, done: biometrics && passkey },
      { id: 'alerts', title: 'Choose your alerts', body: 'Hear about deposits, bills and low balances.', cta: 'Choose', points: 10, icon: BellRing, done: !!setupDone.alerts },
      { id: 'paperless', title: 'Go paperless', body: 'Keep statements safe in the app.', cta: 'Enroll', points: 5, icon: Leaf, done: profile.paperless },
      { id: 'paymentSwitch', title: 'Bring your bills to TD', body: 'We switch them for you. No calls, no forms.', cta: 'Switch', points: 15, icon: Repeat, done: !!setupDone.paymentSwitch },
      { id: 'savings', title: 'Open a savings account', body: 'Earn 4.60% interest and save for your goals.', cta: 'Open', points: 15, icon: PiggyBank, done: accounts.some((a) => a.kind === 'savings') },
    ]
    const earned = items.filter((i) => i.done).reduce((s, i) => s + i.points, 0)
    const total = items.reduce((s, i) => s + i.points, 0)
    const completed = items.filter((i) => i.done).length
    const level = [...levels].reverse().find((l) => earned >= l.min) ?? levels[0]
    return { items, earned, total, completed, count: items.length, level: level.label, next: items.find((i) => !i.done) ?? null }
  }, [setupDone, accounts, biometrics, passkey, profile.paperless])
}
