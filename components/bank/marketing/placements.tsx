'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ArrowRight, ChevronRight, Info, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { offerReasons, products, stories, type ProductId, type Story } from '@/lib/offers'
import { useBank } from '../bank-provider'
import { BottomSheet } from '../overlay'
import { Switch, TdMark } from '../primitives'

export function useOffer(offerId: string, productId: ProductId) {
  const { personalizedOffers, dismissedOffers, owned, drafts, onboarding } = useBank()
  return {
    visible: personalizedOffers && !dismissedOffers.includes(offerId) && !owned.includes(productId),
    draft: drafts[productId],
    active: onboarding === productId,
  }
}

export function OfferTag({ className, children = 'Offer' }: { className?: string; children?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-current/20 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider opacity-80',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function WhyThisSheet({ productId, offerId, onClose }: { productId: ProductId; offerId: string; onClose: () => void }) {
  const { dispatch, notify, personalizedOffers } = useBank()
  const p = products[productId]
  return (
    <BottomSheet title="Why you’re seeing this" description={`${p.name} · ${p.category}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="rounded-2xl bg-accent p-4 text-sm leading-relaxed text-accent-foreground">{offerReasons[productId]}</p>
        <p className="text-sm text-muted-foreground">We never sell your data. Offers come only from your TD accounts.</p>
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 pl-4">
          <span>
            <span className="block text-sm font-semibold">Offers made for me</span>
            <span className="block text-xs text-muted-foreground">Change this anytime in Settings</span>
          </span>
          <Switch
            label="Personalized offers"
            checked={personalizedOffers}
            onChange={(on) => {
              dispatch({ type: 'personalizedOffers', on })
              notify(on ? 'Offers made for you are on' : 'Offers made for you are off')
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'dismissOffer', id: offerId })
            notify('Got it. We won’t show this again.')
            onClose()
          }}
          className="h-12 rounded-xl border-2 border-shield font-semibold bg-card text-shield-700"
        >
          Not interested
        </button>
      </div>
    </BottomSheet>
  )
}

function WhyButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Why am I seeing this offer?"
      className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', className)}
    >
      <Info className="size-4" aria-hidden />
    </button>
  )
}

type FeaturedOffer = {
  offerId: string
  productId: ProductId
  image: string
  alt: string
  tag: string
  title: string
  body: string
  cta: string
}

const featuredOffers: FeaturedOffer[] = [
  {
    offerId: 'hero-double',
    productId: 'double-up',
    image: '/images/offer-double-up.png',
    alt: 'Hand holding a deep green TD Double Up card at a cafe',
    tag: 'Pre-approved',
    title: '2% back on everything. Up to $8,000.',
    body: 'No yearly fee, plus a $200 bonus. Checking won’t affect your credit score.',
    cta: 'Get it in 60 seconds',
  },
  {
    offerId: 'hero-cd',
    productId: 'step-cd',
    image: '/images/offer-step-cd.png',
    alt: 'Hand holding a phone showing a savings chart at a cafe table',
    tag: 'Fixed rate',
    title: 'A fixed 4.25% for 12 months.',
    body: 'Unlike Vault rates, it can’t change. $5,000 earns about $212.',
    cta: 'Lock my rate',
  },
  {
    offerId: 'hero-invest',
    productId: 'auto-invest',
    image: '/images/offer-auto-invest.png',
    alt: 'Coins going into a glass jar with a green seedling at a cafe table',
    tag: 'New',
    title: 'Invest your spare change. Start with $5.',
    body: 'We round up your purchases and invest the difference for you.',
    cta: 'Start with $5',
  },
]

export function useFeaturedOffers() {
  const { personalizedOffers, dismissedOffers, owned } = useBank()
  return featuredOffers.filter((o) => personalizedOffers && !dismissedOffers.includes(o.offerId) && !owned.includes(o.productId))
}

export function TdForYou() {
  const list = useFeaturedOffers()
  if (list.length === 0) return null
  return (
    <section aria-labelledby="td-for-you-h" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="td-for-you-h" className="flex items-center gap-2 text-lg font-semibold">
          <TdMark className="size-6 rounded-md" />
          TD for you
        </h2>
        <span className="text-xs text-muted-foreground">{list.length} offers · swipe</span>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4">
        {list.map((o) => (
          <li key={o.offerId} className="w-[90%] shrink-0 snap-start">
            <FeaturedOfferCard offer={o} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function FeaturedOfferCard({ offer }: { offer: FeaturedOffer }) {
  const { dispatch } = useBank()
  const { draft } = useOffer(offer.offerId, offer.productId)
  const [why, setWhy] = useState(false)
  const titleId = `${offer.offerId}-h`
  return (
    <article className="relative h-32 overflow-hidden rounded-2xl bg-forest text-forest-foreground">
      <Image src={offer.image} alt="" fill sizes="360px" className="object-cover" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/45 to-forest/10" />
      {/* The whole banner is the button. The info icon sits above it as its own control. */}
      <button
        type="button"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-tag`}
        onClick={() => dispatch({ type: 'startOnboarding', productId: offer.productId })}
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-center justify-between">
        <OfferTag className="bg-forest/60 text-forest-foreground backdrop-blur" >
          <span id={`${titleId}-tag`}>{draft ? 'Application in progress' : offer.tag}</span>
        </OfferTag>
        <WhyButton onClick={() => setWhy(true)} className="pointer-events-auto relative size-9 bg-forest/60 backdrop-blur" />
      </div>
      <h3
        id={titleId}
        className="pointer-events-none absolute inset-x-3 bottom-3 line-clamp-2 text-balance text-base font-semibold leading-tight tracking-tight"
      >
        {offer.title}
      </h3>
      {why && <WhyThisSheet productId={offer.productId} offerId={offer.offerId} onClose={() => setWhy(false)} />}
    </article>
  )
}

export function HeroOffer() {
  const { dispatch } = useBank()
  const { visible, draft } = useOffer('hero-double', 'double-up')
  const [why, setWhy] = useState(false)
  if (!visible) return null
  return (
    <section aria-labelledby="hero-offer-h" className="overflow-hidden rounded-3xl bg-forest text-forest-foreground">
      <div className="relative aspect-[16/9]">
        <Image
          src="/images/offer-double-up.png"
          alt="Hand holding a deep green TD Double Up card at a cafe"
          fill
          sizes="400px"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest via-forest/20 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <OfferTag className="bg-forest/60 text-forest-foreground backdrop-blur">Pre-approved</OfferTag>
          <WhyButton onClick={() => setWhy(true)} className="bg-forest/60 backdrop-blur" />
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 pb-5">
        <div>
          <h2 id="hero-offer-h" className="text-balance text-xl font-semibold leading-tight tracking-tight">
            2% back on everything. Up to $8,000 limit.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-forest-foreground/75">
            TD Double Up Visa® · $0 annual fee · $200 cash bonus. Seeing if you&apos;re approved won&apos;t affect your credit score.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'startOnboarding', productId: 'double-up' })}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-shield font-semibold text-shield-foreground"
        >
          {draft ? 'Pick up where you left off' : 'Get it in 60 seconds'}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      {why && <WhyThisSheet productId="double-up" offerId="hero-double" onClose={() => setWhy(false)} />}
    </section>
  )
}

