'use client'

import {
  Accessibility,
  BellRing,
  CalendarClock,
  Compass,
  LogOut,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { STREET_SAFE_CAP, useBank, type Overlay } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { ScreenHeader, SectionHeader, Switch } from '../primitives'
import { LinkRow, SubNav, TediButton, moreSubNav } from '../nav'
import { scoreLabel } from './security-screen'

export function MoreScreen() {
  const { streetSafe, dispatch, notify } = useBank()
  const trust = useTrust()
  const open = (overlay: Overlay) => dispatch({ type: 'overlay', overlay })

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="More" subtitle="Settings, help & services" right={<TediButton />} />
      <SubNav label="More sections" items={moreSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <button
          type="button"
          onClick={() => open('profile')}
          className="flex items-center gap-3 rounded-3xl bg-forest p-4 text-left text-forest-foreground"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
            <UserRound className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{trust.profile.preferredName}&apos;s profile & settings</span>
            <span className="block text-sm text-forest-foreground/70">Personal info, Street Safe, accessibility</span>
          </span>
        </button>

        <section aria-labelledby="safety-h" className="flex flex-col gap-3">
          <SectionHeader id="safety-h" title="Security & privacy" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <LinkRow
              icon={ShieldCheck}
              title="Security hub"
              body={`Score ${trust.score} · ${scoreLabel(trust.score)}`}
              onClick={() => open('security')}
            />
            <li className="flex min-h-16 items-center gap-3 px-4 py-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Street Safe</span>
                <span className="block text-xs text-muted-foreground">Hide balances, cap sends at ${STREET_SAFE_CAP}</span>
              </span>
              <Switch
                checked={streetSafe}
                label="Street Safe"
                onChange={(on) => {
                  dispatch({ type: 'streetSafe', on })
                  notify(on ? `Street Safe on. Balances hidden, sends capped at $${STREET_SAFE_CAP}.` : 'Street Safe is off. Welcome back.')
                }}
              />
            </li>
            <LinkRow icon={BellRing} title="Alerts" body="Low balance, big purchases, bills" onClick={() => open('alerts')} />
          </ul>
        </section>

        <section aria-labelledby="help-h" className="flex flex-col gap-3">
          <SectionHeader id="help-h" title="Help & visits" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <LinkRow
              icon={Sparkles}
              title="Ask Tedi"
              body="Your AI banker, any time"
              onClick={() => dispatch({ type: 'navigate', tab: 'sage' })}
            />
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

        <section aria-labelledby="settings-h" className="flex flex-col gap-3">
          <SectionHeader id="settings-h" title="App settings" />
          <ul className="divide-y overflow-hidden rounded-3xl bg-card">
            <LinkRow
              icon={Accessibility}
              title="Accessibility"
              body="Text size, contrast, motion, read-aloud"
              onClick={() => open('accessibility')}
            />
            <LinkRow icon={Compass} title="Explore TD products" body="Accounts, cards, CDs & more" onClick={() => open('explore')} />
          </ul>
        </section>

        <button
          type="button"
          onClick={() => notify('Signed out of all sessions on this device')}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold text-destructive"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  )
}
