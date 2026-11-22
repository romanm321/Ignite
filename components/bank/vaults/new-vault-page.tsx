'use client'

import { useState } from 'react'
import type { Vault } from '@/lib/bank-data'
import { tierFor, vaultTotal } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { Field, OverlayFrame, PrimaryButton, inputClass } from '../overlay'
import { AccessPicker, AmountField, parseAmount } from './vault-sheets'
import { EditableVaultPicture } from './vault-picture'

type Kind = NonNullable<Vault['kind']>

const tones: Vault['tone'][] = ['lime', 'green', 'sky', 'ink']

/** Setting up a new Vault: pick a picture first, then name it, set a goal and, for savings, how it can be accessed. */
export function NewVaultPage({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const regular = kind === 'regular'
  const { vaults, dispatch, notify } = useBank()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('5000')
  const [access, setAccess] = useState<Vault['access']>('instant')
  const [photo, setPhoto] = useState<string | undefined>()
  const { tier } = tierFor(vaultTotal(vaults))
  const valid = name.trim().length > 0 && parseAmount(goal) > 0

  const create = () => {
    if (!valid) return
    dispatch({
      type: 'vaultCreate',
      vault: {
        id: `v-${Date.now()}`,
        name: name.trim().slice(0, 28),
        balance: 0,
        goal: parseAmount(goal),
        apy: 0,
        kind,
        tone: tones[vaults.length % tones.length],
        access: regular ? 'instant' : access,
        withdrawalsUsed: 0,
        lockedUntil: null,
        salarySort: 0,
        billPayeeIds: [],
        photo,
      },
    })
    notify(`${name.trim()} vault created`)
    onClose()
  }

  return (
    <OverlayFrame title={regular ? 'New Regular Vault' : 'New Savings Vault'} onBack={onClose} className="z-[55]">
      <form
        className="flex flex-col gap-5 px-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
      >
        <EditableVaultPicture
          photo={photo}
          kind={kind}
          onChange={setPhoto}
          alt={photo ? 'Your picture for this Vault' : regular ? 'A card and coins' : 'A family'}
          frameClassName="aspect-[16/10] overflow-hidden rounded-3xl"
        />
        <p className="-mt-3 text-sm text-muted-foreground">
          {regular ? 'Set money aside from TD Everyday Checking. No interest, no limits.' : 'Earns interest inside TD Growth Savings.'}
        </p>

        <Field label="Name">
          <input value={name} maxLength={28} placeholder="New car, wedding, laptop…" onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <AmountField label="Goal" value={goal} onChange={setGoal} />
        {!regular && <AccessPicker value={access} onChange={setAccess} bonus={tier.bonus} />}

        <PrimaryButton type="submit" disabled={!valid}>
          Create {regular ? 'Regular' : 'Savings'} Vault
        </PrimaryButton>
      </form>
    </OverlayFrame>
  )
}
