'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  FileWarning,
  MapPin,
  MessageCircleWarning,
  Phone,
  ShieldAlert,
  Snowflake,
} from 'lucide-react'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { ScreenHeader, SectionHeader, Switch } from '../primitives'
import { HeaderActions, LinkRow, SubNav, moreSubNav } from '../nav'
import { HelpSearch } from '../help/help-search'
import { ReportFraudSheet } from '../security/report-fraud-sheet'
import { ProfileSettings } from './profile-screen'
import { FamilyUserToggle } from '../family/family-user-toggle'
import { AccountSetup } from '../setup/account-setup'
import { TediIcon } from '../tedi-icon'

export function SettingsScreen() {
  const { cardFrozen, disputes, dispatch, notify, customerType, setupDismissed } = useBank()
  const trust = useTrust()
  const [reporting, setReporting] = useState(false)
  const openCases = Object.keys(disputes).length

  const openSecurity = (tab: 'detect' | 'resolve') => {
    trust.dispatch({ type: 'securityTab', tab })
    dispatch({ type: 'overlay', overlay: 'security' })
  }

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Settings" subtitle="Help and your details" right={<HeaderActions />} />
      <SubNav label="Settings sections" items={moreSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <ProfileSettings
          identitySlot={<FamilyUserToggle />}
          midSlot={
            <>
              {customerType === 'new' && setupDismissed && <AccountSetup placement="profile" />}

              <button
                type="button"
                onClick={() => dispatch({ type: 'navigate', tab: 'sage' })}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-forest p-3 pr-4 text-left text-forest-foreground"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
                  <TediIcon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">Chat with Tedi</span>
                  <span className="block text-xs text-forest-foreground/70">Your AI banker · answers in seconds, 24/7</span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-lime" aria-hidden />
              </button>

              <HelpSearch />

              <section aria-labelledby="fraud-h" className="flex flex-col gap-3">
                <SectionHeader id="fraud-h" title="Fraud & disputes" />
                <ul className="divide-y overflow-hidden rounded-3xl bg-card">
                  <LinkRow icon={ShieldAlert} title="Report fraud" body="Lock, replace and get your money back" onClick={() => setReporting(true)} />
                  <LinkRow
                    icon={FileWarning}
                    title="Dispute a charge"
                    body={openCases ? `${openCases} open case${openCases === 1 ? '' : 's'} · track progress` : 'Wrong amount, never arrived, charged twice'}
                    onClick={() => openSecurity('resolve')}
                  />
                  <LinkRow
                    icon={MessageCircleWarning}
                    title="Security alerts"
                    body="1 needs review · logins, devices, suspicious activity"
                    onClick={() => openSecurity('detect')}
                  />
                  <li className="flex min-h-16 items-center gap-3 px-4 py-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
                      <Snowflake className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{cardFrozen ? 'Card frozen' : 'Freeze my card'}</span>
                      <span className="block text-xs text-muted-foreground">Instantly block new purchases. Unfreeze any time.</span>
                    </span>
                    <Switch
                      checked={cardFrozen}
                      label="Freeze card"
                      onChange={(frozen) => {
                        dispatch({ type: 'freeze', frozen })
                        notify(frozen ? 'Card frozen. Nobody’s using it but you.' : 'Card’s back in action')
                      }}
                    />
                  </li>
                </ul>
              </section>
            </>
          }
          helpSlot={
            <section aria-labelledby="help-h" className="flex flex-col gap-3">
              <SectionHeader id="help-h" title="Help & visits" />
              <ul className="divide-y overflow-hidden rounded-3xl bg-card">
                <LinkRow
                  icon={MapPin}
                  title="Branches & ATMs"
                  body="Live wait times, join the line"
                  onClick={() => dispatch({ type: 'navigate', tab: 'branches' })}
                />
                <LinkRow
                  icon={CalendarClock}
                  title="Book an appointment"
                  body="Meet an advisor in person or by video"
                  onClick={() => dispatch({ type: 'navigate', tab: 'branches' })}
                />
                <li>
                  <a href="tel:18887511777" className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
                      <Phone className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">Call us</span>
                      <span className="block text-xs text-muted-foreground">Real humans, 24/7</span>
                    </span>
                  </a>
                </li>
              </ul>
            </section>
          }
        />
      </div>

      {reporting && <ReportFraudSheet onClose={() => setReporting(false)} />}
    </div>
  )
}
