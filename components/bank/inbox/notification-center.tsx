'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { useNotificationActions } from './use-notification-actions'
import { useNotifications, type NotificationItem, type NotificationTone } from './use-notifications'

type Filter = 'all' | 'action' | 'updates'

const toneClasses: Record<NotificationTone, { chip: string; accent: string }> = {
  urgent: { chip: 'bg-destructive text-white', accent: 'border-l-destructive' },
  warn: { chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', accent: 'border-l-amber-500' },
  info: { chip: 'bg-muted text-primary', accent: 'border-l-primary' },
  good: { chip: 'bg-accent text-accent-foreground', accent: 'border-l-primary' },
}

export function NotificationCenter() {
  const { dispatch } = useBank()
  const { items, unreadActions } = useNotifications()
  const { open } = useNotificationActions()
  const [filter, setFilter] = useState<Filter>('all')

  const close = () => dispatch({ type: 'overlay', overlay: null })

  const actionItems = items.filter((i) => i.needsAction)
  const updateItems = items.filter((i) => !i.needsAction)
  const showActions = filter !== 'updates' && actionItems.length > 0
  const showUpdates = filter !== 'action' && updateItems.length > 0
  const unreadAll = items.filter((i) => !i.read).length

  return (
    <OverlayFrame
      title="Notifications"
      onBack={close}
      right={
        <button
          type="button"
          onClick={() => dispatch({ type: 'readNotifs', ids: items.map((i) => i.id) })}
          disabled={unreadAll === 0}
          className="flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary disabled:opacity-40"
        >
          Mark all read
        </button>
      }
    >
      <div className="flex flex-col gap-5 px-4">
        <p className="px-1 text-sm text-muted-foreground" aria-live="polite">
          {unreadActions > 0
            ? `${unreadActions} thing${unreadActions === 1 ? '' : 's'} need${unreadActions === 1 ? 's' : ''} your attention.`
            : 'You’re all caught up. Messages and alerts from TD land here.'}
        </p>

        <div role="radiogroup" aria-label="Filter notifications" className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1">
          {(
            [
              ['all', 'All'],
              ['action', 'To review'],
              ['updates', 'Updates'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              onClick={() => setFilter(id)}
              className={cn('min-h-11 rounded-xl text-sm font-semibold', filter === id ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              {label}
            </button>
          ))}
        </div>

        {showActions && (
          <section aria-labelledby="notif-action-h" className="flex flex-col gap-2">
            <h2 id="notif-action-h" className="px-1 text-sm font-semibold">
              Needs your attention
            </h2>
            <ul className="flex flex-col gap-2">
              {actionItems.map((item) => (
                <NotificationRow key={item.id} item={item} onOpen={open} />
              ))}
            </ul>
          </section>
        )}

        {showUpdates && (
          <section aria-labelledby="notif-updates-h" className="flex flex-col gap-2">
            <h2 id="notif-updates-h" className="px-1 text-sm font-semibold">
              Messages and updates
            </h2>
            <ul className="flex flex-col gap-2">
              {updateItems.map((item) => (
                <NotificationRow key={item.id} item={item} onOpen={open} />
              ))}
            </ul>
          </section>
        )}

        {!showActions && !showUpdates && (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground">Nothing here right now.</p>
        )}
      </div>
    </OverlayFrame>
  )
}

function NotificationRow({ item, onOpen }: { item: NotificationItem; onOpen: (item: NotificationItem) => void }) {
  const Icon = item.icon
  const tone = toneClasses[item.tone]
  const interactive = item.action !== 'none' || !item.read

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        disabled={!interactive}
        className={cn('flex w-full items-start gap-3 rounded-2xl border-l-4 bg-card p-4 text-left', item.read ? 'border-l-transparent' : tone.accent)}
      >
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone.chip)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wide">{item.source}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              {item.when}
              {!item.read && <span aria-label="Unread" className="size-2 rounded-full bg-destructive" />}
            </span>
          </span>
          <span className={cn('mt-0.5 block leading-tight', item.read ? 'font-medium' : 'font-semibold')}>{item.title}</span>
          <span className="mt-1 block text-sm leading-snug text-muted-foreground">{item.body}</span>
          {item.cta && (
            <span className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg bg-shield-50 px-3 text-sm font-semibold text-shield-700">
              {item.cta} <ChevronRight className="size-4" aria-hidden />
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
