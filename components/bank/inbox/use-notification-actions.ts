'use client'

import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import type { NotificationAction, NotificationItem } from './use-notifications'

/** Runs a notification's action and marks it read, so it leaves the dashboard stack and the bell badge. */
export function useNotificationActions() {
  const { accounts, transactions, dispatch, setupDismissed } = useBank()
  const trust = useTrust()

  const perform = (action: NotificationAction) => {
    switch (action) {
      case 'security':
        trust.dispatch({ type: 'securityTab', tab: 'detect' })
        return dispatch({ type: 'overlay', overlay: 'security' })
      case 'bills':
        return dispatch({ type: 'overlay', overlay: 'billpay' })
      case 'subs':
        return dispatch({ type: 'overlay', overlay: 'subscriptions' })
      case 'fraud':
        dispatch({ type: 'overlay', overlay: null })
        return dispatch({ type: 'openFraudReport', preselect: transactions.find((t) => t.id.startsWith('zl-'))?.id })
      case 'setup':
        dispatch({ type: 'navigate', tab: setupDismissed ? 'more' : 'home' })
        return void requestAnimationFrame(() => document.getElementById('setup-h')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
      case 'rewards': {
        const card = accounts.find((a) => a.kind === 'credit')
        dispatch({ type: 'overlay', overlay: null })
        return card && dispatch({ type: 'openRewards', id: card.id })
      }
      case 'insights':
        return dispatch({ type: 'openInsights', tab: 'balance' })
      case 'doubleUp':
        dispatch({ type: 'overlay', overlay: null })
        return dispatch({ type: 'startOnboarding', productId: 'double-up' })
      case 'none':
        return
    }
  }

  const open = (item: NotificationItem) => {
    dispatch({ type: 'readNotifs', ids: [item.id] })
    perform(item.action)
  }

  return { open }
}
