'use client'

import { useState } from 'react'
import { Coins, Receipt, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, type Vault } from '@/lib/bank-data'
import { NEXT_PAYDAY, PAYCHECK, PAYCHECK_FROM, roundUpsThisMonth } from '@/lib/vaults'
import { useBank } from '../bank-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { SectionHeader, Switch } from '../primitives'
import { ChoiceChips } from './vault-sheets'

const sortOptions = [0, 100, 200, 300, 500] as const

export function VaultHabits({ vault }: { vault: Vault }) {
  const { roundUpsVaultId, vaults, transactions, dispatch, notify } = useBank()
  const roundUpsHere = roundUpsVaultId === vault.id
  const otherRoundUps = vaults.find((v) => v.id === roundUpsVaultId && v.id !== vault.id)
  const [sorting, setSorting] = useState(false)

  return (
    <section aria-labelledby="habits-h" className="flex flex-col gap-3">
      <SectionHeader id="habits-h" title="Saving habits" />
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        <li className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
            <Coins className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Round-ups</p>
            <p className="text-xs text-muted-foreground">
              {roundUpsHere
                ? `Spare change from every card purchase lands here · ${formatMoney(roundUpsThisMonth(transactions))} this month`
                : otherRoundUps
                  ? `Currently going to ${otherRoundUps.name}. Turn on to move them here.`
                  : 'Round card purchases up to the next dollar and save the change'}
            </p>
          </div>
          <Switch
            label="Round-ups"
            checked={roundUpsHere}
            onChange={(on) => {
              dispatch({ type: 'roundUpsVault', vaultId: on ? vault.id : null })
              notify(on ? `Round-ups now go to ${vault.name}` : 'Round-ups off')
            }}
          />
        </li>
        <li>
          <button
            type="button"
            onClick={() => setSorting(true)}
            className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
              <Wallet className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Salary Sorter</span>
              <span className="block text-xs text-muted-foreground">
                {vault.salarySort
                  ? `${formatMoney(vault.salarySort)} from every paycheck · next on ${NEXT_PAYDAY}`
                  : `Set aside part of each ${PAYCHECK_FROM} paycheck automatically`}
              </span>
            </span>
            <span className="text-sm font-semibold text-primary">{vault.salarySort ? 'Edit' : 'Set up'}</span>
          </button>
        </li>
      </ul>
      {sorting && <SalarySortSheet vault={vault} onClose={() => setSorting(false)} />}
    </section>
  )
}

function SalarySortSheet({ vault, onClose }: { vault: Vault; onClose: () => void }) {
  const { vaults, dispatch, notify } = useBank()
  const [amount, setAmount] = useState<number>(vault.salarySort)
  const otherSorted = vaults.filter((v) => v.id !== vault.id).reduce((s, v) => s + v.salarySort, 0)
  const left = PAYCHECK - otherSorted - amount
  const preset = sortOptions.find((n) => n === amount) ?? null
  return (
    <BottomSheet
      title="Salary Sorter"
      description={`When your ${formatMoney(PAYCHECK)} ${PAYCHECK_FROM} paycheck lands on ${NEXT_PAYDAY}, sort part of it into ${vault.name} before you spend it.`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <ChoiceChips
          label="Amount per paycheck"
          options={sortOptions}
          value={preset}
          onChange={setAmount}
          format={(n) => (n === 0 ? 'Off' : `$${n}`)}
        />
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Sorted into all vaults</dt>
            <dd className="tabular font-mono font-semibold">{formatMoney(otherSorted + amount)}</dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Stays in checking</dt>
            <dd className={cn('tabular font-mono font-semibold', left < 0 && 'text-destructive')}>{formatMoney(left)}</dd>
          </div>
        </dl>
        <PrimaryButton
          disabled={left < 0}
          onClick={() => {
            dispatch({ type: 'vaultPatch', vaultId: vault.id, patch: { salarySort: amount } })
            notify(amount ? `${formatMoney(amount)} will be sorted into ${vault.name} every payday` : 'Salary Sorter off for this vault')
            onClose()
          }}
        >
          Save
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function VaultBills({ vault }: { vault: Vault }) {
  const { payees, vaults, dispatch, notify } = useBank()
  return (
    <section aria-labelledby="vault-bills-h" className="flex flex-col gap-3">
      <SectionHeader id="vault-bills-h" title="Pay bills from this vault" />
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {payees.map((p) => {
          const linked = vault.billPayeeIds.includes(p.id)
          const elsewhere = vaults.find((v) => v.id !== vault.id && v.billPayeeIds.includes(p.id))
          const short = vault.balance < p.amountDue
          return (
            <li key={p.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Receipt className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(p.amountDue)} · {p.paid ? 'Paid' : `due in ${p.dueIn} days`}
                    {elsewhere && !linked ? ` · paid from ${elsewhere.name}` : ''}
                  </p>
                </div>
                <Switch
                  label={`Pay ${p.name} from ${vault.name}`}
                  checked={linked}
                  onChange={(on) => {
                    dispatch({ type: 'vaultBillPayee', vaultId: vault.id, payeeId: p.id, on })
                    notify(on ? `${p.name} will be paid from ${vault.name}` : `${p.name} back to checking`)
                  }}
                />
              </div>
              {linked && !p.paid && (
                <button
                  type="button"
                  disabled={short}
                  onClick={() => {
                    dispatch({ type: 'vaultPayBill', vaultId: vault.id, payeeId: p.id })
                    notify(`${p.name} paid ${formatMoney(p.amountDue)} from ${vault.name}`)
                  }}
                  className="ml-[52px] h-11 rounded-xl bg-shield-50 px-4 text-sm font-semibold text-shield-700 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {short ? 'Not enough in this vault yet' : `Pay ${formatMoney(p.amountDue)} now`}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="px-1 text-xs text-muted-foreground">
        Linked bills are paid from this vault on their due date, so bill money never mixes with spending money.
      </p>
    </section>
  )
}
