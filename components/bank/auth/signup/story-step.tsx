'use client'

import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TdMark } from '../../primitives'
import { StoryArt } from '../../onboarding/story-art'

const SLIDE_MS = 5500

type Slide = { title: string; body: string; visual: ReactNode }

const slides: Slide[] = [
  {
    title: 'Get $250 when you open checking',
    body: 'Set up $500 in direct deposits within 90 days.',
    visual: (
      <div className="relative flex flex-col items-center gap-4">
        <StoryArt name="gift" className="size-36" />
        <span className="font-heading text-[88px] font-bold leading-none text-lime [text-shadow:0_0_60px_rgb(56_182_48/0.55)]">$250</span>
      </div>
    ),
  },
  {
    title: 'No monthly fee',
    body: 'Just add direct deposit.',
    visual: (
      <div className="relative">
        <StoryArt name="calculator" />
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-lime px-5 py-1.5 font-heading text-3xl font-bold leading-none text-lime-foreground">$0</span>
      </div>
    ),
  },
  {
    title: 'Paid up to 2 days early',
    body: 'Your paycheck, sooner.',
    visual: <StoryArt name="calendar" />,
  },
  {
    title: 'Open in 3 minutes',
    body: 'No paperwork. No branch visit.',
    visual: <StoryArt name="devices" />,
  },
  {
    title: 'Protected by TD',
    body: 'FDIC insured up to $250,000.',
    visual: <StoryArt name="security" />,
  },
]

/** Story-style intro: tap to move on, hold to pause. Ends on the create account button. */
export function StoryStep({ onCreate, onLogin, onClose }: { onCreate: () => void; onLogin: () => void; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const last = index === slides.length - 1
  const slide = slides[index]

  const next = () => setIndex((i) => Math.min(i + 1, slides.length - 1))
  const prev = () => setIndex((i) => Math.max(i - 1, 0))

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-black">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-lime/25 blur-[90px]" />

      <div className="relative z-10 flex flex-col gap-3 px-5 pt-[calc(var(--safe-top)+1.25rem)]">
        <ol className="flex gap-1.5" aria-label="Story progress">
          {slides.map((s, i) => (
            <li key={s.title} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25" aria-current={i === index ? 'step' : undefined}>
              {i < index && <span className="block h-full w-full bg-white" />}
              {i === index && (
                <span
                  key={index}
                  className={cn('story-progress block h-full bg-white', last && 'opacity-100')}
                  style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                  onAnimationEnd={() => !last && next()}
                />
              )}
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <TdMark className="size-8 rounded-lg" /> Welcome to TD
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center rounded-full">
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-5"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <button type="button" onClick={prev} aria-label="Previous" disabled={index === 0} className="absolute inset-y-0 left-0 z-10 w-1/3" />
        <button type="button" onClick={next} aria-label="Next" disabled={last} className="absolute inset-y-0 right-0 z-10 w-2/3" />
        <div key={index} className="animate-in fade-in zoom-in-95 duration-500">
          {slide.visual}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3 px-5 pb-8">
        <div key={slide.title} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-balance font-heading text-[34px] font-bold uppercase leading-[1.05]">{slide.title}</h1>
          <p className="mt-2 text-pretty text-white/70">{slide.body}</p>
        </div>
        <button type="button" onClick={onCreate} className="mt-3 h-14 w-full rounded-2xl bg-white font-semibold text-black active:opacity-80">
          Create account
        </button>
        <button type="button" onClick={onLogin} className="h-12 w-full rounded-2xl bg-white/10 font-medium active:bg-white/15">
          Log in
        </button>
        <p className="text-center text-xs text-white/50">Offer terms apply. Checking is FDIC insured.</p>
      </div>
    </div>
  )
}
