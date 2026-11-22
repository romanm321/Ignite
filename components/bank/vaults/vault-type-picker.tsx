'use client'

import { ChevronRight, CirclePlay, PiggyBank, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useSavingsHome } from './use-savings-home'

type Kind = 'regular' | 'savings'

/** The Vaults landing: choose where the new Vault will live. */
export function VaultTypePicker() {
  const { accounts, dispatch } = useBank()
  const savings = useSavingsHome()
  const checking = accounts.find((a) => a.id === 'chk')

  const options: {
    kind: Kind
    icon: typeof Wallet
    title: string
    body: string
    tint: string
  }[] = [
    {
      kind: 'regular',
      icon: Wallet,
      title: 'Regular Vault',
      body: checking ? `Linked to ${checking.name}` : 'Linked to Everyday Checking',
      tint: 'bg-sky-200 text-sky-950',
    },
    {
      kind: 'savings',
      icon: PiggyBank,
      title: 'Savings Vault',
      body: savings.account ? 'Earn up to 4.60% interest' : 'Earn up to 4.60%. Opens savings first',
      tint: 'bg-lime text-lime-foreground',
    },
  ]

  const choose = (kind: Kind) => dispatch({ type: 'startVaultFlow', kind })

  return (
    <section aria-labelledby="vault-type-h" className="flex flex-col gap-3">
      <div className="px-1">
        <h2 id="vault-type-h" className="font-heading text-2xl font-bold leading-tight">
          Create a Vault
        </h2>
        <p className="mt-1 text-muted-foreground">What type of Vault would you like to set up?</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'showVaultsStory' })}
          className="mt-1 -ml-1 flex h-11 items-center gap-1.5 px-1 text-sm font-semibold text-primary"
        >
          <CirclePlay className="size-4" aria-hidden /> How Vaults work
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {options.map(({ kind, icon: Icon, title, body, tint }) => (
          <li key={kind}>
            <button
              type="button"
              onClick={() => choose(kind)}
              className="flex w-full items-center gap-3 rounded-3xl bg-card p-3 text-left outline-offset-2 active:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className={cn('flex size-14 shrink-0 items-center justify-center rounded-2xl', tint)}>
                <Icon className="size-7" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg font-bold leading-tight">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

    </section>
  )
}
