'use client'

import { useEffect, useRef, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { haptic, playFireworks } from '@/lib/feedback'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { Fireworks } from '../fireworks'
import { PrimaryButton } from '../overlay'

const isFull = (v: Vault) => v.goal > 0 && v.balance >= v.goal

/** Watches every Vault and celebrates the moment one reaches its goal, however the money got there. */
export function VaultGoalCelebration() {
  const { vaults, a11y, dispatch } = useBank()
  const { profile } = useTrust()
  const [vault, setVault] = useState<Vault | null>(null)
  const wasFull = useRef<Record<string, boolean> | null>(null)

  useEffect(() => {
    const now = Object.fromEntries(vaults.map((v) => [v.id, isFull(v)]))
    const before = wasFull.current
    wasFull.current = now
    if (!before) return
    const reached = vaults.find((v) => now[v.id] && before[v.id] === false)
    if (reached) setVault(reached)
  }, [vaults])

  const reachedId = vault?.id
  useEffect(() => {
    if (!reachedId) return
    playFireworks()
    if (!a11y.reduceMotion) haptic([40, 60, 40, 60, 120])
  }, [reachedId, a11y.reduceMotion])

  useEffect(() => {
    if (!vault) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setVault(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [vault])

  if (!vault) return null
  const name = profile.preferredName
  const close = () => setVault(null)

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="vault-win-h" className="absolute inset-0 z-[56] flex items-center justify-center p-6">
      <button type="button" aria-label="Close celebration" tabIndex={-1} onClick={close} className="absolute inset-0 bg-black/80 animate-in fade-in" />
      {!a11y.reduceMotion && <Fireworks />}
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-card p-6 text-center shadow-2xl animate-in zoom-in-95 fade-in">
        {vault.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vault.photo} alt="" className="size-28 rounded-full object-cover ring-4 ring-lime" />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-forest text-lime">
            <PartyPopper className="size-10" aria-hidden />
          </span>
        )}
        <div role="status">
          <h2 id="vault-win-h" className="text-balance font-heading text-3xl font-bold leading-tight">
            {name}, you did it!
          </h2>
          <p className="mt-2 text-pretty text-muted-foreground">
            Your <span className="font-semibold text-foreground">{vault.name}</span> vault is fully funded. {formatMoney(vault.goal)} saved, one
            step at a time.
          </p>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">That kind of steady saving is how big goals get done.</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <PrimaryButton
            autoFocus
            onClick={() => {
              close()
              dispatch({ type: 'openVault', id: vault.id })
            }}
          >
            See my vault
          </PrimaryButton>
          <button type="button" onClick={close} className="h-12 rounded-xl font-semibold text-primary">
            Keep going
          </button>
        </div>
      </div>
    </div>
  )
}
