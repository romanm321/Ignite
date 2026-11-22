'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The flat colour each scene is drawn on, so the tile and the picture are one seamless block. */
const sceneColor = {
  'growth-savings': '#9cd2dc',
  'step-cd': '#dadfd8',
  complete: '#ffabd4',
  student: '#9bd0dd',
  family: '#c9ef6e',
  'direct-investing': '#dbe0d9',
  'auto-invest': '#c5ed68',
  'double-up': '#ffa8cd',
  'home-loan': '#9bd3dd',
  'auto-loan': '#41b232',
} as const

export type ProductImage = keyof typeof sceneColor
/** A horizontal row of tiles that swipe sideways and settle on each one. */
export function TileRail({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode[] }) {
  return (
    <ul aria-label={label} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
      {children.map((child, i) => (
        <li key={i} className={cn('flex shrink-0 snap-start', wide ? 'w-[84%]' : 'w-[70%]')}>
          {child}
        </li>
      ))}
    </ul>
  )
}

/** The scene sits along the bottom edge and fades into the tile colour above it, leaving clear space for the words. */
function TileImage({ name }: { name: ProductImage }) {
  const color = sceneColor[name]
  return (
    <>
    <Image
      src={`/images/products/${name}.png`}
      alt=""
      aria-hidden
      width={1408}
      height={768}
      sizes="(max-width: 440px) 90vw, 400px"
      className="pointer-events-none absolute bottom-0 right-0 h-auto w-[130%] max-w-none"
      style={{ maskImage: 'linear-gradient(to bottom, transparent 0, #000 24%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 24%)' }}
    />
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: `linear-gradient(to right, ${color} 0%, ${color} 40%, transparent 66%)` }}
    />
    </>
  )
}

function OpenMark() {
  return (
    <span aria-hidden className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-xl bg-black text-white">
      <ArrowUpRight className="size-4" />
    </span>
  )
}

/** A special offer for this customer: a tag, one big line, and a picture. */
export function PromoTile({
  tag,
  headline,
  line,
  image,
  onOpen,
}: {
  tag: string
  headline: string
  line: string
  image: ProductImage
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex h-[210px] w-full flex-col items-stretch justify-start overflow-hidden rounded-3xl p-5 text-left text-[#10261a] outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary active:opacity-90"
      style={{ backgroundColor: sceneColor[image] }}
    >
      <TileImage name={image} />
      <span className="relative self-start rounded-full bg-black/10 px-3 py-1 text-xs font-semibold">{tag}</span>
      <span className="relative mt-2 block max-w-[56%] text-balance font-heading text-[26px] font-bold leading-[1.05]">{headline}</span>
      <span className="relative mt-1 block max-w-[56%] text-sm opacity-85">{line}</span>
      <OpenMark />
    </button>
  )
}

/** One product: its name and a friendly line on top, a picture below. */
export function ProductTile({
  name,
  line,
  image,
  yours,
  onOpen,
}: {
  name: string
  line: string
  image: ProductImage
  yours?: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex h-[192px] w-full flex-col items-stretch justify-start overflow-hidden rounded-3xl p-5 text-left text-[#10261a] outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary active:opacity-90"
      style={{ backgroundColor: sceneColor[image] }}
    >
      <TileImage name={image} />
      <span className="relative flex items-start justify-between gap-2">
        <span className="block max-w-[60%] font-heading text-[24px] font-bold leading-[1.05]">{name}</span>
        {yours && <span className="shrink-0 rounded-full bg-black/10 px-3 py-1 text-xs font-semibold">Yours</span>}
      </span>
      <span className="relative mt-1 block max-w-[60%] text-sm opacity-85">{line}</span>
      <OpenMark />
    </button>
  )
}
