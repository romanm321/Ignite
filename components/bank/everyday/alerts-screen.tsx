'use client'

import type { ReactNode } from 'react'
import { BellRing, Mail, MessageSquare, Moon, Smartphone } from 'lucide-react'
import { alertLabels, type AlertKey } from '@/lib/trust-data'
import type { AlertPrefs } from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { OverlayFrame } from '../overlay'
import { SectionHeader, Switch } from '../primitives'

function Row({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {body && <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>}
        </div>
      </div>
      {children}
    </li>
  )
}

function Chips({ value, options, onChange, label }: { value: number; options: number[]; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'min-h-11 flex-1 rounded-xl border text-sm font-semibold tabular-nums',
            value === o ? 'border-shield bg-shield text-shield-foreground' : 'bg-background',
          )}
        >
          ${o}
        </button>
      ))}
    </div>
  )
}

export function AlertsScreen() {
  const { alertPrefs: p, dispatch, notify } = useBank()
  const { alerts, dispatch: trustDispatch } = useTrust()
  const setAlert = (key: keyof typeof alerts, on: boolean) => trustDispatch({ type: 'alert', key, on })
  const set = (patch: Partial<AlertPrefs>, msg?: string) => {
    dispatch({ type: 'alertPrefs', patch })
    if (msg) notify(msg)
  }

  const toggle = (key: keyof AlertPrefs, title: string) => (
    <Switch
      checked={p[key] as boolean}
      label={title}
      onChange={(v) => set({ [key]: v } as Partial<AlertPrefs>, v ? `${title}: on. We’ll keep you posted.` : `${title}: off`)}
    />
  )

  return (
    <OverlayFrame title="Alerts" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-5">
        <div className="flex items-center gap-3 rounded-[14px] bg-accent/60 p-5">
          <BellRing className="size-7 shrink-0 text-primary" aria-hidden />
          <p className="text-pretty text-sm leading-relaxed text-accent-foreground">
            The heads-ups you actually want, and none of the noise. Change them anytime.
          </p>
        </div>

        <section aria-labelledby="money-alerts">
          <SectionHeader id="money-alerts" title="Your money" />
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
            <li className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Low balance</p>
                <p className="text-sm text-muted-foreground">When checking dips under ${p.lowBalanceAt}</p>
              </div>
              {toggle('lowBalance', 'Low balance alerts')}
            </li>
            {p.lowBalance && (
              <Row title="Nudge me below">
                <Chips label="Low balance threshold" value={p.lowBalanceAt} options={[100, 250, 500]} onChange={(n) => set({ lowBalanceAt: n })} />
              </Row>
            )}
            <li className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Money in</p>
                <p className="text-sm text-muted-foreground">Paychecks, deposits and transfers</p>
              </div>
              {toggle('deposits', 'Deposit alerts')}
            </li>
            <li className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Bills coming up</p>
                <p className="text-sm text-muted-foreground">3 days before anything is due</p>
              </div>
              {toggle('billsDue', 'Bill reminders')}
            </li>
            <li className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Subscription changes</p>
                <p className="text-sm text-muted-foreground">Price bumps and trials turning paid</p>
              </div>
              {toggle('subscriptionChanges', 'Subscription alerts')}
            </li>
            <li className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">Credit score changes</p>
                <p className="text-sm text-muted-foreground">Any move of 5 points or more</p>
              </div>
              {toggle('creditScore', 'Credit score alerts')}
            </li>
            <Row title="Big purchases" body="Ping me for card purchases over">
              <Chips
                label="Large purchase threshold"
                value={p.largePurchaseAt}
                options={[100, 250, 500, 1000]}
                onChange={(n) => set({ largePurchaseAt: n })}
              />
            </Row>
          </ul>
        </section>

        <section aria-labelledby="security-alerts">
          <SectionHeader id="security-alerts" title="Security" />
          <p className="mb-3 text-sm text-muted-foreground">Turn them all on and your security score goes Legendary.</p>
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
            {(Object.keys(alertLabels) as AlertKey[]).map((k) => (
              <li key={k} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{alertLabels[k].title}</p>
                  <p className="text-sm text-muted-foreground">{alertLabels[k].body}</p>
                </div>
                <Switch checked={alerts[k]} label={alertLabels[k].title} onChange={(v) => setAlert(k, v)} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="delivery">
          <SectionHeader id="delivery" title="How we reach you" />
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
            {(
              [
                ['push', 'Push notifications', 'Fastest. Recommended.', Smartphone],
                ['email', 'Email', 'maya.chen@gmail.com', Mail],
                ['sms', 'Text message', '•••• 0142 · message rates may apply', MessageSquare],
                ['quietHours', 'Quiet hours', '10pm–7am. Security alerts still get through.', Moon],
              ] as const
            ).map(([key, title, body, Icon]) => (
              <li key={key} className="flex items-center gap-3 p-4">
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
                {toggle(key, title)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </OverlayFrame>
  )
}
