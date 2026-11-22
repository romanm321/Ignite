'use client'

import { PiggyBank } from 'lucide-react'
import { Field, PrimaryButton, inputClass } from '../overlay'
import { AccessPicker } from '../vaults/vault-sheets'
import { EditableVaultPicture } from '../vaults/vault-picture'
import { StepBody } from './identity-steps'
import { parseAmount, type SetupValues } from './setup-step'

/** The third step of opening savings from the Savings Vault button: name the Vault the first deposit goes into. */
export function VaultStep({ values, set, onNext }: { values: SetupValues; set: (patch: Partial<SetupValues>) => void; onNext: () => void }) {
  const valid = values.vaultName.trim().length > 0 && parseAmount(values.vaultGoal) > 0

  return (
    <StepBody title="Set up your first Vault" body="A Vault is a savings goal with its own name, picture and progress.">
      <EditableVaultPicture
        photo={values.vaultPhoto}
        kind="savings"
        onChange={(vaultPhoto) => set({ vaultPhoto })}
        alt={values.vaultPhoto ? 'Your picture for this Vault' : 'A family'}
        frameClassName="aspect-[16/10] overflow-hidden rounded-3xl"
      />

      <div className="flex items-center gap-3 rounded-2xl bg-accent p-3 text-accent-foreground">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
          <PiggyBank className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-medium leading-snug">
          Next you’ll open your savings account. Your first deposit goes straight into this Vault and starts earning interest.
        </p>
      </div>

      <Field label="Name">
        <input
          value={values.vaultName}
          maxLength={28}
          placeholder="New car, wedding, laptop…"
          onChange={(e) => set({ vaultName: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Goal">
        <span className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <input
            inputMode="decimal"
            value={values.vaultGoal}
            onChange={(e) => set({ vaultGoal: e.target.value })}
            className={`${inputClass} tabular pl-7 font-mono`}
          />
        </span>
      </Field>
      <AccessPicker value={values.vaultAccess} onChange={(vaultAccess) => set({ vaultAccess })} bonus={0} />

      <div className="mt-auto">
        <PrimaryButton disabled={!valid} onClick={onNext}>
          Continue
        </PrimaryButton>
      </div>
    </StepBody>
  )
}
