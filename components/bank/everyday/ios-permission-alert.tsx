'use client'

import { useEffect, useRef } from 'react'

/** A stand-in for the system permission alert iOS shows the first time an app asks for contacts. */
export function IosPermissionAlert({
  title,
  message,
  onAllow,
  onDeny,
}: {
  title: string
  message: string
  onAllow: () => void
  onDeny: () => void
}) {
  const allowRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    allowRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDeny()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDeny])

  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/50 px-10 animate-in fade-in duration-200">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ios-alert-title"
        aria-describedby="ios-alert-message"
        className="w-full max-w-[270px] overflow-hidden rounded-[14px] bg-[#f2f2f7]/95 text-center text-black shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
      >
        <div className="px-4 pb-4 pt-5">
          <h2 id="ios-alert-title" className="font-sans text-[17px] font-semibold leading-snug tracking-tight">
            {title}
          </h2>
          <p id="ios-alert-message" className="mt-1 text-[13px] leading-snug">
            {message}
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-black/20">
          <button type="button" onClick={onDeny} className="h-11 border-r border-black/20 text-[17px] text-[#0a5fd6] active:bg-black/10">
            Don’t Allow
          </button>
          <button ref={allowRef} type="button" onClick={onAllow} className="h-11 text-[17px] font-semibold text-[#0a5fd6] active:bg-black/10">
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
