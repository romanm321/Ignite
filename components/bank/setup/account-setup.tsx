'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { OverlayFrame } from '../overlay'
import { DirectDepositFlow } from '../auth/signup/funding-steps'
import { WalletIssuanceFlow, ZelleFlow } from '../auth/signup/setup-steps'
import { CARD } from '../auth/signup/types'
import { AlertsSetupSheet, PaperlessSheet, PaymentSwitchSheet, SavingsSheet, SecuritySheet } from './setup-sheets'
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

export function AccountSetup({ placement = 'home' }: { placement?: 'home' | 'profile' }) {
  const { items, earned, total, completed, count, level } = useAccountSetup()
  const { virtualCards, dispatch, notify } = useBank()
  const { profile } = useTrust()
  const [active, setActive] = useState<SetupId | null>(null)
  const [showAll, setShowAll] = useState(false)
  const close = () => setActive(null)
  const previous = useRef(completed)

  useEffect(() => {
    if (previous.current < count && completed === count) {
      dispatch({
        type: 'celebrate',
        celebration: { kind: 'win', title: 'Account setup complete!', body: 'Every setup step is done. Your account is protected, connected and ready for anything.' },
      })
    }
    previous.current = completed
  }, [completed, count, dispatch])

  const pct = Math.round((earned / total) * 100)
  const allDone = completed === count
  const onProfile = placement === 'profile'
  const pending = items.filter((i) => !i.done)
  const visible = showAll || onProfile ? items : pending.slice(0, 3)

  return (
    <>
      <section aria-labelledby="setup-h" className="overflow-hidden rounded-3xl bg-card">
        <div className="flex items-center gap-3 bg-forest py-2.5 pl-3 pr-1 text-forest-foreground">
          <div
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(var(--lime) ${pct * 3.6}deg, rgb(255 255 255 / 0.15) 0deg)` }}
            role="img"
            aria-label={`${completed} of ${count} setup steps done`}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-forest font-mono text-[11px] font-semibold">
              {completed}/{count}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="setup-h" className="truncate text-sm font-semibold leading-tight">
              {allDone ? 'You’re all set, Ava' : 'Finish setting up your account'}
            </h2>
            <p className="truncate text-xs text-forest-foreground/70">
              <span className="tabular font-mono">
                {earned} / {total}
              </span>{' '}
              pts · {level}
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
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-forest-foreground/70"
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
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActive(item.id)}
                      aria-label={`${item.title}. Worth ${item.points} points`}
                      className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left active:bg-muted/60"
                    >
                      {marker}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">+{item.points}</span>
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

      {active === 'zelle' && (
        <FlowFrame title="Enroll in Zelle" onBack={close}>
          <ZelleFlow
            phone={profile.phone}
            email={profile.email}
            onDone={() => {
              dispatch({ type: 'setupDone', id: 'zelle' })
              notify('You’re enrolled in Zelle')
              close()
            }}
          />
        </FlowFrame>
      )}
      {active === 'wallet' && (
        <FlowFrame title="Add to a digital wallet" onBack={close}>
          <WalletIssuanceFlow
            onDone={(result) => {
              if (!virtualCards.some((c) => c.id === 'vc-ava')) {
                dispatch({ type: 'virtualCard', card: { id: 'vc-ava', label: 'Debit card', last4: CARD.last4, singleUse: false, used: false } })
              }
              if (result.wallet) {
                dispatch({ type: 'setupDone', id: 'wallet' })
                notify('Your debit card is in your wallet')
              }
              close()
            }}
          />
        </FlowFrame>
      )}
      {active === 'directDeposit' && (
        <FlowFrame title="Set up direct deposit" onBack={close}>
          <DirectDepositFlow
            employerName=""
            onDone={() => {
              dispatch({ type: 'setupDone', id: 'directDeposit' })
              notify('Direct deposit is set up')
              close()
            }}
          />
        </FlowFrame>
      )}
      {active === 'security' && <SecuritySheet onClose={close} />}
      {active === 'alerts' && <AlertsSetupSheet onClose={close} />}
      {active === 'paperless' && <PaperlessSheet onClose={close} />}
      {active === 'paymentSwitch' && <PaymentSwitchSheet onClose={close} />}
      {active === 'savings' && <SavingsSheet onClose={close} />}
    </>
  )
}
