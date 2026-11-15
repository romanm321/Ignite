'use client'

import { useEffect } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000, 120_000, 300_000]

export function CapgoUpdater() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let disposed = false
    let retryAttempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let retryInFlight = false
    let listenerHandle: PluginListenerHandle | null = null

    const clearRetryTimer = () => {
      if (retryTimer !== null) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
    }

    /**
     * Deletes all obsolete, superseded, or errored bundles from device storage,
     * keeping only `builtin`, the currently active bundle, and any valid pending `next` bundle.
     */
    const cleanupOldBundles = async () => {
      try {
        const failed = await CapacitorUpdater.getFailedUpdate().catch(() => null)
        if (failed?.bundle?.id && failed.bundle.id !== 'builtin') {
          await CapacitorUpdater.delete({ id: failed.bundle.id }).catch(() => {})
        }

        const [currentRes, nextBundle, listRes] = await Promise.all([
          CapacitorUpdater.current().catch(() => null),
          CapacitorUpdater.getNextBundle().catch(() => null),
          CapacitorUpdater.list().catch(() => ({ bundles: [] })),
        ])

        const activeId = currentRes?.bundle?.id
        const pendingId =
          nextBundle && nextBundle.status !== 'error' ? nextBundle.id : null

        for (const bundle of listRes.bundles ?? []) {
          if (!bundle?.id || bundle.id === 'builtin') continue

          const isCurrent = bundle.id === activeId
          const isPendingNext = bundle.id === pendingId && bundle.status !== 'error'

          if (!isCurrent && !isPendingNext) {
            await CapacitorUpdater.delete({ id: bundle.id }).catch(() => {})
          }
        }
      } catch (err) {
        console.warn('[CapGo] Bundle cleanup error (non-fatal):', err)
      }
    }

    /**
     * Retries update check and bundle download if a previous check or download failed.
     * Wrapped in try/catch so network or download issues never crash the app.
     */
    const attemptUpdateRetry = async () => {
      if (disposed || retryInFlight) return
      retryInFlight = true

      try {
        await cleanupOldBundles()

        // 1. Trigger native auto-update check pipeline
        const triggerRes = await CapacitorUpdater.triggerUpdateCheck().catch(() => null)

        // 2. Fallback explicit check & download if native trigger is unavailable or idle
        const [currentRes, nextBundle, latest] = await Promise.all([
          CapacitorUpdater.current().catch(() => null),
          CapacitorUpdater.getNextBundle().catch(() => null),
          CapacitorUpdater.getLatest().catch(() => null),
        ])

        if (
          latest &&
          latest.url &&
          latest.kind !== 'up_to_date' &&
          latest.kind !== 'blocked' &&
          latest.version &&
          latest.version !== currentRes?.bundle?.version &&
          latest.version !== nextBundle?.version
        ) {
          const downloaded = await CapacitorUpdater.download({
            url: latest.url,
            version: latest.version,
            sessionKey: latest.sessionKey,
            checksum: latest.checksum,
            manifest: latest.manifest,
          })

          if (downloaded?.id) {
            await CapacitorUpdater.next({ id: downloaded.id })
            retryAttempt = 0
            clearRetryTimer()
            await cleanupOldBundles()
          }
        } else if (latest?.kind === 'up_to_date') {
          retryAttempt = 0
          clearRetryTimer()
        } else if (!triggerRes && !latest) {
          scheduleRetry('Update check returned no response')
        }
      } catch (err) {
        console.warn('[CapGo] Retry attempt failed (will retry later):', err)
        scheduleRetry(err instanceof Error ? err.message : 'retry error')
      } finally {
        retryInFlight = false
      }
    }

    const scheduleRetry = (reason: string) => {
      if (disposed || retryTimer !== null) return
      if (retryAttempt >= RETRY_DELAYS_MS.length) {
        // Cap reached for this cycle; will reset automatically on next 'online' or foreground event
        return
      }

      const delay = RETRY_DELAYS_MS[retryAttempt] ?? 60_000
      retryAttempt += 1
      console.warn(`[CapGo] Scheduling update retry #${retryAttempt} in ${delay / 1000}s (${reason})`)

      retryTimer = setTimeout(() => {
        retryTimer = null
        void attemptUpdateRetry()
      }, delay)
    }

    const initUpdater = async () => {
      try {
        // 1. CRITICAL: Immediately confirm bundle loaded to prevent rollback
        await CapacitorUpdater.notifyAppReady()
      } catch (err) {
        console.warn('[CapGo] notifyAppReady error:', err)
      }

      if (disposed) return

      // 2. Clean up any old/replaced/failed bundles after successful startup
      await cleanupOldBundles()

      // 3. Attach unified updater event listener to monitor downloads, completions, and failures
      try {
        listenerHandle = await CapacitorUpdater.addListener('updaterEvent', (event) => {
          if (disposed) return

          switch (event.type) {
            case 'downloadComplete': {
              retryAttempt = 0
              clearRetryTimer()
              const bundleId = event.data?.bundle?.id
              if (bundleId) {
                void CapacitorUpdater.next({ id: bundleId })
                  .catch(() => {})
                  .then(() => cleanupOldBundles())
              }
              break
            }
            case 'set':
            case 'noNeedUpdate': {
              retryAttempt = 0
              clearRetryTimer()
              void cleanupOldBundles()
              break
            }
            case 'downloadFailed': {
              void cleanupOldBundles()
              scheduleRetry(`downloadFailed (${event.data?.version ?? 'unknown'})`)
              break
            }
            case 'updateFailed': {
              void cleanupOldBundles()
              scheduleRetry(`updateFailed (${event.data?.bundle?.version ?? 'unknown'})`)
              break
            }
            case 'updateCheckResult': {
              if (event.data?.kind === 'failed') {
                scheduleRetry(`updateCheckResult failed (${event.data?.error ?? 'network'})`)
              } else if (event.data?.kind === 'up_to_date') {
                retryAttempt = 0
                clearRetryTimer()
              }
              break
            }
          }
        })
      } catch (err) {
        console.warn('[CapGo] Failed to attach updaterEvent listener:', err)
      }
    }

    const handleOnline = () => {
      if (disposed) return
      retryAttempt = 0
      clearRetryTimer()
      void attemptUpdateRetry()
    }

    const handleVisibilityChange = () => {
      if (disposed || document.visibilityState !== 'visible') return
      void cleanupOldBundles()
      if (retryAttempt > 0 && retryTimer === null) {
        retryAttempt = 0
        void attemptUpdateRetry()
      }
    }

    void initUpdater()
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      clearRetryTimer()
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (listenerHandle) {
        void listenerHandle.remove().catch(() => {})
      }
    }
  }, [])

  return null
}
