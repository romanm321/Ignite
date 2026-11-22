'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptic, playTick } from '@/lib/feedback'
import { ProveBadge } from '../../onboarding/identity-steps'
import { Cta, Dots, Heading, Keypad } from './shell'
import { digitsOnly, formatPhone } from './types'

const OTP = '482913'

export function PhoneEntryStep({ phone, setPhone, onContinue }: { phone: string; setPhone: (v: string) => void; onContinue: () => void }) {
  const digits = digitsOnly(phone)
  const valid = digits.length === 10
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue

  // Lets people on a desktop type the number instead of tapping the on-screen keypad.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setPhone(formatPhone(digits + e.key))
      else if (e.key === 'Backspace') setPhone(formatPhone(digits.slice(0, -1)))
      else if (e.key === 'Enter' && digits.length === 10) onContinueRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [digits, setPhone])

  return (
    <>
      <Heading title="What’s your number?" body="We’ll text you a code." />
      <div className="flex items-center gap-3">
        <span className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-card px-4 font-medium" aria-label="United States, plus 1">
          <span aria-hidden>🇺🇸</span> +1
        </span>
        <p
          aria-live="polite"
          className={cn('flex h-14 min-w-0 flex-1 items-center rounded-2xl bg-card px-4 font-mono text-xl font-semibold', !phone && 'text-muted-foreground')}
        >
          {phone || '(555) 123-4567'}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Message and data rates may apply.</p>
      <div className="mt-auto flex flex-col gap-4">
        <Keypad
          value={digits}
          length={10}
          onChange={(v) => {
            haptic(6)
            setPhone(formatPhone(v))
          }}
        />
        <Cta onClick={onContinue} disabled={!valid}>
          Continue
        </Cta>
      </div>
    </>
  )
}

export function OtpStep({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [texted, setTexted] = useState(false)
  const [error, setError] = useState(false)
  const [ok, setOk] = useState(false)
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTexted(true)
      haptic([10, 40, 10])
      playTick()
    }, 1100)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [seconds])

  const enter = (value: string) => {
    setError(false)
    setCode(value)
    if (value.length < 6) return
    if (value === OTP) {
      setOk(true)
      haptic([12, 30, 12])
      window.setTimeout(onVerified, 700)
    } else {
      setError(true)
      haptic([40, 30, 40])
      window.setTimeout(() => setCode(''), 500)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ok) return
      if (/^\d$/.test(e.key) && code.length < 6) enter(code + e.key)
      else if (e.key === 'Backspace') enter(code.slice(0, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const last4 = digitsOnly(phone).slice(-4)

  return (
    <>
      {texted && (
        <div
          role="status"
          className="absolute inset-x-3 top-3 z-20 flex items-start gap-3 rounded-2xl bg-[#2a2a2c]/95 p-3 shadow-2xl backdrop-blur animate-in slide-in-from-top-6 fade-in"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-lime text-lime-foreground">
            <MessageSquareText className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 text-sm">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">Messages</span>
              <span className="text-xs text-muted-foreground">now</span>
            </span>
            <span className="block text-white/85">TD: {OTP.slice(0, 3)} {OTP.slice(3)} is your verification code.</span>
          </span>
        </div>
      )}

      <Heading title="Enter your code" body={`Sent to •••-•••-${last4}`} />

      <div className={cn(error && 'animate-[shake_0.4s]')}>
        <Dots value={code} length={6} reveal />
      </div>
      <p role="status" className={cn('-mt-2 text-center text-sm', error ? 'text-red-400' : ok ? 'text-lime' : 'text-muted-foreground')}>
        {ok ? (
          <span className="inline-flex items-center gap-1">
            <Check className="size-4" aria-hidden /> Verified
          </span>
        ) : error ? (
          'That code isn’t right. Try the one we texted you.'
        ) : seconds > 0 ? (
          `Resend code in 0:${String(seconds).padStart(2, '0')}`
        ) : (
          <button type="button" onClick={() => setSeconds(30)} className="font-medium text-white underline underline-offset-2">
            Resend code
          </button>
        )}
      </p>

      <div className="mt-auto flex flex-col gap-3">
        {texted && !ok && code.length === 0 && (
          <button
            type="button"
            onClick={() => enter(OTP)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-card text-sm animate-in fade-in slide-in-from-bottom-2"
          >
            <span className="text-muted-foreground">From Messages</span>
            <span className="font-mono font-semibold tracking-wider">{OTP}</span>
          </button>
        )}
        <Keypad value={code} length={6} onChange={(v) => !ok && enter(v)} />
      </div>
    </>
  )
}

export function MethodStep({ onSim, onManual }: { onSim: () => void; onManual: () => void }) {
  return (
    <>
      <Heading title="Your details" body="We can pull them from your phone carrier in about 10 seconds. Or you can type them." />
      <ul className="flex flex-col gap-2 text-sm">
        {['Name, birthday and address', 'No documents needed', 'Checks for SIM swaps'].map((t) => (
          <li key={t} className="flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3">
            <Check className="size-4 shrink-0 text-lime" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2">
        <Cta onClick={onSim}>Pull from my phone</Cta>
        <Cta variant="secondary" onClick={onManual}>
          Enter it myself
        </Cta>
        <div className="flex justify-center pt-2">
          <ProveBadge />
        </div>
      </div>
    </>
  )
}
