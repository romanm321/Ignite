'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

export function CapgoUpdater() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    CapacitorUpdater.notifyAppReady().catch((err) => {
      console.warn('[CapGo] Failed to notify app ready:', err)
    })
  }, [])

  return null
}

