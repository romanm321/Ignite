import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useId } from 'react'
import { createLucideIcon } from 'lucide-react'

/** Outline version of Tedi's three stacked layers. Works anywhere a lucide icon does. */
export const TediIcon = createLucideIcon('Tedi', [
  ['path', { d: 'M12 2.5 21 7l-9 4.5L3 7z', key: 'top' }],
  ['path', { d: 'm3 12 9 4.5 9-4.5', key: 'middle' }],
  ['path', { d: 'm3 16.5 9 4.5 9-4.5', key: 'bottom' }],
])

/** The coloured picture of Tedi's three stacked layers, used on the Tedi button in page headers. */
export function TediColorMark({ className }: { className?: string }) {
  return <Image src="/images/tedi-mark.png" alt="" width={44} height={40} className={cn('mix-blend-multiply brightness-[1.025]', className)} />
}

/** Full-colour version of Tedi's three stacked layers, for larger placements. */
export function TediMark({ className }: { className?: string }) {
  const id = useId()
  const middle = `${id}-middle`
  const top = `${id}-top`

  return (
    <svg viewBox="0 0 100 94" aria-hidden className={className}>
      <defs>
        <linearGradient id={middle} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6d23c" />
          <stop offset="0.5" stopColor="#8cc63f" />
          <stop offset="1" stopColor="#e9f0d3" />
        </linearGradient>
        <linearGradient id={top} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6d5d6" />
          <stop offset="0.45" stopColor="#f2cfd3" />
          <stop offset="1" stopColor="#f1e27f" />
        </linearGradient>
      </defs>
      <path d="M50 35 96 63 50 91 4 63Z" fill="#7cb342" />
      <path d="M50 19 96 47 50 75 4 47Z" fill={`url(#${middle})`} />
      <path d="M50 3 96 31 50 59 4 31Z" fill={`url(#${top})`} fillOpacity="0.88" />
    </svg>
  )
}
