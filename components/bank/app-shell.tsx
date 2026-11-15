'use client'

import { Activity, useEffect } from 'react'
import { BillPayScreen } from './everyday/bill-pay-screen'
import { SendMoneyScreen } from './everyday/send-money-screen'
import { DepositScreen } from './everyday/deposit-screen'
import { AlertsScreen } from './everyday/alerts-screen'
import { CreditScreen } from './everyday/credit-screen'
import { AccessibilityScreen } from './everyday/accessibility-screen'
import { ExploreAccountsScreen } from './products/explore-accounts-screen'
import { InvestScreen } from './invest/invest-screen'
import { FamilyScreen } from './family/family-screen'
import { CelebrationOverlay } from './celebrate'
import { CapgoUpdater } from './capgo-updater'
import { LegendaryWatcher } from './security/legendary-watcher'
import { ArrowLeftRight, House, Menu, Sprout, Wallet } from 'lucide-react'
import { AccountsScreen } from './screens/accounts-screen'
import { PayScreen } from './screens/pay-screen'
import { MoreScreen } from './screens/more-screen'
import { cn } from '@/lib/utils'
import { useBank, type Tab } from './bank-provider'
import { HomeScreen } from './screens/home-screen'
import { CardsScreen } from './screens/cards-screen'
import { GrowScreen } from './screens/grow-screen'
import { SageScreen } from './screens/sage-screen'
import { BranchesScreen } from './screens/branches-screen'
import { GlobalScreen } from './screens/global-screen'
import { ProfileScreen } from './screens/profile-screen'
import { SecurityScreen } from './screens/security-screen'
import { OnboardingFlow } from './onboarding/onboarding-flow'
import { SubscriptionsScreen } from './screens/subscriptions-screen'
import { TransactionDetail } from './transactions/transaction-detail'
import { AccountDetail } from './accounts/account-detail'
import { RewardsHub } from './rewards/rewards-hub'
import { VaultDetail } from './vaults/vault-detail'

const tabs: { id: Tab; label: string; icon: typeof House; includes?: Tab[] }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'accounts', label: 'Accounts', icon: Wallet, includes: ['cards'] },
  { id: 'pay', label: 'Pay & Transfer', icon: ArrowLeftRight },
  { id: 'grow', label: 'Grow', icon: Sprout },
  { id: 'more', label: 'More', icon: Menu, includes: ['branches'] },
]

export function AppShell() {
  const { tab, overlay, accountId, rewardsId, vaultId, txnId, toast, a11y, dispatch } = useBank()
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

  return (
    <div
      className={cn(
        'relative flex h-dvh w-full flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] text-foreground',
        a11y.highContrast && 'a11y-contrast',
        a11y.reduceMotion && 'a11y-calm',
      )}
    >
      <CapgoUpdater />
      <LegendaryWatcher />
      <div className="relative flex-1 overflow-hidden">
        <Activity mode={tab === 'home' ? 'visible' : 'hidden'}>
          <div data-tab-screen="home" className="contents">
            <HomeScreen />
          </div>
        </Activity>
        <Activity mode={tab === 'accounts' ? 'visible' : 'hidden'}>
          <div data-tab-screen="accounts" className="contents">
            <AccountsScreen />
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
            <MoreScreen />
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

        {overlay === 'global' && <GlobalScreen />}
        {overlay === 'profile' && <ProfileScreen />}
        {overlay === 'security' && <SecurityScreen />}
        <AccountDetail />
        <RewardsHub />
        <VaultDetail />
        {overlay === 'subscriptions' && <SubscriptionsScreen />}
        {overlay === 'billpay' && <BillPayScreen />}
        {overlay === 'send' && <SendMoneyScreen />}
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
        <CelebrationOverlay />

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
        className="relative z-40 border-t bg-card/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur"
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
                  <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', active && 'bg-accent')}>
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
