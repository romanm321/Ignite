'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/bank-data'
import { enrichments } from '@/lib/enrichment'
import type { StoryArtName } from '../onboarding/story-art'

/** The TD illustration that says what an internal transaction is. Merchants keep their own logos, so they return null. */
export function internalArt(txn: Transaction): StoryArtName | null {
  if (enrichments[txn.merchant]) return null
  const m = txn.merchant.toLowerCase()
  if (m.startsWith('interest')) return 'savings'
  if (/^(bought|sold) /.test(m)) return 'retirement'
  if (/rewards redemption|setup reward|cash back|welcome bonus/.test(m)) return 'gift'
  if (/mobile deposit/.test(m)) return 'cash'
  if (/opening deposit/.test(m)) return 'savings'
  if (/vault/.test(m)) return 'goals'
  if (/payment received|card payment|double up card/.test(m)) return 'card-tap'
  if (/wire/.test(m)) return 'global'
  if (/bill payment/.test(m)) return 'calendar'
  if (/td family/.test(m)) return 'education'
  if (/zelle|^sent to/.test(m)) return 'partnership'
  if (/temporary credit/.test(m)) return 'info'
  if (/fee$|fee /.test(m)) return 'calculator'
  if (txn.category === 'Income') return 'cash-bag'
  if (txn.category === 'Transfer') return txn.amount > 0 ? 'cash-bag' : 'cash'
  return null
}

const sizes = { sm: 'size-10 rounded-xl', lg: 'size-20 rounded-[12px]' }

export function InternalTxnIcon({
  art,
  size = 'sm',
  zoom,
  className,
}: {
  art: StoryArtName
  size?: keyof typeof sizes
  /** Fills more of the tile, for illustrations drawn with a lot of white around them. */
  zoom?: boolean
  className?: string
}) {
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center overflow-hidden border bg-white', sizes[size], className)}>
      <Image src={`/illustrations/${art}.png`} alt="" width={96} height={96} className={cn('size-full object-cover', zoom && 'scale-[1.35]')} />
    </span>
  )
}
