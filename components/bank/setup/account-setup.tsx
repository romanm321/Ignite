'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { OverlayFrame } from '../overlay'
import { AchFlow, DirectDepositFlow, FundingChoose, WalletFundingFlow, type WalletKind } from '../auth/signup/funding-steps'
import { WalletIssuanceFlow, ZelleFlow } from '../auth/signup/setup-steps'
import { CARD, type FundingMethod, type FundingResult } from '../auth/signup/types'
import { AlertsSetupSheet, SubscriptionsSetupSheet } from './setup-sheets'
import { useAccountSetup, type SetupId } from './use-account-setup'

function FlowFrame({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const frame = (
    <OverlayFrame title={title} onBack={onBack}>
      <div className="flex flex-col gap-5 px-5 pb-8">{children}</div>
    </OverlayFrame>
  )
  // Render in the app-level overlay root so the frame covers the whole phone, not just the dashboard's scroll area.
  const target = typeof document === 'undefined' ? null : document.getElementById('phone-sheet-root')
  return target ? createPortal(frame, target) : frame
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`

export function AccountSetup({ placement = 'home' }: { placement?: 'home' | 'profile' }) {
  const { items, earned, total, completed, count } = useAccountSetup()
  const { virtualCards, dispatch, notify } = useBank()
  const { profile } = useTrust()
  const [active, setActive] = useState<SetupId | null>(null)
  const [fundMethod, setFundMethod] = useState<FundingMethod | null>(null)
  const [wallet, setWallet] = useState<WalletKind>('Apple Pay')
  const [showAll, setShowAll] = useState(false)
  const close = () => {
    setActive(null)
    setFundMethod(null)
  }
  const previousDone = useRef(new Set(items.filter((i) => i.done).map((i) => i.id)))

  // Finishing a step is a moment: applause and a short message, in place of a small banner at the top of the page.
  useEffect(() => {
    const fresh = items.filter((i) => i.done && !previousDone.current.has(i.id))
    previousDone.current = new Set(items.filter((i) => i.done).map((i) => i.id))
    if (fresh.length === 0) return
    if (completed === count) {
      dispatch({
        type: 'celebrate',
        celebration: { kind: 'win', title: 'You’re all set up', body: `Every step is done. You earned ${money(total)} along the way.` },
      })
      return
    }
    const reward = fresh.reduce((s, i) => s + i.reward, 0)
    dispatch({
      type: 'celebrate',
      celebration: {
        kind: 'clap',
        title: 'Well done!',
        body: `Nice work on “${fresh[0].title}”.${reward > 0 ? ` ${money(reward)} just landed in your checking account.` : ''} ${completed} of ${count} steps complete.`,
      },
    })
  }, [items, completed, count, total, dispatch])

  const pct = Math.round((earned / total) * 100)
  const allDone = completed === count
  const onProfile = placement === 'profile'
  const pending = items.filter((i) => !i.done)
  const visible = showAll || onProfile ? items : pending.slice(0, 3)

  const fundDone = (r: FundingResult) => {
    dispatch({ type: 'fundChecking', amount: r.posted, label: r.label })
    dispatch({ type: 'setupDone', id: 'fund' })
    close()
  }

  return (
    <>
      <section aria-labelledby="setup-h" className="overflow-hidden rounded-3xl bg-card">
        <div className="flex items-center gap-3 bg-[#9cd2dc] py-3 pl-3 pr-1 text-[#0b2e33]">
          <div
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(#064d1b ${pct * 3.6}deg, rgb(11 46 51 / 0.22) 0deg)` }}
            role="img"
            aria-label={`${completed} of ${count} setup steps done`}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[#9cd2dc] font-mono text-xs font-bold">
              {completed}/{count}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="setup-h" className="truncate text-base font-bold leading-tight">
              {allDone ? 'You’re all set' : 'Finish setting up'}
            </h2>
            <p className="truncate text-sm">
              <span className="tabular font-mono">
                {money(earned)} of {money(total)}
              </span>{' '}
              earned
            </p>
          </div>
          {!onProfile && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'setupDismissed', dismissed: true })
                notify('Account setup moved to Settings, under your profile')
              }}
              aria-label="Dismiss account setup. You can find it in Settings"
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#0b2e33]"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {visible.length > 0 && (
          <ul className="divide-y">
            {visible.map((item) => {
              const Icon = item.icon
              const marker = (
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    item.done ? 'bg-lime text-lime-foreground' : 'border-2 border-dashed border-muted-foreground/40 text-muted-foreground',
                  )}
                >
                  {item.done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                </span>
              )
              return (
                <li key={item.id}>
                  {item.done ? (
                    <div className="flex min-h-12 items-center gap-3 px-3 py-2">
                      {marker}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                        <span className="sr-only">Completed: </span>
                        {item.title}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">{money(item.reward)} earned</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActive(item.id)}
                      aria-label={`${item.title}. Earn ${money(item.reward)}`}
                      className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left active:bg-muted/60"
                    >
                      {marker}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">+{money(item.reward)}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {onProfile ? (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'setupDismissed', dismissed: false })
              notify('Account setup is back on your homepage')
            }}
            className="flex min-h-11 w-full items-center justify-center border-t text-sm font-medium text-primary"
          >
            Show on homepage
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            aria-expanded={showAll}
            className="flex min-h-11 w-full items-center justify-center gap-1 border-t text-sm font-medium text-primary"
          >
            {showAll ? 'Show fewer' : `Show all ${count} steps`}
            <ChevronDown className={cn('size-4 transition-transform', showAll && 'rotate-180')} aria-hidden />
          </button>
        )}
      </section>

      {active === 'fund' && (
        <FlowFrame title="Fund your account" onBack={fundMethod ? () => setFundMethod(null) : close}>
          {!fundMethod && (
            <FundingChoose
              skipLabel="Not now"
              onSkip={close}
              onPick={(m, w) => {
                setFundMethod(m)
                if (w) setWallet(w)
              }}
            />
          )}
          {fundMethod === 'wallet' && <WalletFundingFlow initialWallet={wallet} onDone={fundDone} />}
          {fundMethod === 'ach' && <AchFlow onDone={fundDone} />}
          {fundMethod === 'direct-deposit' && (
            <DirectDepositFlow
              employerName=""
              onDone={() => {
                dispatch({ type: 'setupDone', id: 'directDeposit' })
                dispatch({ type: 'setupDone', id: 'fund' })
                close()
              }}
            />
          )}
        </FlowFrame>
      )}
      {active === 'zelle' && (
        <FlowFrame title="Turn on Zelle" onBack={close}>
          <ZelleFlow
            phone={profile.phone}
            email={profile.email}
            onDone={() => {
              dispatch({ type: 'setupDone', id: 'zelle' })
              close()
            }}
          />
        </FlowFrame>
      )}
      {active === 'wallet' && (
        <FlowFrame title="Add card to wallet" onBack={close}>
          <WalletIssuanceFlow
            onDone={(result) => {
              if (!virtualCards.some((c) => c.id === 'vc-ava')) {
                dispatch({ type: 'virtualCard', card: { id: 'vc-ava', label: 'Debit card', last4: CARD.last4, singleUse: false, used: false } })
              }
              if (result.wallet) dispatch({ type: 'setupDone', id: 'wallet' })
              close()
            }}
          />
        </FlowFrame>
      )}
      {active === 'alerts' && <AlertsSetupSheet onClose={close} />}
      {active === 'subscriptions' && <SubscriptionsSetupSheet onClose={close} />}
    </>
  )
}
