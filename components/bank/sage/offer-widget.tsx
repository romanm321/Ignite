'use client'

import { Check, ChevronRight, ShieldCheck } from 'lucide-react'
import { products, type ProductId } from '@/lib/offers'
import { useBank } from '../bank-provider'

export function OfferWidget({ productId }: { productId: ProductId }) {
  const { owned, dispatch } = useBank()
  const p = products[productId]
  const isOwned = owned.includes(productId)

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-forest p-4 text-forest-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-lime">{p.category}</p>
          <p className="mt-0.5 font-semibold leading-snug">{p.name}</p>
          <p className="text-sm text-forest-foreground/70">{p.tagline}</p>
        </div>
        {p.softPull && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-lime/15 px-2 py-1 text-[11px] font-semibold text-lime">
            <ShieldCheck className="size-3" aria-hidden /> Soft pull
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {p.benefits.slice(0, 3).map((b) => (
          <li key={b} className="flex gap-2 text-sm leading-snug text-forest-foreground/90">
            <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
      {isOwned ? (
        <p className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-forest-foreground/10 text-sm font-semibold">
          <Check className="size-4 text-lime" aria-hidden /> You already have this
        </p>
      ) : (
        <button
          type="button"
          onClick={() => dispatch({ type: 'startOnboarding', productId })}
          className="flex h-11 items-center justify-center gap-1 rounded-xl bg-shield text-sm font-semibold text-shield-foreground"
        >
          Open in about 60 seconds <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
