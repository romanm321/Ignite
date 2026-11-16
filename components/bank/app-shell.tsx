'use client'

import { Activity, useEffect } from 'react'
import { BillPayScreen } from './everyday/bill-pay-screen'
import { SendMoneyScreen } from './everyday/send-money-screen'
import { MoveMoneyScreen } from './everyday/move-money-screen'
import { NotificationCenter } from './inbox/notification-center'
import { DepositScreen } from './everyday/deposit-screen'
import { AlertsScreen } from './everyday/alerts-screen'
import { CreditScreen } from './everyday/credit-screen'
import { AccessibilityScreen } from './everyday/accessibility-screen'
import { ExploreAccountsScreen } from './products/explore-accounts-screen'
import { InvestScreen } from './invest/invest-screen'
import { FamilyScreen } from './family/family-screen'
import { CelebrationOverlay } from './celebrate'
import { LegendaryWatcher } from './security/legendary-watcher'
import { FraudNotification } from './security/fraud-notification'
import { ReportFraudSheet } from './security/report-fraud-sheet'
import { ArrowLeftRight, Gift, House, Sprout } from 'lucide-react'
import { TediIcon } from './tedi-icon'
import { PayScreen } from './screens/pay-screen'
import { SettingsScreen } from './screens/more-screen'
import { RewardsScreen } from './screens/rewards-screen'
import { cn } from '@/lib/utils'
import { useBank, type Tab } from './bank-provider'
import { HomeScreen } from './screens/home-screen'
import { CardsScreen } from './screens/cards-screen'
import { GrowScreen } from './screens/grow-screen'
import { SageScreen } from './screens/sage-screen'
import { BranchesScreen } from './screens/branches-screen'
import { SecurityScreen } from './screens/security-screen'
import { OnboardingFlow } from './onboarding/onboarding-flow'
import { SubscriptionsScreen } from './screens/subscriptions-screen'
import { TransactionDetail } from './transactions/transaction-detail'
import { AccountDetail } from './accounts/account-detail'
import { RewardsHub } from './rewards/rewards-hub'
import { VaultDetail } from './vaults/vault-detail'
import { AuthScreen } from './auth/auth-screen'

const tabs: { id: Tab; label: string; icon: typeof House; includes?: Tab[] }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'grow', label: 'Plan', icon: Sprout },
  { id: 'pay', label: 'Pay & Transfer', icon: ArrowLeftRight },
  { id: 'rewards', label: 'Benefits', icon: Gift, includes: ['cards'] },
  { id: 'sage', label: 'Tedi', icon: TediIcon },
]

export function AppShell() {
  const { auth, tab, overlay, accountId, rewardsId, vaultId, txnId, toast, a11y, fraudReport, dispatch } = useBank()
  const layered = Boolean(overlay || accountId || rewardsId || vaultId || txnId)

  const goToTab = (id: Tab) => {
    if (tab !== id || layered) dispatch({ type: 'navigate', tab: id })
    // Wait for the Activity to become visible; hidden (display: none) scrollers ignore scrollTop.
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>(`[data-tab-screen="${id}"] .overflow-y-auto`)
        .forEach((el) => el.scrollTo({ top: 0 }))
    })
  }

  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = a11y.textSize === 'xl' ? '20px' : a11y.textSize === 'large' ? '18px' : ''
    return () => {
      root.style.fontSize = ''
    }
  }, [a11y.textSize])

  if (auth === 'signed-out') return <AuthScreen />

  return (
    <div
      className={cn(
        'relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background text-foreground',
        a11y.highContrast && 'a11y-contrast',
        a11y.reduceMotion && 'a11y-calm',
      )}
    >
      <LegendaryWatcher />
      <div className="relative flex-1 overflow-hidden">
        <Activity mode={tab === 'home' ? 'visible' : 'hidden'}>
          <div data-tab-screen="home" className="contents">
            <HomeScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'cards' ? 'visible' : 'hidden'}>
          <div data-tab-screen="cards" className="contents">
            <CardsScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'pay' ? 'visible' : 'hidden'}>
          <div data-tab-screen="pay" className="contents">
            <PayScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'more' ? 'visible' : 'hidden'}>
          <div data-tab-screen="more" className="contents">
            <SettingsScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'rewards' ? 'visible' : 'hidden'}>
          <div data-tab-screen="rewards" className="contents">
            <RewardsScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'sage' ? 'visible' : 'hidden'}>
          <div data-tab-screen="sage" className="contents">
            <SageScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'grow' ? 'visible' : 'hidden'}>
          <div data-tab-screen="grow" className="contents">
            <GrowScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'branches' ? 'visible' : 'hidden'}>
          <div data-tab-screen="branches" className="contents">
            <BranchesScreen />
          </div>
        </Activity>

        {overlay === 'security' && <SecurityScreen />}
        <AccountDetail />
        <RewardsHub />
        <VaultDetail />
        {overlay === 'subscriptions' && <SubscriptionsScreen />}
        {overlay === 'billpay' && <BillPayScreen />}
        {overlay === 'send' && <SendMoneyScreen rail="zelle" />}
        {overlay === 'wire' && <SendMoneyScreen rail="wire" />}
        {overlay === 'move' && <MoveMoneyScreen />}
        {overlay === 'inbox' && <NotificationCenter />}
        {overlay === 'deposit' && <DepositScreen />}
        {overlay === 'alerts' && <AlertsScreen />}
        {overlay === 'credit' && <CreditScreen />}
        {overlay === 'accessibility' && <AccessibilityScreen />}
        {overlay === 'explore' && <ExploreAccountsScreen />}
        {overlay === 'invest' && <InvestScreen />}
        {overlay === 'family' && <FamilyScreen />}
        <TransactionDetail />
        <OnboardingFlow />

        <div id="phone-sheet-root" className="contents" />
        {fraudReport && <ReportFraudSheet preselect={fraudReport.preselect} onClose={() => dispatch({ type: 'closeFraudReport' })} />}
        <CelebrationOverlay />
        <FraudNotification />

        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-4 top-4 z-50 rounded-2xl bg-forest px-4 py-3 text-sm font-medium text-forest-foreground shadow-lg animate-in fade-in slide-in-from-top-2"
          >
            {toast}
          </div>
        )}
      </div>

      <nav
        aria-label="Primary"
        className="relative z-[60] border-t bg-card/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur"
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ id, label, icon: Icon, includes }) => {
            const active = tab === id || !!includes?.includes(tab)
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => goToTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 w-full flex-col items-center justify-center gap-1 px-0.5 pt-2 text-[11px] font-medium leading-tight transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      active && 'bg-accent',
                    )}
                  >
                    <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
