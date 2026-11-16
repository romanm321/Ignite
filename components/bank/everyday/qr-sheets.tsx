'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Keyboard, Share2 } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { BottomSheet, PrimaryButton } from '../overlay'

export function SendQrSheet({
  name,
  amount,
  onShare,
  onClose,
}: {
  name: string
  amount: number | null
  onShare: (link: string) => void
  onClose: () => void
}) {
  const link = `https://zelle.td.example/pay?from=${encodeURIComponent(name)}${amount ? `&amount=${amount.toFixed(2)}` : ''}`

  return (
    <BottomSheet
      title="Send a QR code"
      description="Show this to the person you’re paying or share it. When they scan it, the money lands in their account."
      onClose={onClose}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <QRCodeSVG value={link} size={200} level="M" bgColor="#ffffff" fgColor="#0f1f14" title={`Zelle QR code from ${name}`} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {amount ? <span className="font-semibold text-foreground">{formatMoney(amount)}</span> : 'Any amount'} · from {name} · expires in 15 minutes
        </p>
        <PrimaryButton onClick={() => onShare(link)} className="flex items-center justify-center gap-2">
          <Share2 className="size-4" aria-hidden /> Share code
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function ScanQrSheet({
  onScanned,
  onManual,
  onClose,
}: {
  onScanned: () => void
  onManual: () => void
  onClose: () => void
}) {
  return (
    <BottomSheet
      title="Scan a QR code"
      description="Point your camera at their Zelle QR code and we’ll fill in who owes you."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="relative mx-auto flex aspect-square w-full max-w-64 items-center justify-center overflow-hidden rounded-3xl bg-forest" role="img" aria-label="Camera viewfinder">
          {(['left-3 top-3 border-l-4 border-t-4 rounded-tl-xl', 'right-3 top-3 border-r-4 border-t-4 rounded-tr-xl', 'bottom-3 left-3 border-b-4 border-l-4 rounded-bl-xl', 'bottom-3 right-3 border-b-4 border-r-4 rounded-br-xl'] as const).map((c) => (
            <span key={c} aria-hidden className={`absolute size-10 border-lime ${c}`} />
          ))}
          <span aria-hidden className="h-0.5 w-3/4 animate-pulse rounded-full bg-lime" />
        </div>
        <PrimaryButton onClick={onScanned}>Scan a sample code</PrimaryButton>
        <button type="button" onClick={onManual} className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-primary">
          <Keyboard className="size-4" aria-hidden /> Enter an email or phone instead
        </button>
      </div>
    </BottomSheet>
  )
}
