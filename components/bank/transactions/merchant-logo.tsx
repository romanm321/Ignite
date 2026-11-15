'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Enrichment } from '@/lib/enrichment'

const sizes = {
  sm: 'size-10 rounded-xl text-sm',
  md: 'size-12 rounded-2xl text-base',
  lg: 'size-20 rounded-[12px] text-2xl',
}

export function MerchantLogo({
  enrichment,
  size = 'sm',
  className,
}: {
  enrichment: Pick<Enrichment, 'name' | 'domain' | 'brandColor'>
  size?: keyof typeof sizes
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const initials = enrichment.name
    .replace(/^(The|To|Sent to|Provisional credit ·)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (!enrichment.domain || failed) {
    return (
      <span
        aria-hidden
        className={cn('flex shrink-0 items-center justify-center font-semibold text-white', sizes[size], className)}
        style={{ backgroundColor: enrichment.brandColor }}
      >
        {initials}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center overflow-hidden border bg-white p-1.5', sizes[size], className)}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${enrichment.domain}&sz=128`}
        alt=""
        crossOrigin="anonymous"
        className="size-full object-contain"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </span>
  )
}
