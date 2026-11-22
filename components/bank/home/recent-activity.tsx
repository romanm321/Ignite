'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { accountOf, useBank } from '../bank-provider'
import { BottomSheet } from '../overlay'
import { TransactionRow } from '../transactions/transaction-row'

/** The five most recent transactions for the account at the front of the stack, with the full list a tap away. */
export function RecentActivity({
  masked,
  accountIds,
  accountName,
  emptyText = 'Nothing here yet. We’ll show activity for this account as it happens.',
}: {
  masked: boolean
  accountIds: string[]
  accountName: string
  emptyText?: string
}) {
  const { transactions } = useBank()
  const [all, setAll] = useState(false)

  const list = transactions.filter((t) => accountIds.includes(accountOf(t)))

  return (
    <section aria-labelledby="activity-h" className="overflow-hidden rounded-3xl bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-4">
        <div className="min-w-0">
          <h2 id="activity-h" className="font-heading text-lg font-bold leading-tight">
            Recent activity
          </h2>
          <p className="truncate text-xs text-muted-foreground">{accountName}</p>
        </div>
        {list.length > 5 && (
          <button type="button" onClick={() => setAll(true)} className="flex h-9 shrink-0 items-center gap-0.5 text-sm font-semibold text-primary">
            See all <ChevronRight className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="px-4 pb-5 pt-2 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y">
          {list.slice(0, 5).map((t) => (
            <li key={t.id}>
              <TransactionRow txn={t} masked={masked} />
            </li>
          ))}
        </ul>
      )}

      {all && (
        <BottomSheet title="All activity" description={`${list.length} transactions in ${accountName}`} onClose={() => setAll(false)}>
          {/* Opening a transaction closes this list so its detail isn't stacked under the sheet. */}
          <ul className="-mx-2 divide-y" onClickCapture={() => setAll(false)}>
            {list.map((t) => (
              <li key={t.id}>
                <TransactionRow txn={t} masked={masked} />
              </li>
            ))}
          </ul>
        </BottomSheet>
      )}
    </section>
  )
}
