'use client'

import { ShieldAlert } from 'lucide-react'
import { useBank } from '../bank-provider'

export function FraudBanner() {
  const { fraudBanner, transactions, dispatch, notify } = useBank()

  if (!fraudBanner) return null

  const lastZelle = transactions.find((t) => t.id.startsWith('zl-'))
  const recipient = lastZelle?.merchant.replace(/^Zelle®? to /, '')

  return (
    <section
      role="alert"
      aria-labelledby="fraud-banner-h"
      className="flex items-center gap-3 rounded-2xl bg-destructive p-3 text-white shadow-lg ring-2 ring-destructive/25"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
        <ShieldAlert className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="fraud-banner-h" className="text-sm font-semibold leading-tight">
          Fraud alert: action needed
        </h2>
        <p className="mt-0.5 text-xs leading-snug text-white/90">
          {recipient ? `Your Zelle payment to ${recipient} looks unusual.` : 'We spotted some unusual activity.'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <button
          type="button"
          onClick={() => dispatch({ type: 'openFraudReport', preselect: lastZelle?.id })}
          className="min-h-10 rounded-lg bg-white px-3 text-sm font-semibold text-destructive"
        >
          Review
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'fraudBannerClear' })
            notify('Got it. We’ll keep watching your account.')
          }}
          className="min-h-8 px-2 text-xs font-semibold underline underline-offset-2"
        >
          It was me
        </button>
      </div>
    </section>
  )
}
