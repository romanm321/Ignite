'use client'

import { useMemo } from 'react'
import { BellRing, CalendarCheck, CreditCard, Gift, Lightbulb, Mail, Receipt, Repeat, ShieldAlert, Sparkles, UserRoundCheck, type LucideIcon } from 'lucide-react'
import { enrichments } from '@/lib/enrichment'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { useAccountSetup } from '../setup/use-account-setup'

export type NotificationAction = 'security' | 'bills' | 'subs' | 'fraud' | 'setup' | 'rewards' | 'insights' | 'doubleUp' | 'none'
export type NotificationTone = 'urgent' | 'warn' | 'info' | 'good'

export type NotificationItem = {
  id: string
  /** Items that need the customer to review or act count toward the bell badge until they open them. */
  needsAction: boolean
  tone: NotificationTone
  icon: LucideIcon
  source: string
  title: string
  body: string
  when: string
  cta?: string
  action: NotificationAction
  read: boolean
}

type Draft = Omit<NotificationItem, 'read'>

export function useNotifications() {
  const { customerType, payees, transactions, subs, fraudBanner, rewardsBalance, accounts, readNotifs } = useBank()
  const { devices, logins } = useTrust()
  const setup = useAccountSetup()

  return useMemo(() => {
    const isNew = customerType === 'new'
    const drafts: Draft[] = []

    if (fraudBanner) {
      const lastZelle = transactions.find((t) => t.id.startsWith('zl-'))
      const recipient = lastZelle?.merchant.replace(/^Zelle®? to /, '')
      drafts.push({
        id: 'fraud-zelle',
        needsAction: true,
        tone: 'urgent',
        icon: ShieldAlert,
        source: 'Heads up',
        title: 'Something looks off',
        body: recipient ? `Your recent Zelle payment to ${recipient} looks unusual. Can you take a quick look?` : 'We spotted some unusual activity. Can you take a quick look?',
        when: 'Just now',
        cta: 'Take a look',
        action: 'fraud',
      })
    }

    if (!isNew) {
      const untrusted = devices.filter((d) => !d.trusted)
      const flagged = logins.find((l) => l.flagged)
      if (untrusted.length > 0 || flagged) {
        const device = untrusted[0]
        drafts.push({
          id: 'sec-device',
          needsAction: true,
          tone: 'urgent',
          icon: ShieldAlert,
          source: 'Security',
          title: 'Was this you signing in?',
          body: device ? `${device.name} in ${device.location}, ${flagged?.when ?? device.lastActive}.` : `Someone signed in from ${flagged?.location}.`,
          when: flagged?.when ?? 'Recently',
          cta: 'Check it',
          action: 'security',
        })
      }

      for (const p of payees.filter((x) => !x.paid && x.dueIn <= 3)) {
        drafts.push({
          id: `bill-${p.id}`,
          needsAction: true,
          tone: 'warn',
          icon: Receipt,
          source: 'Bills',
          title: `${p.name} is due ${p.dueIn === 0 ? 'today' : p.dueIn === 1 ? 'tomorrow' : `in ${p.dueIn} days`}`,
          body: p.autopay ? `${formatMoney(p.amountDue)}. We’ll pay it for you.` : `${formatMoney(p.amountDue)}. Pay it now so it’s never late.`,
          when: 'Today',
          cta: p.autopay ? undefined : 'Pay now',
          action: 'bills',
        })
      }

      const flaggedSubs = transactions.filter((t) => {
        const sub = enrichments[t.merchant]?.subscription
        return sub?.insight && subs[sub.id]?.status === 'active'
      })
      if (flaggedSubs.length > 0) {
        drafts.push({
          id: 'subs-flagged',
          needsAction: true,
          tone: 'warn',
          icon: Repeat,
          source: 'Subscriptions',
          title: `${flaggedSubs.length} subscription${flaggedSubs.length === 1 ? '' : 's'} worth a look`,
          body: 'Prices went up, or a free trial is ending.',
          when: 'Yesterday',
          cta: 'Take a look',
          action: 'subs',
        })
      }
    }

    if (isNew && setup.completed < setup.count) {
      drafts.push({
        id: 'setup-left',
        needsAction: true,
        tone: 'info',
        icon: UserRoundCheck,
        source: 'Account setup',
        title: `${setup.count - setup.completed} quick thing${setup.count - setup.completed === 1 ? '' : 's'} left to set up`,
        body: setup.next ? `Next up: ${setup.next.title}.` : 'You’re almost there.',
        when: 'Today',
        cta: 'Keep going',
        action: 'setup',
      })
    }

    if (!isNew) {
      drafts.push(
        {
          id: 'rewards-ready',
          needsAction: false,
          tone: 'good',
          icon: Gift,
          source: 'Rewards',
          title: `${formatMoney(rewardsBalance)} in cash back is ready`,
          body: 'Use it on your card bill, or send it to checking.',
          when: 'Today',
          cta: 'Cash it in',
          action: 'rewards',
        },
        {
          id: 'insight-dining',
          needsAction: false,
          tone: 'good',
          icon: Lightbulb,
          source: 'Spending',
          title: 'You ate out less this month',
          body: 'Nice. Want to save what you didn’t spend?',
          when: 'Yesterday',
          cta: 'See how',
          action: 'insights',
        },
        {
          id: 'offer-doubleup',
          needsAction: false,
          tone: 'info',
          icon: CreditCard,
          source: 'Just for you',
          title: 'You’re pre-approved for Double Up',
          body: '2% back on everything, up to $8,000. Looking won’t touch your credit score.',
          when: 'Oct 28',
          cta: 'See offer',
          action: 'doubleUp',
        },
        {
          id: 'msg-statement',
          needsAction: false,
          tone: 'info',
          icon: Mail,
          source: 'TD',
          title: 'Your October statement is here',
          body: 'You can find it in the app anytime.',
          when: 'Nov 1',
          action: 'none',
        },
      )
    } else {
      drafts.push(
        {
          id: 'msg-welcome',
          needsAction: false,
          tone: 'good',
          icon: Sparkles,
          source: 'TD',
          title: 'Welcome to TD, Ava',
          body: accounts.some((a) => a.kind === 'checking') ? 'Your checking account is open and ready.' : 'Your account is open.',
          when: 'Today',
          action: 'none',
        },
        {
          id: 'msg-bonus',
          needsAction: false,
          tone: 'info',
          icon: CalendarCheck,
          source: 'TD',
          title: 'Your $250 welcome bonus',
          body: 'It’s yours after $500 in direct deposits within 90 days.',
          when: 'Today',
          action: 'none',
        },
        {
          id: 'msg-alerts',
          needsAction: false,
          tone: 'info',
          icon: BellRing,
          source: 'TD',
          title: 'Pick your alerts',
          body: 'Choose what you’d like to hear about.',
          when: 'Today',
          cta: setup.items.find((i) => i.id === 'alerts')?.done ? undefined : 'Keep going',
          action: setup.items.find((i) => i.id === 'alerts')?.done ? 'none' : 'setup',
        },
      )
    }

    const items: NotificationItem[] = drafts.map((d) => ({ ...d, read: readNotifs.includes(d.id) }))
    const unreadActions = items.filter((i) => i.needsAction && !i.read).length
    return { items, unreadActions }
  }, [customerType, payees, transactions, subs, fraudBanner, rewardsBalance, accounts, readNotifs, devices, logins, setup])
}
