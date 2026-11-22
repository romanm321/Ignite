'use client'

import { Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryArtName } from '../onboarding/story-art'
import { InternalTxnIcon } from '../transactions/internal-txn-icon'
import type { ViewAccount } from './use-insights-view'

const accountArt: Record<Exclude<ViewAccount['kind'], 'external'>, StoryArtName> = {
  checking: 'wallet',
  savings: 'savings',
  cd: 'bank',
  credit: 'card-swipe',
  investment: 'retirement',
}

/** A TD illustration for each kind of account. Linked banks keep their own coloured mark. */
export function AccountMark({ account, className }: { account: ViewAccount; className?: string }) {
  if (account.kind === 'external') {
    return (
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', account.mark ?? 'bg-muted', className)}>
        {account.name ? <span className="text-sm font-bold">{account.name[0]}</span> : <Landmark className="size-5" aria-hidden />}
      </span>
    )
  }
  return <InternalTxnIcon art={accountArt[account.kind]} className={className} />
}
