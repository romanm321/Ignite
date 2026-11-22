'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronRight, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { buildExternalTransactions, institutions, type InstitutionId } from '@/lib/external-accounts'
import { useBank } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'

type Step = 'intro' | 'bank' | 'login' | 'connecting' | 'done'

/**
 * A walk-through of linking a bank at another institution through Plaid. It is a prototype: any sign-in works, and the
 * linked account's balance and spending are sample data standing in for what Plaid would return.
 */
export function PlaidLinkSheet({ onClose }: { onClose: () => void }) {
  const { externalAccounts, dispatch, notify } = useBank()
  const [step, setStep] = useState<Step>('intro')
  const [bankId, setBankId] = useState<InstitutionId | null>(null)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const bank = institutions.find((i) => i.id === bankId)
  const available = institutions.filter((i) => !externalAccounts.some((a) => a.institutionId === i.id))

  useEffect(() => {
    if (step !== 'connecting' || !bank) return
    const t = window.setTimeout(() => {
      const id = `ext-${bank.id}`
      dispatch({
        type: 'linkExternal',
        account: { id, institutionId: bank.id, institution: bank.name, name: bank.accountName, mask: bank.mask, balance: bank.balance },
        txns: buildExternalTransactions(id),
      })
      setStep('done')
    }, 1800)
    return () => window.clearTimeout(t)
  }, [step, bank, dispatch])

  return (
    <BottomSheet
      title={step === 'done' ? 'Account linked' : 'Link an account'}
      description={step === 'intro' ? 'Bring spending from another bank into Insights.' : undefined}
      onClose={onClose}
    >
      {step === 'intro' && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-semibold">Secure and read-only</span>
                <span className="text-muted-foreground">We connect through Plaid. TD can see balances and transactions, and can never move money.</span>
              </span>
            </li>
            <li className="flex gap-3">
              <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block font-semibold">You stay in control</span>
                <span className="text-muted-foreground">Remove the link any time from the account filter.</span>
              </span>
            </li>
          </ul>
          <PrimaryButton onClick={() => setStep('bank')} disabled={available.length === 0}>
            Continue
          </PrimaryButton>
          <p className="text-center text-xs text-muted-foreground">Powered by Plaid</p>
        </div>
      )}

      {step === 'bank' && (
        <ul className="flex flex-col gap-2" aria-label="Choose your bank">
          {available.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  setBankId(i.id)
                  setStep('login')
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-card px-4 py-2 text-left"
              >
                <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold', i.color)}>{i.name[0]}</span>
                <span className="min-w-0 flex-1 font-medium">{i.name}</span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === 'login' && bank && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setStep('connecting')
          }}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <span className={cn('flex size-11 items-center justify-center rounded-xl text-sm font-bold', bank.color)}>{bank.name[0]}</span>
            <p className="text-sm font-medium">Sign in to {bank.name}</p>
          </div>
          <Field label="Username">
            <input value={user} onChange={(e) => setUser(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
          <Field label="Password">
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
          <PrimaryButton type="submit" disabled={!user.trim() || !pass.trim()}>
            Connect
          </PrimaryButton>
          <p className="text-center text-xs text-muted-foreground">Prototype: any username and password works. Nothing is sent anywhere.</p>
        </form>
      )}

      {step === 'connecting' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
          <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
          <p className="font-medium">Connecting to {bank?.name}…</p>
          <p className="text-sm text-muted-foreground">Fetching your balance and the last 40 days of transactions.</p>
        </div>
      )}

      {step === 'done' && bank && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground">
              <Check className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">
                {bank.name} · {bank.accountName} ••{bank.mask}
              </p>
              <p className="text-sm">{formatMoney(bank.balance)} balance</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">It&apos;s now included in your charts. Switch it on or off from the account filter.</p>
          <PrimaryButton
            onClick={() => {
              notify(`${bank.name} linked`)
              onClose()
            }}
          >
            See it in Insights
          </PrimaryButton>
        </div>
      )}
    </BottomSheet>
  )
}
