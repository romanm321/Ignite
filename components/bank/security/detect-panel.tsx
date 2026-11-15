'use client'

import { AlertTriangle, Laptop, Smartphone, Tablet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alertLabels, type AlertKey } from '@/lib/trust-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Pill, SectionHeader, Switch } from '../primitives'

const deviceIcon = { phone: Smartphone, laptop: Laptop, tablet: Tablet }

export function DetectPanel() {
  const { notify } = useBank()
  const { devices, logins, alerts, dispatch } = useTrust()
  const unknown = devices.find((d) => !d.trusted)

  return (
    <div className="flex flex-col gap-6">
      {unknown && (
        <div role="alert" className="flex flex-col gap-3 rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-semibold">Was this you?</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {unknown.name} in {unknown.location} signed in {unknown.lastActive} with only a password.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'removeDevice', id: unknown.id })
                notify('Device signed out · reset your password next')
              }}
              className="h-11 flex-1 rounded-xl bg-destructive text-sm font-semibold text-white"
            >
              No, sign it out
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'trustDevice', id: unknown.id })
                notify('Marked as trusted')
              }}
              className="h-11 flex-1 rounded-xl bg-card text-sm font-semibold"
            >
              Yes, it was me
            </button>
          </div>
        </div>
      )}

      <section aria-labelledby="devices-h" className="flex flex-col gap-3">
        <SectionHeader id="devices-h" title="Signed-in devices" />
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          {devices.map((d) => {
            const Icon = deviceIcon[d.kind]
            return (
              <li key={d.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    d.trusted ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {d.name}
                    {d.current && <Pill className="bg-lime text-lime-foreground">This device</Pill>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.location} · {d.lastActive}
                  </p>
                </div>
                {!d.current && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'removeDevice', id: d.id })
                      notify(`${d.name} signed out`)
                    }}
                    className="h-11 rounded-xl px-3 text-sm font-medium text-destructive"
                  >
                    Remove
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="activity-sec-h" className="flex flex-col gap-3">
        <SectionHeader id="activity-sec-h" title="Sign-in activity" />
        <ol className="flex flex-col rounded-3xl bg-card px-4 py-2">
          {logins.map((l, i) => (
            <li key={l.id} className="relative flex gap-3 py-3">
              {i < logins.length - 1 && <span aria-hidden className="absolute left-[5px] top-7 h-full w-px bg-border" />}
              <span
                aria-hidden
                className={cn('mt-1.5 size-[11px] shrink-0 rounded-full', l.flagged ? 'bg-destructive' : 'bg-primary')}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {l.device} · {l.location}
                </p>
                <p className="text-xs text-muted-foreground">
                  {l.when} · {l.method}
                  {l.flagged && <span className="font-semibold text-destructive"> · Unusual</span>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="alerts-h" className="flex flex-col gap-3">
        <SectionHeader id="alerts-h" title="Fraud alerts" />
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          {(Object.keys(alertLabels) as AlertKey[]).map((key) => (
            <li key={key} className="flex min-h-16 items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{alertLabels[key].title}</p>
                <p className="text-xs text-muted-foreground">{alertLabels[key].body}</p>
              </div>
              <Switch
                checked={alerts[key]}
                label={alertLabels[key].title}
                onChange={(on) => dispatch({ type: 'alert', key, on })}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            ;(Object.keys(alertLabels) as AlertKey[]).forEach((key) => dispatch({ type: 'alert', key, on: true }))
            notify('All fraud alerts on')
          }}
          className="h-11 rounded-xl border-2 border-shield text-sm font-semibold bg-card text-shield-700"
        >
          Turn on all recommended alerts
        </button>
      </section>
    </div>
  )
}
