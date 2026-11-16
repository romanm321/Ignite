'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Transaction } from '@/lib/bank-data'
import { accountOf, useBank } from '../bank-provider'
import { BottomSheet } from '../overlay'
import { SectionHeader } from '../primitives'
import { TransactionRow } from '../transactions/transaction-row'

const accountShort: Record<string, string> = { chk: 'Checking', sav: 'Savings', cc: 'Card', cd: 'CD' }

/** The last few transactions across every account, with the full list a tap away. */
export function RecentActivity({ masked }: { masked: boolean }) {
  const { transactions } = useBank()
  const [all, setAll] = useState(false)
  if (transactions.length === 0) return null

  const label = (t: Transaction) => accountShort[accountOf(t)]

  return (
    <section aria-labelledby="activity-h" className="flex flex-col gap-3">
      <SectionHeader
        id="activity-h"
        title="Recent activity"
        action={
          transactions.length > 5 ? (
            <button type="button" onClick={() => setAll(true)} className="flex h-9 items-center gap-0.5 text-sm font-medium text-primary">
              See all <ChevronRight className="size-4" aria-hidden />
            </button>
          ) : undefined
        }
      />
      <ul className="divide-y overflow-hidden rounded-3xl bg-card">
        {transactions.slice(0, 5).map((t) => (
          <li key={t.id}>
            <TransactionRow txn={t} masked={masked} accountLabel={label(t)} />
          </li>
        ))}
      </ul>

      {all && (
        <BottomSheet title="All activity" description={`${transactions.length} transactions across your accounts`} onClose={() => setAll(false)}>
          {/* Opening a transaction closes this list so its detail isn't stacked under the sheet. */}
          <ul className="-mx-2 divide-y" onClickCapture={() => setAll(false)}>
            {transactions.map((t) => (
              <li key={t.id}>
                <TransactionRow txn={t} masked={masked} accountLabel={label(t)} />
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </section>
  )
}
