'use client'

import { useState } from 'react'
import { CreditCard, Lock, PiggyBank, Receipt, TrendingUp, type LucideIcon } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { useInsights } from '../insights/use-insights'

export type NextAction = {
  id: string
  rank: number
  icon: LucideIcon
  eyebrow: string
  title: string
  why: string
  impact: string
  cta: string
  run: () => void
}

const whole = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const CHECKING_CUSHION = 3000

function dueText(days: number) {
  return days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
}

/** Picks the one thing TD can help with next. Skipping it brings up the next best. */
export function useNextBestAction(masked: boolean): { main: NextAction | null; skip: (id: string) => void } {
  const { customerType, accounts, vaults, payees, rewardsBalance, invest, owned, dispatch, notify } = useBank()
  const trust = useTrust()
  const { cycle } = useInsights()
  const [skipped, setSkipped] = useState<string[]>([])
  const skip = (id: string) => setSkipped((s) => [...s, id])

  if (customerType === 'new') return { main: null, skip }

  const money = (n: number) => (masked ? '••••' : whole(n))
  const actions: NextAction[] = []

  const checking = accounts.find((a) => a.id === 'chk')
  const rainy = vaults.find((v) => v.id === 'emergency')
  if (checking && rainy) {
    const spare = checking.balance - CHECKING_CUSHION - cycle.committedTotal
    const room = rainy.goal - rainy.balance
    const amount = Math.floor(Math.min(spare, room) / 500) * 500
    if (amount >= 500) {
      actions.push({
        id: 'idle-cash',
        rank: 90,
        icon: PiggyBank,
        eyebrow: 'Make it earn',
        title: `Move ${money(amount)} to your ${rainy.name} and earn about ${money((amount * rainy.apy) / 100)} more a year.`,
        why: `It’s sitting in checking. Your ${rainy.name} pays ${rainy.apy.toFixed(2)}% interest today (a variable rate).`,
        impact: `About ${money((amount * rainy.apy) / 100)} more a year`,
        cta: 'Move money',
        run: () => {
          dispatch({ type: 'vaultTransfer', vaultId: rainy.id, amount })
          notify(`Done. ${whole(amount)} is on its way to ${rainy.name}.`)
        },
      })
    }
  }

  const billToAutomate = payees.filter((p) => !p.paid && !p.autopay && p.dueIn <= 7).sort((a, b) => a.dueIn - b.dueIn)[0]
  if (billToAutomate) {
    actions.push({
      id: `autopay-${billToAutomate.id}`,
      rank: 80,
      icon: Receipt,
      eyebrow: 'Never miss one',
      title: `${billToAutomate.name} is due ${dueText(billToAutomate.dueIn)}. Want us to pay it every month?`,
      why: `${masked ? 'It' : formatMoney(billToAutomate.amountDue)} is due ${dueText(billToAutomate.dueIn)}. Turn this on and it’s handled every month.`,
      impact: 'No more late fees',
      cta: 'Turn it on',
      run: () => {
        dispatch({ type: 'payeeAutopay', id: billToAutomate.id, on: true })
        notify(`Done. We’ll pay ${billToAutomate.name} for you.`)
      },
    })
  }

  const card = accounts.find((a) => a.kind === 'credit')
  if (card && rewardsBalance > 0) {
    actions.push({
      id: 'cash-back',
      rank: 60,
      icon: CreditCard,
      eyebrow: 'Yours to use',
      title: `You have ${money(rewardsBalance)} cash back ready to use on your card bill or checking.`,
      why: 'Use it on your card bill, or send it to checking.',
      impact: 'Money you’ve already earned',
      cta: 'Cash it in',
      run: () => dispatch({ type: 'openRewards', id: card.id }),
    })
  }

  const nextFix = trust.checklist.find((c) => !c.done)
  if (nextFix) {
    actions.push({
      id: `security-${nextFix.id}`,
      rank: 50,
      icon: Lock,
      eyebrow: 'Stay safe',
      title: nextFix.title,
      why: nextFix.why,
      impact: `+${nextFix.points} security points`,
      cta: 'Fix it',
      run: () => {
        trust.dispatch({ type: 'securityTab', tab: nextFix.tab })
        dispatch({ type: 'overlay', overlay: 'security' })
      },
    })
  }

  if (!invest.opened && !owned.includes('auto-invest')) {
    actions.push({
      id: 'invest',
      rank: 40,
      icon: TrendingUp,
      eyebrow: 'Grow it',
      title: 'Start investing from $5 with a portfolio built around your goals.',
      why: 'A portfolio built around your goals. It counts toward your status too.',
      impact: 'Extra cash earns more',
      cta: 'Get started',
      run: () => dispatch({ type: 'startOnboarding', productId: 'auto-invest' }),
    })
  }

  const main = actions.filter((a) => !skipped.includes(a.id)).sort((a, b) => b.rank - a.rank)[0] ?? null
  return { main, skip }
}
