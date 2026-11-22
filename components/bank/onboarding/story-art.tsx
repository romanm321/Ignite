'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

export type StoryArtName =
  | 'gift'
  | 'calculator'
  | 'calendar'
  | 'devices'
  | 'security'
  | 'protection'
  | 'card-tap'
  | 'goals'
  | 'retirement'
  | 'cash'
  | 'cash-bag'
  | 'education'
  | 'advisor'
  | 'mobile-wallet'
  | 'partnership'
  | 'checklist'
  | 'celebrate'
  | 'everyday-spending'
  | 'global'
  | 'home'
  | 'idea'
  | 'savings'
  | 'info'
  | 'achievement'
  | 'auto'
  | 'wallet'
  | 'bank'
  | 'card-swipe'

/** A TD spot illustration on the white tile it is drawn for, so it sits cleanly on the dark story screens. */
export function StoryArt({ name, className }: { name: StoryArtName; className?: string }) {
  return (
    <div className={cn('flex size-44 items-center justify-center rounded-[40px] bg-white p-3 shadow-[0_20px_60px_rgb(0_0_0/0.35)]', className)}>
      <Image src={`/illustrations/${name}.png`} alt="" width={163} height={163} className="size-full object-contain" priority />
    </div>
  )
}

/** Picks the illustration that matches what a slide is talking about. */
export function artForText(text: string, index = 0): StoryArtName {
  const t = text.toLowerCase()
  if (/fdic|insured|protect|secure|safe/.test(t)) return 'protection'
  if (/vault|goal|round-?ups?|scheduled deposits?/.test(t)) return 'goals'
  if (/interest|rate|apy|yield/.test(t)) return 'savings'
  if (/cash back|back on|bonus|rewards|points|welcome/.test(t)) return 'gift'
  if (/fee|overdraft|no minimum|\$0/.test(t)) return 'calculator'
  if (/credit|builder/.test(t)) return 'checklist'
  if (/wallet|tap|phone|instant|minute/.test(t)) return 'mobile-wallet'
  if (/fund|invest|portfolio|balanced|mix of/.test(t)) return 'retirement'
  if (/banker|advisor|help|support/.test(t)) return 'advisor'
  if (/paid|deposit|paycheck|early|start with/.test(t)) return 'cash'
  if (/abroad|travel|global/.test(t)) return 'global'
  if (/year|month|locked|renew|term/.test(t)) return 'calendar'
  return (['idea', 'cash-bag', 'goals', 'checklist'] as const)[index % 4]
}
