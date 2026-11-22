'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { Switch } from '../primitives'

export function SecuritySheet({ onClose }: { onClose: () => void }) {
  const { biometrics, passkey, dispatch } = useTrust()
  const { notify } = useBank()
  const both = biometrics && passkey

  return (
    <BottomSheet title="Lock down your account" description="Two quick switches make it much harder for anyone but you to get in." onClose={onClose}>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        {[
          { label: 'Face ID sign-in', body: 'Open the app with a glance instead of a password.', on: biometrics, set: (on: boolean) => dispatch({ type: 'biometrics', on }) },
          { label: 'Passkey', body: 'A phishing-proof way to sign in. Nothing to remember or type.', on: passkey, set: (on: boolean) => dispatch({ type: 'passkey', on }) },
        ].map((row) => (
          <li key={row.label} className="flex min-h-16 items-center gap-3 px-4 py-2">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{row.label}</span>
              <span className="block text-xs text-muted-foreground">{row.body}</span>
            </span>
            <Switch checked={row.on} label={row.label} onChange={row.set} />
          </li>
        ))}
      </ul>
      <PrimaryButton
        className="mt-4"
        onClick={() => {
          if (both) notify('Biometrics and passkey are on. Nice and secure.')
          onClose()
        }}
      >
        {both ? 'All set' : 'Done for now'}
      </PrimaryButton>
    </BottomSheet>
  )
}

const alertOptions = [
  { key: 'deposits', label: 'Deposits', body: 'When money lands in your account' },
  { key: 'billsDue', label: 'Bills due', body: 'A heads-up before payments are due' },
  { key: 'lowBalance', label: 'Low balance', body: 'When checking dips under $250' },
  { key: 'subscriptionChanges', label: 'Subscription changes', body: 'Price rises and new recurring charges' },
] as const

export function AlertsSetupSheet({ onClose }: { onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [picked, setPicked] = useState<string[]>(alertOptions.map((o) => o.key))

  const save = () => {
    dispatch({
      type: 'alertPrefs',
      patch: { push: true, ...Object.fromEntries(alertOptions.map((o) => [o.key, picked.includes(o.key)])) },
    })
    dispatch({ type: 'setupDone', id: 'alerts' })
    onClose()
  }

  return (
    <BottomSheet title="Choose your alerts" description="Push notifications, only for the things you pick." onClose={onClose}>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        {alertOptions.map((o) => (
          <li key={o.key} className="flex min-h-16 items-center gap-3 px-4 py-2">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.body}</span>
            </span>
            <Switch
              checked={picked.includes(o.key)}
              label={o.label}
              onChange={(on) => setPicked((cur) => (on ? [...cur, o.key] : cur.filter((k) => k !== o.key)))}
            />
          </li>
        ))}
      </ul>
      <PrimaryButton className="mt-4" disabled={picked.length === 0} onClick={save}>
        Turn on alerts
      </PrimaryButton>
    </BottomSheet>
  )
}

const subscriptionOptions = [
  { key: 'price', label: 'Price rises', body: 'Know when a subscription costs more' },
  { key: 'trials', label: 'Free trials ending', body: 'A reminder before you get charged' },
  { key: 'find', label: 'Find recurring payments', body: 'Spot subscriptions in your activity' },
] as const

export function SubscriptionsSetupSheet({ onClose }: { onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [picked, setPicked] = useState<string[]>(subscriptionOptions.map((o) => o.key))

  return (
    <BottomSheet title="Manage subscriptions" description="We’ll watch your recurring payments and tell you when something changes." onClose={onClose}>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card">
        {subscriptionOptions.map((o) => (
          <li key={o.key} className="flex min-h-16 items-center gap-3 px-4 py-2">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.body}</span>
            </span>
            <Switch
              checked={picked.includes(o.key)}
              label={o.label}
              onChange={(on) => setPicked((cur) => (on ? [...cur, o.key] : cur.filter((k) => k !== o.key)))}
            />
          </li>
        ))}
      </ul>
      <PrimaryButton
        className="mt-4"
        disabled={picked.length === 0}
        onClick={() => {
          dispatch({ type: 'alertPrefs', patch: { subscriptionChanges: picked.includes('price') } })
          dispatch({ type: 'setupDone', id: 'subscriptions' })
          onClose()
        }}
      >
        Turn on
      </PrimaryButton>
    </BottomSheet>
  )
}