export function InlineOffer({
  offerId,
  productId,
  children,
  cta,
  className,
}: {
  offerId: string
  productId: ProductId
  children: ReactNode
  cta: string
  className?: string
}) {
  const { dispatch } = useBank()
  const { visible, draft } = useOffer(offerId, productId)
  const [why, setWhy] = useState(false)
  if (!visible) return null
  return (
    <div className={cn('flex items-start gap-1 text-sm leading-relaxed', className)}>
      <p className="flex-1 py-2.5">
        <OfferTag className="mr-1.5 align-[1px] text-primary">Offer</OfferTag>
        <span className="text-muted-foreground">{children}</span>{' '}
        <button
          type="button"
          onClick={() => dispatch({ type: 'startOnboarding', productId })}
          className="inline-flex items-center font-semibold text-primary underline-offset-4 hover:underline"
        >
          {draft ? 'Resume' : cta}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </p>
      <WhyButton onClick={() => setWhy(true)} className="-mr-2 text-muted-foreground" />
      {why && <WhyThisSheet productId={productId} offerId={offerId} onClose={() => setWhy(false)} />}
    </div>
  )
}

const toneRing: Record<Story['tone'], string> = {
  forest: 'bg-forest text-lime',
  lime: 'bg-lime text-lime-foreground',
  primary: 'bg-primary text-primary-foreground',
}

