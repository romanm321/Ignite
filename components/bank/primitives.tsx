'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const TD_GREEN = '#54B848'

const TD_GLYPH_PATH =
  'M134 230H870C1060 230 1138 340 1138 557C1138 800 1050 897 840 897H542V360H692V802H835C930 802 977 740 977 557C977 380 925 325 828 325H500V897H352V325H134Z'

export function TdGlyph({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="134 230 1004 667"
      fill="currentColor"
      className={cn('h-4 w-auto shrink-0', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={TD_GLYPH_PATH} />
    </svg>
  )
}

export function TdMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="TD"
      style={{ backgroundColor: TD_GREEN }}
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-white', className)}
    >
      <TdGlyph className="h-auto w-[72%]" />
    </span>
  )
}

export function SectionHeader({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 id={id} className="text-[15px] font-semibold tracking-tight">
        {title}
      </h2>
      {action}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  tone = 'primary',
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  tone?: 'primary' | 'destructive'
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 min-w-11 items-center justify-end"
    >
      <span
        className={cn(
          'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
          checked ? (tone === 'destructive' ? 'bg-destructive' : 'bg-primary') : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      {children}
    </span>
  )
}

export function ScreenHeader({ title, subtitle, right, titleClassName }: { title: string; subtitle?: string; right?: ReactNode; titleClassName?: string }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pb-2 pt-4">
      <div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <h1 className={cn('text-balance text-[28px] font-semibold leading-tight tracking-tight', titleClassName)}>{title}</h1>
      </div>
      {right}
    </header>
  )
}
