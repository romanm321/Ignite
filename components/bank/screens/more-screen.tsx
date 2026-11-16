'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
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

const DEFAULT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
const DEFAULT_BUNDLE_VERSION = process.env.NEXT_PUBLIC_CAPGO_BUNDLE_VERSION || '1.0.3'
const DEFAULT_RELEASE_ISO = process.env.NEXT_PUBLIC_CAPGO_RELEASE_DATE || '2026-11-16T15:35:00.000Z'

function formatReleaseDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function MoreScreen() {
  const { streetSafe, dispatch, notify } = useBank()
  const trust = useTrust()
  const open = (overlay: Overlay) => dispatch({ type: 'overlay', overlay })

  const [versionInfo, setVersionInfo] = useState({
    appVersion: DEFAULT_APP_VERSION,
    capgoVersion: DEFAULT_BUNDLE_VERSION,
    releaseDate: formatReleaseDate(DEFAULT_RELEASE_ISO),
    channel: 'dev',
  })

  useEffect(() => {
    setVersionInfo((prev) => ({
      ...prev,
      releaseDate: formatReleaseDate(DEFAULT_RELEASE_ISO),
    }))

    if (!Capacitor.isNativePlatform()) return

    Promise.all([
      CapacitorUpdater.current().catch(() => null),
      CapacitorUpdater.getChannel().catch(() => null),
    ]).then(([currentRes, channelRes]) => {
      setVersionInfo((prev) => ({
        appVersion: currentRes?.native || prev.appVersion,
        capgoVersion:
          currentRes?.bundle?.version && currentRes.bundle.version !== 'builtin'
            ? currentRes.bundle.version
            : prev.capgoVersion,
        releaseDate:
          currentRes?.bundle?.downloaded && currentRes.bundle.downloaded !== ''
            ? formatReleaseDate(currentRes.bundle.downloaded)
            : prev.releaseDate,
        channel: channelRes?.channel || prev.channel,
      }))
    })
  }, [])

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

        <div className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground/80">
            App Version: <span className="tabular font-mono font-semibold">v{versionInfo.appVersion}</span>
          </p>
          <p>
            CapGo Version: <span className="tabular font-mono font-semibold text-primary">v{versionInfo.capgoVersion}</span>{' '}
            <span className="opacity-75">({versionInfo.channel})</span>
          </p>
          <p>
            CapGo Release: <span className="tabular font-mono">{versionInfo.releaseDate}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
