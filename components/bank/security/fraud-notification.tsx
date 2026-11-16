'use client'

import { useEffect } from 'react'
import { ShieldAlert, X } from 'lucide-react'
import { useBank } from '../bank-provider'

const DELAY_MS = 5000

export function FraudNotification() {
  const { fraudArm, fraudAlert, transactions, dispatch } = useBank()

  useEffect(() => {
    if (!fraudArm) return
    const timer = setTimeout(() => dispatch({ type: 'fraudAlert', visible: true }), DELAY_MS)
    return () => clearTimeout(timer)
  }, [fraudArm, dispatch])

  if (!fraudAlert) return null

  const open = () => {
    const lastZelle = transactions.find((t) => t.id.startsWith('zl-'))
    dispatch({ type: 'openFraudReport', preselect: lastZelle?.id })
  }

  return (
    <div className="absolute inset-x-3 top-3 z-[80] flex items-stretch overflow-hidden rounded-2xl border bg-card/95 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-4">
      <button type="button" onClick={open} className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-white">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">TD Fraud Alert</span>
            <span>now</span>
          </span>
          <span className="mt-0.5 block font-semibold leading-tight">You have a fraud notification</span>
          <span className="block text-sm leading-snug text-muted-foreground">Tap to review recent activity and protect your account.</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'fraudAlert', visible: false })}
        aria-label="Dismiss fraud notification"
        className="flex w-11 shrink-0 items-start justify-center pt-3 text-muted-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
