'use client'

import type { ComponentType, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { TediIcon } from './tedi-icon'
import { cn } from '@/lib/utils'
import { useBank, type Tab } from './bank-provider'

export function TediButton({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { dispatch } = useBank()
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'navigate', tab: 'sage' })}
      aria-label="Ask Tedi, your AI banker"
      className={cn(
        'flex h-11 items-center gap-1.5 rounded-full pl-2 pr-3.5 text-sm font-semibold transition-colors',
        tone === 'dark' ? 'bg-lime text-lime-foreground' : 'bg-forest text-lime',
      )}
    >
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-full',
          tone === 'dark' ? 'bg-forest text-lime' : 'bg-lime text-lime-foreground',
        )}
      >
        <TediIcon className="size-4" aria-hidden />
      </span>
      Tedi
    </button>
  )
}

export function HeaderActions() {
  return (
    <div className="flex shrink-0 items-center">
      <TediButton />
    </div>
  )
}

export function SubNav({ label, items }: { label: string; items: { tab: Tab; label: string }[] }) {
  const { tab, dispatch } = useBank()
  return (
    <nav aria-label={label} className="px-4 pb-2">
      <ul className="flex gap-1 rounded-2xl bg-muted p-1">
        {items.map((item) => {
          const active = tab === item.tab
          return (
            <li key={item.tab} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => !active && dispatch({ type: 'navigate', tab: item.tab })}
                className={cn(
                  'h-11 w-full rounded-xl text-sm font-semibold transition-colors',
                  active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export const accountsSubNav = [
  { tab: 'rewards' as Tab, label: 'Overview' },
  { tab: 'cards' as Tab, label: 'Rewards & Offers' },
]

export const moreSubNav = [
  { tab: 'more' as Tab, label: 'Settings' },
  { tab: 'branches' as Tab, label: 'Branches & ATMs' },
]

export function LinkRow({
  icon: Icon,
  title,
  body,
  onClick,
  right,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  body?: string
  onClick: () => void
  right?: ReactNode
}) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{title}</span>
          {body && <span className="block truncate text-xs text-muted-foreground">{body}</span>}
        </span>
        {right}
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  )
}
