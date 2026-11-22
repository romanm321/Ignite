'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Enrichment } from '@/lib/enrichment'

const sizes = {
  sm: 'size-10 rounded-xl text-sm',
  md: 'size-12 rounded-2xl text-base',
  lg: 'size-20 rounded-[12px] text-2xl',
}

// Favicon services answer unknown or blocked domains with a tiny placeholder, which looks worse than initials.
const MIN_LOGO_PX = 32

/** Shows initials on the brand colour straight away, and swaps in the real logo only once it has loaded properly. */
export function MerchantLogo({
  enrichment,
  size = 'sm',
  className,
}: {
  enrichment: Pick<Enrichment, 'name' | 'domain' | 'brandColor'> & { logo?: string }
  size?: keyof typeof sizes
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const accept = (img: HTMLImageElement) => {
    if (img.naturalWidth >= MIN_LOGO_PX) setLoaded(true)
  }
  // An image can finish (or fail) before React attaches onLoad, so check it as soon as it mounts too.
  const imageRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) accept(img)
  }, [])

  const initials = enrichment.name
    .replace(/^(The|To|Sent to|Temporary credit ·)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden font-semibold text-white',
        loaded && 'border',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: loaded ? '#fff' : enrichment.brandColor }}
    >
      {enrichment.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={enrichment.logo} alt="" className="absolute inset-0 size-full bg-white object-cover" />
      ) : (
        <>
      {!loaded && initials}
      {enrichment.domain && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imageRef}
          src={`https://www.google.com/s2/favicons?domain=${enrichment.domain}&sz=128`}
          alt=""
          onLoad={(e) => accept(e.currentTarget)}
          className={cn('absolute inset-0 size-full object-contain p-1.5', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
        </>
      )}
    </span>
  )
}
