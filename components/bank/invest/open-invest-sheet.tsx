'use client'

import { useState } from 'react'
import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { customer } from '@/lib/bank-data'
import {
  styleCopy,
  styleFor,
  type DropReaction,
  type Experience,
  type InvestProfile,
  type Timeline,
} from '@/lib/invest-data'
import { cn } from '@/lib/utils'
import { BottomSheet, PrimaryButton } from '../overlay'

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'min-h-12 rounded-2xl border px-4 text-left text-sm font-medium',
              value === o.id ? 'border-primary bg-accent text-accent-foreground' : 'bg-card',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function OpenInvestSheet({ onClose, onOpened }: { onClose: () => void; onOpened: (p: InvestProfile) => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [drop, setDrop] = useState<DropReaction | null>(null)
  const [experience, setExperience] = useState<Experience | null>(null)
  const [agreed, setAgreed] = useState(false)
  const style = timeline && drop ? styleFor(timeline, drop) : null

  const known = [
    { label: 'Legal name', value: `${customer.firstName} ${customer.lastName}` },
    { label: 'SSN', value: '•••-••-4821' },
    { label: 'Address', value: 'On file since 2019' },
    { label: 'Employment & income', value: 'From your direct deposits' },
  ]

  return (
    <BottomSheet
      title={step === 0 ? 'You’re 3 taps from investing' : step === 1 ? 'Three quick questions' : 'Last thing: the fine print'}
      description={
        step === 0
          ? 'You’re already a TD customer, so we skip the 20-minute application.'
          : step === 1
            ? 'So we suggest the right things, not the loudest things.'
            : 'Investing is different from saving. Here’s what that means.'
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <ol className="flex gap-1.5" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <li key={i} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </ol>

        {step === 0 && (
          <>
            <ul className="divide-y rounded-2xl border">
              {known.map((k) => (
                <li key={k.label} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1 text-muted-foreground">{k.label}</span>
                  <span className="font-medium">{k.value}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your investing account links to checking and savings instantly. No transfers to wait on, no new login.
            </p>
            <PrimaryButton onClick={() => setStep(1)}>Looks right</PrimaryButton>
          </>
        )}

        {step === 1 && (
          <>
            <Choice
              label="When might you need this money?"
              value={timeline}
              onChange={setTimeline}
              options={[
                { id: 'soon', label: 'Within a year' },
                { id: 'mid', label: 'In 1 to 5 years' },
                { id: 'long', label: '5+ years from now' },
              ]}
            />
            <Choice
              label="If it dropped 20% in a month, you’d…"
              value={drop}
              onChange={setDrop}
              options={[
                { id: 'sell', label: 'Sell before it gets worse' },
                { id: 'wait', label: 'Wait it out' },
                { id: 'buy', label: 'Buy more while it’s on sale' },
              ]}
            />
            <Choice
              label="Have you invested before?"
              value={experience}
              onChange={setExperience}
              options={[
                { id: 'new', label: 'This is my first time' },
                { id: 'some', label: 'A little, like a 401(k)' },
                { id: 'lots', label: 'Yes, I trade regularly' },
              ]}
            />
            {style && (
              <p role="status" className="rounded-2xl bg-forest p-4 text-sm leading-relaxed text-forest-foreground">
                <span className="block font-semibold text-lime">You’re a {styleCopy[style].label} investor</span>
                {styleCopy[style].body}
              </p>
            )}
            <PrimaryButton disabled={!style || !experience} onClick={() => setStep(2)}>
              Continue
            </PrimaryButton>
          </>
        )}

        {step === 2 && (
          <>
            <ul className="flex flex-col gap-3 text-sm leading-relaxed">
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Investments are protected by SIPC up to $500,000 if TD fails, but they are <strong>not FDIC insured</strong> and can lose value.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                $0 commissions on US stocks and ETFs. No account minimum or monthly fee.
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Your checking cushion and Rainy day fund are never used to invest unless you say so.
              </li>
            </ul>
            <label className="flex min-h-12 items-start gap-3 rounded-2xl border p-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-5 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I’ve read the Customer Agreement and understand investing involves risk.
            </label>
            <PrimaryButton
              disabled={!agreed}
              onClick={() => timeline && drop && experience && onOpened({ timeline, drop, experience, style: styleFor(timeline, drop) })}
            >
              Open my investing account
            </PrimaryButton>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
