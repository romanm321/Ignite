'use client'

import { useState, type ReactNode } from 'react'
import { Pause, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/offers'
import { useBank } from '../bank-provider'
import { CardArt } from './setup-step'
import { StoryArt, artForText, type StoryArtName } from './story-art'

const SLIDE_MS = 5000
const productArt: Record<string, StoryArtName> = {
  'growth-savings': 'savings',
  'step-cd': 'calendar',
  'auto-invest': 'retirement',
  student: 'education',
  complete: 'partnership',
}

export type StorySlide = { id: string; title: string; body: string; visual: ReactNode }
type Slide = StorySlide

function buildSlides(product: Product): Slide[] {
  const hero = product.hero ?? (product.setup === 'deposit' ? '4.25% interest' : 'From $5')
  const opener: Slide = {
    id: 'hero',
    title: product.headline,
    body: `${product.category} · ${product.tagline}`,
    visual:
      product.setup === 'card' ? (
        <CardArt design="forest" mask={product.mask} className="w-72 rotate-[-4deg]" />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <StoryArt name={productArt[product.id] ?? 'savings'} className="size-36" />
          <span className="text-balance font-heading text-5xl font-bold leading-none text-lime [text-shadow:0_0_60px_rgb(56_182_48/0.55)]">{hero}</span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">{product.name}</span>
        </div>
      ),
  }

  const benefits: Slide[] = product.benefits.map((benefit, i) => {
    const term = product.keyTerms[i]
    return {
      id: `benefit-${i}`,
      title: benefit,
      body: term ? `${term.label}: ${term.value}` : product.tagline,
      visual: <StoryArt name={artForText(benefit, i)} />,
    }
  })

  const closer: Slide = {
    id: 'closer',
    title: 'Open it in about a minute',
    body: product.softPull ? 'No documents and no credit impact.' : 'No documents and no monthly fee to get started.',
    visual: <StoryArt name="devices" />,
  }

  return [opener, ...benefits, closer]
}

export function ProductStory({ product, onStart, onClose }: { product: Product; onStart: () => void; onClose: () => void }) {
  return <StoryReel title={product.name} slides={buildSlides(product)} onStart={onStart} onClose={onClose} />
}

/** Story-style showcase: tap to move on, hold to pause. Ends on the start button. */
export function StoryReel({
  title,
  slides,
  onStart,
  onClose,
  startLabel = 'Get started',
  dismissLabel = 'Not now',
}: {
  title: string
  slides: StorySlide[]
  onStart: () => void
  onClose: () => void
  startLabel?: string
  /** Pass null to hide the secondary button. */
  dismissLabel?: string | null
}) {
  const { a11y } = useBank()
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [manualPause, setManualPause] = useState(false)
  const last = index === slides.length - 1
  const slide = slides[index]
  const paused = held || manualPause || a11y.reduceMotion

  const next = () => setIndex((i) => Math.min(i + 1, slides.length - 1))
  const prev = () => setIndex((i) => Math.max(i - 1, 0))

  return (
    <div
      className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-black text-white"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }}
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-lime/25 blur-[90px]" />

      <div className="relative z-10 flex flex-col gap-3 px-5 pt-[calc(var(--safe-top)+1.25rem)]">
        <ol className="flex gap-1.5" aria-label="Story progress">
          {slides.map((s, i) => (
            <li key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25" aria-current={i === index ? 'step' : undefined}>
              {(i < index || (i === index && a11y.reduceMotion)) && <span className="block h-full w-full bg-white" />}
              {i === index && !a11y.reduceMotion && (
                <span
                  key={index}
                  className="story-progress block h-full bg-white"
                  style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                  onAnimationEnd={() => !last && next()}
                />
              )}
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <span className="-mr-2 flex items-center">
            {!a11y.reduceMotion && !last && (
              <button
                type="button"
                onClick={() => setManualPause((p) => !p)}
                aria-label={manualPause ? 'Play story' : 'Pause story'}
                className="flex size-11 items-center justify-center rounded-full"
              >
                {manualPause ? <Play className="size-5" aria-hidden /> : <Pause className="size-5" aria-hidden />}
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-full">
              <X className="size-5" aria-hidden />
            </button>
          </span>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-5"
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
      >
        <button type="button" onClick={prev} aria-label="Previous" disabled={index === 0} className="absolute inset-y-0 left-0 z-10 w-1/3" />
        <button type="button" onClick={next} aria-label="Next" disabled={last} className="absolute inset-y-0 right-0 z-10 w-2/3" />
        <div key={index} className="animate-in fade-in zoom-in-95 duration-500">
          {slide.visual}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3 px-5 pb-8">
        <div key={slide.id} aria-live="polite" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-balance font-heading text-[30px] font-bold uppercase leading-[1.08]">{slide.title}</h1>
          <p className="mt-2 text-pretty text-white/75">{slide.body}</p>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-3 h-14 w-full rounded-2xl bg-white font-semibold text-black outline-offset-2 focus-visible:outline-2 focus-visible:outline-white active:opacity-80"
        >
          {startLabel}
        </button>
        {dismissLabel && (
          <button type="button" onClick={onClose} className="h-12 w-full rounded-2xl bg-white/10 font-medium active:bg-white/15">
            {dismissLabel}
          </button>
        )}
      </div>
    </div>
  )
}
