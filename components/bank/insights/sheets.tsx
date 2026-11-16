'use client'

import { useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/bank-data'
import { categoryChoices, categoryOf, usualPerCycle, type CategoryChoice, type FlexibleCategory } from '@/lib/insights'
import { useBank } from '../bank-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { useInsights } from './use-insights'

const STEP = 5

export function BudgetSheet({ category, onClose }: { category: FlexibleCategory; onClose: () => void }) {
  const { budgets, dispatch, notify } = useBank()
  const { month, showWhole } = useInsights()
  const usual = usualPerCycle(month.flexible.find((r) => r.category === category)?.amount ?? 0)
  const existing = budgets[category]
  const [amount, setAmount] = useState(existing ?? (usual > 0 ? Math.round(usual * 0.9 / STEP) * STEP : 50))

  const presets = usual > 0 ? [usual, Math.round((usual * 0.9) / STEP) * STEP, Math.round((usual * 0.8) / STEP) * STEP] : [50, 100, 150]
  const presetLabels = usual > 0 ? ['Usual', '10% less', '20% less'] : ['$50', '$100', '$150']

  const save = () => {
    dispatch({ type: 'setBudget', category, amount })
    notify(`${category} limit set to ${showWhole(amount)} per payday`)
    onClose()
  }

  return (
    <BottomSheet
      title={`${category} limit`}
      description={usual > 0 ? `Per payday cycle. You usually spend about ${showWhole(usual)}.` : 'Per payday cycle.'}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3">
          <button
            type="button"
            aria-label={`Lower ${category} limit by ${STEP} dollars`}
            onClick={() => setAmount((a) => Math.max(STEP, a - STEP))}
            className="flex size-12 items-center justify-center rounded-full border bg-card"
          >
            <Minus className="size-5" aria-hidden />
          </button>
          <p className="tabular font-mono text-4xl font-semibold" aria-live="polite">
            ${amount}
          </p>
          <button
            type="button"
            aria-label={`Raise ${category} limit by ${STEP} dollars`}
            onClick={() => setAmount((a) => a + STEP)}
            className="flex size-12 items-center justify-center rounded-full border bg-card"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>

        <div role="group" aria-label="Quick amounts" className="grid grid-cols-3 gap-2">
          {presets.map((p, i) => (
            <button
              key={presetLabels[i]}
              type="button"
              aria-pressed={amount === p}
              onClick={() => setAmount(p)}
              className={cn('flex h-14 flex-col items-center justify-center rounded-xl border text-sm', amount === p ? 'border-primary bg-accent font-semibold' : 'bg-card')}
            >
              <span className="tabular font-mono">${p}</span>
              <span className="text-xs text-muted-foreground">{presetLabels[i]}</span>
            </button>
          ))}
        </div>

        <PrimaryButton onClick={save}>Save limit</PrimaryButton>
        {existing !== undefined && (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'setBudget', category, amount: null })
              notify(`${category} limit removed`)
              onClose()
            }}
            className="h-11 text-sm font-semibold text-destructive"
          >
            Remove limit
          </button>
        )}
      </div>
    </BottomSheet>
  )
}

export function CategorySheet({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const { categoryOverrides, dispatch, notify } = useBank()
  const current = categoryOf(transaction, categoryOverrides)

  const choose = (category: CategoryChoice) => {
    if (category !== current) {
      dispatch({ type: 'recategorize', merchant: transaction.merchant, category })
      notify(`${transaction.merchant} is now ${category}`)
    }
    onClose()
  }

  return (
    <BottomSheet
      title={transaction.merchant}
      description="Pick a category. We’ll use it for every purchase here."
      onClose={onClose}
    >
      <div role="radiogroup" aria-label="Category" className="flex flex-col overflow-hidden rounded-2xl border bg-card">
        {categoryChoices.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={current === c}
            onClick={() => choose(c)}
            className="flex min-h-12 items-center justify-between border-b px-4 text-left last:border-b-0"
          >
            <span className="flex flex-col">
              <span className={cn('font-medium', current === c && 'text-primary')}>{c}</span>
              {c === 'Bills' && <span className="text-xs text-muted-foreground">Set aside, not part of everyday spending</span>}
            </span>
            {current === c && <Check className="size-5 text-primary" aria-hidden />}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
