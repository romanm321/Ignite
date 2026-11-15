'use client'

import { useState } from 'react'
import { ChevronDown, Clock, Eye, ShieldCheck, Unplug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scopeLabels, type DataScope } from '@/lib/trust-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Pill, SectionHeader, Switch } from '../primitives'

export function DataPanel() {
  const { notify } = useBank()
  const { connections, idGuard, dispatch } = useTrust()
  const [open, setOpen] = useState<string | null>(connections.find((c) => c.stale)?.id ?? null)

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="idg-h" className="rounded-3xl bg-lime p-4 text-lime-foreground">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-forest text-lime">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="idg-h" className="font-semibold">
              TD ID Guard {idGuard && '· Active'}
            </h3>
            <p className="mt-0.5 text-sm leading-relaxed opacity-80">
              Dark-web scans, credit lock and $1M identity restoration for you and up to 4 family members, kids included.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'idGuard', on: !idGuard })
            notify(idGuard ? 'ID Guard paused' : 'ID Guard on · first scan found 0 exposures')
          }}
          className={cn(
            'mt-4 h-11 w-full rounded-xl text-sm font-semibold',
            idGuard ? 'bg-white/60 text-lime-foreground' : 'bg-forest text-forest-foreground',
          )}
        >
          {idGuard ? 'Manage coverage' : 'Activate free'}
        </button>
      </section>

      <section aria-labelledby="apps-h" className="flex flex-col gap-3">
        <SectionHeader id="apps-h" title="Apps with access to your data" />
        <p className="px-1 text-sm leading-relaxed text-muted-foreground">
          You decide who sees what. Turn off a single data type or disconnect an app in one tap, with no call needed.
        </p>
        <ul className="flex flex-col gap-2">
          {connections.map((c) => {
            const expanded = open === c.id
            const shared = Object.values(c.scopes).filter(Boolean).length
            return (
              <li key={c.id} className={cn('overflow-hidden rounded-3xl bg-card', c.stale && 'ring-2 ring-destructive/30')}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : c.id)}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-xl bg-forest text-sm font-bold text-forest-foreground"
                  >
                    {c.name.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {c.name}
                      {c.stale && <Pill className="bg-destructive/10 text-destructive">Unused</Pill>}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {shared} data types · last access {c.lastAccess}
                    </span>
                  </span>
                  <ChevronDown className={cn('size-5 text-muted-foreground transition-transform', expanded && 'rotate-180')} aria-hidden />
                </button>
                {expanded && (
                  <div className="border-t px-4 pb-4 pt-2">
                    <p className="flex items-center gap-1.5 py-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden /> Consent given {c.connectedOn} · {c.purpose}
                    </p>
                    <ul className="divide-y">
                      {(Object.keys(scopeLabels) as DataScope[]).map((s) => (
                        <li key={s} className="flex items-center gap-3 py-1">
                          <Eye className="size-4 text-muted-foreground" aria-hidden />
                          <span className="flex-1 text-sm">{scopeLabels[s]}</span>
                          <Switch
                            checked={c.scopes[s]}
                            label={`Share ${scopeLabels[s]} with ${c.name}`}
                            onChange={(on) => dispatch({ type: 'scope', id: c.id, scope: s, on })}
                          />
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'disconnect', id: c.id })
                        notify(`${c.name} disconnected · access revoked`)
                      }}
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-sm font-semibold text-destructive"
                    >
                      <Unplug className="size-4" aria-hidden /> Disconnect {c.name}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
          {connections.length === 0 && (
            <li className="rounded-3xl bg-card px-4 py-5 text-center text-sm text-muted-foreground">No apps connected.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
