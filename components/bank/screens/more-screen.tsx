'use client'

import { useState } from 'react'
import { Building2, Phone, PhoneCall } from 'lucide-react'
import { branches } from '@/lib/bank-data'
import { useBank } from '../bank-provider'
import { BottomSheet } from '../overlay'
import { ScreenHeader, SectionHeader } from '../primitives'
import { SubNav, moreSubNav } from '../nav'
import { TediHelpWidget } from '../help/tedi-help-widget'

export function SettingsScreen() {
  const { dispatch } = useBank()
  const [calling, setCalling] = useState(false)
  const nearestBranch = branches.filter((b) => b.openNow).sort((x, y) => x.distanceMi - y.distanceMi)[0] ?? branches[0]

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Help" subtitle="Answers and people, any time" />
      <SubNav label="Help sections" items={moreSubNav} />

      <div className="flex flex-col gap-6 px-4 pt-2">
        <TediHelpWidget />

        <section aria-labelledby="people-h" className="flex flex-col gap-3">
          <SectionHeader id="people-h" title="Talk to a person" />
          <ul className="grid grid-cols-2 gap-2">
            <li>
              <button
                type="button"
                onClick={() => dispatch({ type: 'navigate', tab: 'branches', focusBranchId: nearestBranch.id, focusMode: 'in-branch' })}
                className="flex h-full min-h-32 w-full flex-col items-start gap-3 rounded-3xl bg-card p-4 text-left active:bg-muted/60"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-lime">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold leading-tight">Branch appointment</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">In person or by video</span>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setCalling(true)}
                className="flex h-full min-h-32 w-full flex-col items-start gap-3 rounded-3xl bg-card p-4 text-left active:bg-muted/60"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-lime">
                  <PhoneCall className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold leading-tight">Call us</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">Now, or at a time you pick</span>
                </span>
              </button>
            </li>
          </ul>
        </section>
      </div>

      {calling && (
        <BottomSheet title="Call us" description="Pick what works for you." onClose={() => setCalling(false)}>
          <ul className="flex flex-col gap-2">
            <li>
              <a href="tel:18887511777" className="flex min-h-16 items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 active:bg-muted">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
                  <Phone className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Call now</span>
                  <span className="block text-sm text-muted-foreground">1-888-751-1777 · Real humans, 24/7</span>
                </span>
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setCalling(false)
                  dispatch({ type: 'navigate', tab: 'branches', focusBranchId: nearestBranch.id, focusMode: 'phone' })
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-left active:bg-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest text-lime">
                  <PhoneCall className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Schedule a call</span>
                  <span className="block text-sm text-muted-foreground">We call you at a time you pick</span>
                </span>
              </button>
            </li>
          </ul>
        </BottomSheet>
      )}
    </div>
  )
}
