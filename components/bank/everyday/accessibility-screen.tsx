'use client'

import { Contrast, LayoutList, Phone, Type, Volume2, Wind } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import type { A11yPrefs } from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { SectionHeader, Switch } from '../primitives'

const sizes: { id: A11yPrefs['textSize']; label: string; sample: string }[] = [
  { id: 'default', label: 'Standard', sample: 'text-sm' },
  { id: 'large', label: 'Large', sample: 'text-base' },
  { id: 'xl', label: 'Extra large', sample: 'text-lg' },
]

export function useReadAloud() {
  const { accounts, notify } = useBank()
  return () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      notify('Your device doesn’t support read-aloud yet')
      return
    }
    const text = accounts.map((a) => `${a.name}: ${formatMoney(Math.abs(a.balance))}${a.balance < 0 ? ' owed' : ''}`).join('. ')
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Here are your balances. ${text}.`))
    notify('Reading your balances out loud')
  }
}

export function AccessibilityScreen() {
  const { dispatch } = useBank()

  return (
    <OverlayFrame title="Accessibility" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="flex flex-col gap-6 px-5">
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Banking should work the way you do. Tweak anything here and it applies across the whole app, instantly.
        </p>
        <AccessibilitySettings />
      </div>
    </OverlayFrame>
  )
}

export function AccessibilitySettings() {
  const { a11y, dispatch, notify } = useBank()
  const readAloud = useReadAloud()
  const set = (patch: Partial<A11yPrefs>, msg: string) => {
    dispatch({ type: 'a11y', patch })
    notify(msg)
  }

  return (
    <div className="flex flex-col gap-6">
        <section aria-labelledby="text-size">
          <SectionHeader id="text-size" title="Text size" />
          <div role="radiogroup" aria-label="Text size" className="grid grid-cols-3 gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={a11y.textSize === s.id}
                onClick={() => set({ textSize: s.id }, `Text size: ${s.label}`)}
                className={cn(
                  'flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border bg-card',
                  a11y.textSize === s.id && 'border-primary bg-accent/50',
                )}
              >
                <Type className="text-primary" style={{ width: s.id === 'xl' ? 26 : s.id === 'large' ? 22 : 18 }} aria-hidden />
                <span className={cn('font-medium', s.sample)}>{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="display">
          <SectionHeader id="display" title="Display & motion" />
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl bg-card">
            {(
              [
                ['highContrast', 'High contrast', 'Bolder colors and outlines, easier on tired eyes', Contrast],
                ['reduceMotion', 'Reduce motion', 'Calms animations. Confetti sits this one out.', Wind],
                ['simpleHome', 'Simple Home', 'Just your accounts and essentials, no offers or extras', LayoutList],
              ] as const
            ).map(([key, title, body, Icon]) => (
              <li key={key} className="flex items-center gap-3 p-4">
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
                <Switch checked={a11y[key]} label={title} onChange={(v) => set({ [key]: v }, `${title} ${v ? 'on' : 'off'}`)} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="assist">
          <SectionHeader id="assist" title="Help when you need it" />
          <ul className="flex flex-col gap-2">
            <li>
              <button type="button" onClick={readAloud} className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card p-4 text-left">
                <Volume2 className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="flex-1">
                  <span className="block font-medium">Read my balances to me</span>
                  <span className="block text-sm text-muted-foreground">Works great alongside VoiceOver and TalkBack</span>
                </span>
              </button>
            </li>
            <li>
              <a href="tel:18008928852" className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card p-4">
                <Phone className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="flex-1">
                  <span className="block font-medium">Accessibility support line</span>
                  <span className="block text-sm text-muted-foreground">TTY, ASL video relay and real humans, 24/7</span>
                </span>
              </a>
            </li>
          </ul>
        </section>
    </div>
  )
}