const toneBg: Record<Story['tone'], string> = {
  forest: 'bg-forest text-forest-foreground',
  lime: 'bg-lime text-lime-foreground',
  primary: 'bg-primary text-primary-foreground',
}

export function OfferStories() {
  const { owned, personalizedOffers } = useBank()
  const [seen, setSeen] = useState<string[]>([])
  const [open, setOpen] = useState<number | null>(null)
  const list = stories.filter((s) => !s.productId || !owned.includes(s.productId))
  if (!personalizedOffers || list.length === 0) return null

  return (
    <section aria-label="Featured for you">
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1">
        {list.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="flex w-[72px] flex-col items-center gap-1.5"
              aria-label={`${s.label}: ${s.title}`}
            >
              <span
                className={cn(
                  'rounded-full p-[3px]',
                  seen.includes(s.id) ? 'bg-muted-foreground/25' : 'bg-gradient-to-tr from-primary to-lime',
                )}
              >
                <span className="block rounded-full bg-background p-[3px]">
                  <span className={cn('flex size-14 items-center justify-center rounded-full text-sm font-bold', toneRing[s.tone])}>
                    {s.label.split(' ')[0]}
                  </span>
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px] font-medium">{s.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <StoryViewer
          list={list}
          start={open}
          onSeen={(id) => setSeen((x) => (x.includes(id) ? x : [...x, id]))}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}

const STORY_MS = 5000

function StoryViewer({
  list,
  start,
  onSeen,
  onClose,
}: {
  list: Story[]
  start: number
  onSeen: (id: string) => void
  onClose: () => void
}) {
  const { dispatch } = useBank()
  const [index, setIndex] = useState(start)
  const story = list[index]

  useEffect(() => {
    onSeen(story.id)
    const timer = window.setTimeout(() => {
      if (index < list.length - 1) setIndex(index + 1)
      else onClose()
    }, STORY_MS)
    return () => window.clearTimeout(timer)
  }, [index, story.id, list.length, onClose, onSeen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, list.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list.length, onClose])

  const act = () => {
    onClose()
    if (story.productId) dispatch({ type: 'startOnboarding', productId: story.productId })
  }

  const target = typeof document === 'undefined' ? null : document.getElementById('phone-sheet-root')
  const view = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
      className={cn('absolute inset-0 z-50 flex flex-col animate-in fade-in', toneBg[story.tone])}
    >
      <div className="flex gap-1 px-3 pt-3" aria-hidden>
        {list.map((s, i) => (
          <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-current/20">
            <span
              key={`${s.id}-${index}`}
              className={cn('block h-full rounded-full bg-current', i < index && 'w-full', i > index && 'w-0', i === index && 'story-progress')}
              style={i === index ? { animationDuration: `${STORY_MS}ms` } : undefined}
            />
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="flex items-center gap-2 pl-1 text-sm font-semibold">
          <TdMark className="size-7 rounded-md" />
          TD for you
          <OfferTag>Offer</OfferTag>
        </span>
        <button type="button" onClick={onClose} aria-label="Close stories" className="flex size-11 items-center justify-center rounded-full">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex flex-1 flex-col justify-end gap-4 px-6 pb-10">
        <button
          type="button"
          aria-label="Previous story"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          type="button"
          aria-label="Next story"
          onClick={() => (index < list.length - 1 ? setIndex(index + 1) : onClose())}
          className="absolute inset-y-0 right-0 w-2/3"
        />
        <div aria-hidden className="pointer-events-none mb-auto mt-10 flex justify-center">
          <span className="flex size-40 items-center justify-center rounded-[20px] bg-current/10 text-5xl font-semibold tracking-tight">
            {story.label.split(' ')[0]}
          </span>
        </div>
        <p className="pointer-events-none text-sm font-semibold uppercase tracking-wider opacity-70">{story.kicker}</p>
        <h2 className="pointer-events-none text-balance text-4xl font-semibold leading-[1.05] tracking-tight">{story.title}</h2>
        <p className="pointer-events-none text-pretty text-base leading-relaxed opacity-80">{story.body}</p>
        <button
          type="button"
          onClick={act}
          className="relative z-10 mt-2 flex h-14 items-center justify-center gap-2 rounded-xl bg-background font-semibold text-foreground"
        >
          {story.cta}
          <Play className="size-4 fill-current" aria-hidden />
        </button>
      </div>
    </div>
  )
  return target ? createPortal(view, target) : view
}
