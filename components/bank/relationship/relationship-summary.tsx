'use client'

import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { SectionHeader } from '../primitives'
import { useBank } from '../bank-provider'
import { useRelationship } from './use-relationship'

export function RelationshipSummary() {
  const rel = useRelationship()
  const { streetSafe } = useBank()
  const show = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const assets = rel.deposits + rel.invested
  const total = rel.composition.reduce((s, c) => s + c.value, 0) || 1

  return (
    <section aria-labelledby="whole-h" className="flex flex-col gap-3">
      <SectionHeader id="whole-h" title="Everything you have with TD" />
      <div className="rounded-3xl bg-card p-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">You have</p>
            <p className="tabular mt-0.5 font-mono text-lg font-semibold">{show(assets)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">You owe</p>
            <p className="tabular mt-0.5 font-mono text-lg font-semibold">{show(rel.owed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overall</p>
            <p className="tabular mt-0.5 font-mono text-lg font-semibold text-primary">{show(assets - rel.owed)}</p>
          </div>
        </div>

        {rel.composition.length > 0 && (
          <>
            <div
              className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`Where your money is: ${rel.composition.map((c) => c.label).join(', ')}`}
            >
              {rel.composition.map((c) => (
                <div key={c.id} className={cn('h-full', c.tone)} style={{ width: `${(c.value / total) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {rel.composition.map((c) => (
                <li key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span aria-hidden className={cn('size-2.5 rounded-full', c.tone)} />
                  {c.label}
                  <span className="tabular font-mono text-foreground">{streetSafe ? '••••' : `${Math.round((c.value / total) * 100)}%`}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <ul className="mt-4 grid grid-cols-4 gap-2 border-t pt-4" aria-label="Where you bank with TD">
          {rel.coverage.map((c) => (
            <li key={c.id} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full',
                  c.done ? 'bg-lime text-lime-foreground' : 'border-2 border-dashed border-muted-foreground/40 text-muted-foreground',
                )}
              >
                {c.done ? <Check className="size-4" aria-hidden /> : <Circle className="size-3" aria-hidden />}
              </span>
              <span className="text-xs font-medium leading-tight">{c.label}</span>
              <span className="sr-only">{c.done ? 'You have this' : 'Not yet'}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
