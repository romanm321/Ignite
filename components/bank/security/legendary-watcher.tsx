'use client'

import { useEffect, useRef } from 'react'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'

const cheers: Record<string, string> = {
  device: 'Unknown device handled. Nicely done.',
  passkey: 'Passkey on. Phishers hate this one. Nicely done.',
  alerts: 'Every fraud alert is on. Nicely done.',
  stale: 'Unused app removed. Nicely done.',
  trusted: 'Trusted contact added. Legendary.',
  contact: 'Contact info confirmed. Legendary.',
  idguard: 'ID Guard is on watch. Legendary.',
}

/** Turns each completed security step into a moment, and the final one into a celebration. */
export function LegendaryWatcher() {
  const { checklist } = useTrust()
  const { notify, dispatch } = useBank()
  const doneIds = checklist.filter((c) => c.done).map((c) => c.id)
  const key = doneIds.join(',')
  const prev = useRef<string[]>(doneIds)

  useEffect(() => {
    const before = prev.current
    const now = key ? key.split(',') : []
    prev.current = now
    const fresh = now.filter((id) => !before.includes(id))
    if (fresh.length === 0) return
    if (now.length === checklist.length) {
      dispatch({
        type: 'celebrate',
        celebration: {
          kind: 'legendary',
          title: 'Legendary',
          body: 'Your security score just hit 100. Every lock is on, and we’ve got you covered 24/7.',
        },
      })
      return
    }
    notify(cheers[fresh[0]] ?? 'Nice. That’s Legendary.')
  }, [key, checklist.length, dispatch, notify])

  return null
}
