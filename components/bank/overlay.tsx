'use client'

import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OverlayFrame({
  title,
  onBack,
  right,
  children,
  tone = 'default',
}: {
  title: string
  onBack: () => void
  right?: ReactNode
  children: ReactNode
  tone?: 'default' | 'forest'
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-30 animate-in slide-in-from-right-8 fade-in',
        tone === 'forest' ? 'bg-forest text-forest-foreground' : 'bg-background',
      )}
    >
      {/* Scroll container is intentionally unpositioned so BottomSheets anchor to the fixed outer frame. */}
      <div className="no-scrollbar h-full overflow-y-auto pb-10">
      <header
        className={cn(
          'sticky top-0 z-10 flex items-center gap-2 px-2 py-2 backdrop-blur',
          tone === 'forest' ? 'bg-forest/90' : 'bg-background/90',
        )}
      >
        <button type="button" onClick={onBack} aria-label="Back" className="flex size-11 items-center justify-center rounded-full">
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <h1 className="flex-1 text-lg font-semibold">{title}</h1>
        {right}
      </header>
      {children}
      </div>
    </div>
  )
}

export function BottomSheet({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const portalTarget = typeof document === 'undefined' ? null : document.getElementById('phone-sheet-root')

  const sheet = (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-forest/50 animate-in fade-in" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="no-scrollbar relative max-h-[88%] overflow-y-auto rounded-t-[14px] bg-background px-5 pb-8 pt-3 text-foreground animate-in slide-in-from-bottom-8"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )

  return portalTarget ? createPortal(sheet, portalTarget) : sheet
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'h-12 w-full rounded-xl border bg-card px-3.5 text-base outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20'

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-shield px-5 font-bold text-shield-foreground transition-opacity disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}