export function PaperlessSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useTrust()
  const { notify } = useBank()

  return (
    <BottomSheet title="Go paperless" description="Statements and tax slips arrive in the app the day they’re ready, and stay there for 7 years." onClose={onClose}>
      <ul className="flex flex-col gap-2 text-sm">
        {['No paper clutter or mailbox runs', 'Safer than mail, protected by your sign-in', 'Download or share any statement in a tap'].map((line) => (
          <li key={line} className="flex items-start gap-2 rounded-2xl bg-card p-3">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
      <PrimaryButton
        className="mt-4"
        onClick={() => {
          dispatch({ type: 'profile', patch: { paperless: true } })
          notify('Paperless statements are on')
          onClose()
        }}
      >
        Enroll in paperless
      </PrimaryButton>
    </BottomSheet>
  )
}

const billers = ['Con Edison', 'Verizon Wireless', 'Netflix', 'Spotify', 'Rent or mortgage']

export function PaymentSwitchSheet({ onClose }: { onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [picked, setPicked] = useState<string[]>(billers.slice(0, 3))

  const toggle = (name: string) => setPicked((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]))

  return (
    <BottomSheet
      title="Move your bills to TD"
      description="Pick the bills and subscriptions you pay today. We contact each biller and switch them to TD Everyday Checking for you."
      onClose={onClose}
    >
      <ul className="flex flex-col gap-2">
        {billers.map((name) => {
          const on = picked.includes(name)
          return (
            <li key={name}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(name)}
                className={cn('flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left font-medium', on ? 'border-primary bg-accent' : 'border-transparent bg-card')}
              >
                <span className={cn('flex size-6 items-center justify-center rounded-md border-2', on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
                  {on && <Check className="size-4" aria-hidden />}
                </span>
                {name}
              </button>
            </li>
          )
        })}
      </ul>
      <PrimaryButton
        className="mt-4"
        disabled={picked.length === 0}
        onClick={() => {
          dispatch({ type: 'setupDone', id: 'paymentSwitch' })
          notify(`${picked.length} bill${picked.length === 1 ? '' : 's'} on the way to TD. Switching takes about 5 business days.`)
          onClose()
        }}
      >
        Move {picked.length} bill{picked.length === 1 ? '' : 's'} to TD
      </PrimaryButton>
    </BottomSheet>
  )
}

export function SavingsSheet({ onClose }: { onClose: () => void }) {
  const { accounts, dispatch, notify } = useBank()
  const checking = accounts.find((a) => a.id === 'chk')?.balance ?? 0
  const options = [0, 25, 50, 100].filter((n) => n <= checking)
  const [amount, setAmount] = useState(options.includes(25) ? 25 : 0)

  return (
    <BottomSheet title="Open TD Growth Savings" description="4.60% interest, no monthly fee and no minimum balance." onClose={onClose}>
      <p className="mb-2 text-sm font-medium">Start with a transfer from checking</p>
      <div role="radiogroup" aria-label="Opening deposit" className="grid grid-cols-4 gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={amount === n}
            onClick={() => setAmount(n)}
            className={cn('min-h-12 rounded-xl border text-sm font-semibold', amount === n ? 'border-primary bg-accent' : 'bg-card')}
          >
            {n === 0 ? 'Later' : `$${n}`}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Checking balance {formatMoney(checking)}. FDIC insured up to $250,000.</p>
      <PrimaryButton
        className="mt-4"
        onClick={() => {
          dispatch({ type: 'openSavings', amount })
          notify(amount > 0 ? `Savings account open with ${formatMoney(amount)}` : 'Savings account open. Add money any time.')
          onClose()
        }}
      >
        Open savings account
      </PrimaryButton>
    </BottomSheet>
  )
}
