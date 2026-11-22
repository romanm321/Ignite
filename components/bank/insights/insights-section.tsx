'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeader } from '../primitives'
import { BillsTab } from './bills-tab'
import { OverviewTab } from './overview-tab'
import { SpendingTab } from './spending-tab'
import { TrendsTab } from './trends-tab'
import { insightsTabs, type InsightsTab } from './types'

export function InsightsSection() {
  const [open, setOpen] = useState<InsightsTab | null>(null)

  const toggle = (id: InsightsTab) => setOpen((current) => (current === id ? null : id))

  const reveal = (id: InsightsTab) => {
    setOpen(id)
    requestAnimationFrame(() => document.getElementById(`insights-item-${id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  const panels: Record<InsightsTab, ReactNode> = {
    overview: <OverviewTab onTab={reveal} />,
    trends: <TrendsTab onTab={reveal} />,
    spending: <SpendingTab />,
    bills: <BillsTab />,
  }

  return (
    <section aria-labelledby="insights-h" className="flex flex-col gap-4">
      <div>
        <SectionHeader id="insights-h" title="More insights" />
        <p className="mt-0.5 px-1 text-sm text-muted-foreground">Safe to spend, trends, spending and bills.</p>
      </div>

      <div className="flex flex-col gap-3">
        {insightsTabs.map((t) => {
          const isOpen = open === t.id
          return (
            <div key={t.id} id={`insights-item-${t.id}`} className="scroll-mt-16">
              <h3>
                <button
                  type="button"
                  id={`insights-trigger-${t.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`insights-panel-${t.id}`}
                  onClick={() => toggle(t.id)}
                  className={cn(
                    'flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border bg-card px-4 text-left font-semibold transition-colors',
                    isOpen && 'border-primary/40',
                  )}
                >
                  {t.label}
                  <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} aria-hidden />
                </button>
              </h3>
              <div
                id={`insights-panel-${t.id}`}
                role="region"
                aria-labelledby={`insights-trigger-${t.id}`}
                hidden={!isOpen}
                className="flex flex-col gap-4 pt-3"
              >
                {panels[t.id]}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
