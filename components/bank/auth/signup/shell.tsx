'use client'

import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { ArrowLeft, Check, Copy, Delete, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputClass } from '../../overlay'

export const phases = ['About you', 'Add money'] as const
export type PhaseIndex = 0 | 1

/** Dark, minimal frame for the sign-up flow. Fills the phone; each step brings its own content and button. */
export function SignupShell({
  phase,
  stepKey,
  onBack,
  children,
  showProgress = true,
}: {
  phase: PhaseIndex
  stepKey: string
  onBack?: () => void
  children: ReactNode
  showProgress?: boolean
}) {
  return (
    <div className="onboarding-theme relative flex min-h-full flex-1 flex-col gap-6 bg-background px-5 pb-8 pt-[calc(var(--safe-top)+1.25rem)] text-foreground">
      {showProgress && (
        <div className="flex items-center gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full">
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          ) : (
            <span className="size-11 shrink-0" />
          )}
          <ol className="flex flex-1 gap-1.5" aria-label="Application progress">
            {phases.map((p, i) => (
              <li key={p} className="flex-1" aria-current={i === phase ? 'step' : undefined}>
                <span className={cn('block h-1 rounded-full transition-colors duration-500', i <= phase ? 'bg-white' : 'bg-white/20')} />
                <span className="sr-only">{p}</span>
              </li>
            ))}
          </ol>
          <span className="size-11 shrink-0" />
        </div>
      )}
      <div key={stepKey} className="flex flex-1 flex-col gap-6 animate-in fade-in slide-in-from-right-4">
        {children}
      </div>
    </div>
  )
}

export function Heading({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <div>
      {eyebrow && <p className="text-sm font-medium text-lime">{eyebrow}</p>}
      <h1 className="mt-1 text-balance font-heading text-[32px] font-bold leading-[1.1]">{title}</h1>
      {body && <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  )
}

export function Cta({
  children,
  onClick,
  disabled,
  variant = 'primary',
  busy,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  busy?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        'flex w-full items-center justify-center gap-2 font-semibold transition-opacity disabled:opacity-40',
        variant === 'primary' && 'h-14 rounded-2xl bg-primary text-primary-foreground active:opacity-80',
        variant === 'secondary' && 'h-12 rounded-2xl bg-white/10 font-medium active:bg-white/15',
        variant === 'ghost' && 'h-11 text-sm font-medium text-muted-foreground',
      )}
    >
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Field({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input {...props} className={cn(inputClass, 'font-normal')} />
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function Note({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: ReactNode }) {
  return (
    <p
      role={tone === 'warn' ? 'status' : undefined}
      className={cn('rounded-2xl p-3 text-sm leading-relaxed', tone === 'warn' ? 'bg-amber-400/15 text-amber-200' : 'bg-accent text-accent-foreground')}
    >
      {children}
    </p>
  )
}

export function SuccessMark({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center pt-4 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-accent text-primary ring-8 ring-accent/40">
        <Check className="size-10" aria-hidden />
      </span>
      <h1 className="mt-6 text-balance text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
      {body && <p className="mt-2 max-w-sm text-pretty leading-relaxed text-muted-foreground">{body}</p>}
    </div>
  )
}

export function DetailRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y overflow-hidden rounded-3xl border bg-card">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="text-right font-medium">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="tabular font-mono font-semibold">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value.replace(/\s/g, '')).catch(() => {})
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        }}
        className="flex h-11 items-center gap-1.5 rounded-xl bg-muted px-3.5 text-sm font-medium"
      >
        {copied ? <Check className="size-4 text-primary" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function Dots({ value, length, reveal }: { value: string; length: number; reveal?: boolean }) {
  return (
    <div className="flex justify-center gap-3" role="img" aria-label={`${value.length} of ${length} digits entered`}>
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          className={cn(
            'flex h-12 min-w-9 items-center justify-center rounded-xl border-2 font-mono text-xl font-semibold',
            i < value.length ? 'border-primary bg-accent' : 'border-border',
            !reveal && 'w-12',
          )}
        >
          {reveal ? value[i] : i < value.length ? '•' : ''}
        </span>
      ))}
    </div>
  )
}

export function Keypad({ value, length, onChange }: { value: string; length: number; onChange: (v: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  return (
    <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2">
      {keys.map((k, i) =>
        k === '' ? (
          <span key={i} />
        ) : (
          <button
            key={i}
            type="button"
            aria-label={k === 'del' ? 'Delete' : k}
            onClick={() => (k === 'del' ? onChange(value.slice(0, -1)) : value.length < length && onChange(value + k))}
            className="flex h-14 items-center justify-center rounded-2xl bg-muted text-xl font-semibold active:bg-accent"
          >
            {k === 'del' ? <Delete className="size-5" aria-hidden /> : k}
          </button>
        ),
      )}
    </div>
  )
}
