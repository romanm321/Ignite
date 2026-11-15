'use client'

import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { Field, OverlayFrame, PrimaryButton, inputClass } from '../overlay'
import { Confetti } from '../celebrate'

const AVAILABLE_NOW = 225

type Side = 'front' | 'back'

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return setUrl(null)
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function CaptureTile({ side, file, onFile }: { side: Side; file: File | null; onFile: (f: File | null) => void }) {
  const url = useObjectUrl(file)
  const id = `check-${side}`
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={cn(
          'relative flex aspect-[2.2/1] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed text-sm font-medium',
          file ? 'border-primary' : 'border-primary/30 bg-accent/30 text-primary',
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={url} alt={`${side} of check`} className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <Camera className="size-6" aria-hidden />
            Snap the {side}
          </>
        )}
        {file && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="size-3.5" aria-hidden /> Looks good
          </span>
        )}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {file && (
        <button type="button" onClick={() => onFile(null)} className="flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary">
          <RotateCcw className="size-4" aria-hidden /> Retake {side}
        </button>
      )}
    </div>
  )
}

export function DepositScreen() {
  const { accounts, dispatch } = useBank()
  const depositable = accounts.filter((a) => a.kind !== 'credit' && a.id !== 'cd')
  const [step, setStep] = useState<'details' | 'capture' | 'review' | 'done'>('details')
  const [accountId, setAccountId] = useState(depositable[0]?.id ?? 'chk')
  const [amount, setAmount] = useState('')
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [checkNo] = useState(() => String(1000 + Math.floor(Math.random() * 900)))
  const value = Number(amount)
  const validAmount = Number.isFinite(value) && value > 0 && value <= 10000
  const account = accounts.find((a) => a.id === accountId)
  const now = Math.min(value, AVAILABLE_NOW)
  const close = () => dispatch({ type: 'overlay', overlay: null })

  if (step === 'done') {
    return (
      <OverlayFrame title="Deposit" onBack={close}>
        <Confetti count={50} />
        <div className="flex flex-col items-center gap-4 px-6 pt-14 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-muted text-lime">
            <CheckCircle2 className="size-10" aria-hidden />
          </span>
          <h2 className="text-balance text-[28px] font-semibold leading-tight tracking-tight">Check deposited. Easy, right?</h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {formatMoney(now)} is ready to use right now
            {value > now ? `, and the remaining ${formatMoney(value - now)} lands by tomorrow morning` : ''}. Hang on to the
            paper check for 14 days, then shred it.
          </p>
          <PrimaryButton onClick={close} className="mt-4">
            Back to banking
          </PrimaryButton>
        </div>
      </OverlayFrame>
    )
  }

  return (
    <OverlayFrame
      title="Deposit a check"
      onBack={() => (step === 'details' ? close() : setStep(step === 'review' ? 'capture' : 'details'))}
    >
      <div className="flex flex-col gap-5 px-5">
        <ol aria-label="Progress" className="flex gap-1.5">
          {(['details', 'capture', 'review'] as const).map((s, i) => (
            <li
              key={s}
              aria-current={step === s ? 'step' : undefined}
              className={cn('h-1.5 flex-1 rounded-full', i <= ['details', 'capture', 'review'].indexOf(step) ? 'bg-primary' : 'bg-secondary')}
            />
          ))}
        </ol>

        {step === 'details' && (
          <>
            <h2 className="text-balance text-2xl font-semibold tracking-tight">No branch trip needed. Let&apos;s get that check in.</h2>
            <Field label="Deposit to">
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
                {depositable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} •••• {a.mask}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Check amount" hint="Up to $10,000 per day">
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputClass} />
            </Field>
            <PrimaryButton disabled={!validAmount} onClick={() => setStep('capture')}>
              Next: snap the check
            </PrimaryButton>
          </>
        )}

        {step === 'capture' && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">Smile, check</h2>
            <div className="flex gap-3 rounded-2xl bg-card p-4 text-sm leading-relaxed">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <p>
                Pop it on a dark surface with good light. On the back, sign and write{' '}
                <strong>&ldquo;For mobile deposit at TD only&rdquo;</strong>.
              </p>
            </div>
            <CaptureTile side="front" file={front} onFile={setFront} />
            <CaptureTile side="back" file={back} onFile={setBack} />
            <PrimaryButton disabled={!front || !back} onClick={() => setStep('review')}>
              Review deposit
            </PrimaryButton>
          </>
        )}

        {step === 'review' && (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">Look right?</h2>
            <dl className="divide-y overflow-hidden rounded-2xl bg-card text-sm">
              {[
                ['Amount', formatMoney(value)],
                ['To', `${account?.name} •••• ${account?.mask}`],
                ['Available now', formatMoney(now)],
                ['Rest available', value > now ? 'Tomorrow by 9am' : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 p-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <PrimaryButton
              onClick={() => {
                dispatch({ type: 'deposit', accountId, amount: Math.round(value * 100) / 100, checkNo })
                setStep('done')
              }}
            >
              Deposit {formatMoney(value)}
            </PrimaryButton>
          </>
        )}
      </div>
    </OverlayFrame>
  )
}
