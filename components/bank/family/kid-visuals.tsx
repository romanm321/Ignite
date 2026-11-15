'use client'

import Image from 'next/image'
import { Bike, Gamepad2, Gift, Heart, Music, Plane, type LucideIcon } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { avatarLabels, avatarSrc, cardColors, stickerSlots, stickerSrc, type GoalIcon, type Kid, type StickerId } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { TdMark } from '../primitives'

export const goalIconMap: Record<GoalIcon, LucideIcon> = { bike: Bike, gamepad: Gamepad2, gift: Gift, plane: Plane, heart: Heart, music: Music }

export function Face({
  src,
  alt,
  className,
  ring,
}: {
  src: string
  alt: string
  className?: string
  ring?: string
}) {
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-full bg-muted', ring, className)}>
      <Image src={src || '/placeholder.svg'} alt={alt} fill sizes="96px" className="object-cover" />
    </span>
  )
}

export function KidFace({ kid, mode = 'auto', className, ring }: { kid: Kid; mode?: 'auto' | 'photo'; className?: string; ring?: string }) {
  const usePhoto = mode === 'photo' || kid.avatar === 'photo'
  const src = usePhoto ? kid.photo : avatarSrc[kid.avatar as Exclude<Kid['avatar'], 'photo'>]
  return <Face src={src} alt={usePhoto ? kid.name : `${kid.name} as ${avatarLabels[kid.avatar]}`} className={className} ring={ring} />
}

export function StickerImg({ id, className }: { id: StickerId; className?: string }) {
  return (
    <span className={cn('relative block overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white', className)}>
      <Image src={stickerSrc[id] || '/placeholder.svg'} alt="" fill sizes="64px" className="scale-[1.18] object-cover" />
    </span>
  )
}

export function KidCard({
  kid,
  onSticker,
  className,
  masked,
}: {
  kid: Kid
  onSticker?: (placedId: string) => void
  className?: string
  masked?: boolean
}) {
  const color = cardColors[kid.cardColor]
  return (
    <div
      className={cn('relative aspect-[1.586] w-full overflow-hidden rounded-[11px] p-4 shadow-lg', color.cls, color.text, className)}
      role="img"
      aria-label={`${kid.name}’s ${color.label} TD Family card ending ${kid.cardMask}${kid.stickers.length ? ` with ${kid.stickers.length} stickers` : ''}`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <TdMark className="size-7 rounded-md" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">Family</span>
        </div>
        <div>
          <p className="text-lg font-black leading-none">{kid.name}</p>
          <p className="tabular mt-1 font-mono text-sm opacity-80">•••• {masked ? '••••' : kid.cardMask}</p>
        </div>
      </div>
      {kid.stickers.map((s) => {
        const slot = stickerSlots[s.slot % stickerSlots.length]
        const style = { top: `${slot.top}%`, left: `${slot.left}%`, transform: `rotate(${slot.rotate}deg)` }
        return onSticker ? (
          <button
            key={s.id}
            type="button"
            aria-label={`Remove ${s.sticker} sticker`}
            onClick={() => onSticker(s.id)}
            className="absolute z-20 size-14 animate-in zoom-in-50"
            style={style}
          >
            <StickerImg id={s.sticker} className="size-full" />
          </button>
        ) : (
          <span key={s.id} className="absolute z-20 size-14" style={style} aria-hidden>
            <StickerImg id={s.sticker} className="size-full" />
          </span>
        )
      })}
      {kid.controls.cardLocked && (
        <span className="absolute inset-0 z-30 flex items-center justify-center bg-forest/60 text-sm font-bold text-white">Card paused</span>
      )}
    </div>
  )
}

export function money(n: number) {
  return formatMoney(n)
}
