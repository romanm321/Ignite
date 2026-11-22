'use client'

import Image from 'next/image'
import { useId, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { readPhotoAsDataUrl } from '@/lib/feedback'
import type { Vault } from '@/lib/bank-data'

type Kind = NonNullable<Vault['kind']>

/** The picture a Vault wears until its owner picks a photo: a card and coins for Regular, a family for Savings. */
export const vaultDefaultArt: Record<Kind, string> = {
  regular: '/images/vaults/regular-vault.png',
  savings: '/images/vaults/savings-vault.png',
}

/** Where each default is anchored when the frame crops it, so faces stay in view. A strip is the slim banner on a tile. */
const defaultFocus: Record<Kind, { frame: string; strip: string }> = {
  regular: { frame: 'center', strip: 'center 55%' },
  savings: { frame: 'center 18%', strip: 'center 42%' },
}

export const vaultDefaultAlt: Record<Kind, string> = {
  regular: 'A card and coins',
  savings: 'A family',
}

/** The picture for a Vault, rounded by the frame around it. Shows the owner's photo, or the default for its kind. */
export function VaultImage({
  photo,
  kind = 'savings',
  alt,
  strip,
  className,
}: {
  photo?: string
  kind?: Kind
  alt?: string
  /** A slim banner rather than a full frame. */
  strip?: boolean
  className?: string
}) {
  return (
    <span className={cn('relative block overflow-hidden bg-white', className)}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={alt ?? 'Your picture for this Vault'} className="absolute inset-0 size-full object-cover" />
      ) : (
        <Image
          src={vaultDefaultArt[kind]}
          alt={alt ?? vaultDefaultAlt[kind]}
          fill
          sizes="(max-width: 440px) 100vw, 440px"
          className="object-cover"
          style={{ objectPosition: strip ? defaultFocus[kind].strip : defaultFocus[kind].frame }}
        />
      )}
    </span>
  )
}

/** A Vault's picture with a pencil in the corner that swaps in a photo from the library or camera. */
export function EditableVaultPicture({
  photo,
  kind,
  onChange,
  alt = '',
  className,
  frameClassName,
}: {
  photo?: string
  kind: Kind
  onChange: (photo: string) => void
  alt?: string
  className?: string
  frameClassName?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      onChange(await readPhotoAsDataUrl(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not use that picture')
    }
  }

  return (
    <div className={className}>
      <div className={cn('relative', frameClassName)}>
        <VaultImage photo={photo} kind={kind} alt={alt} className="size-full" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Edit picture"
          aria-describedby={error ? errorId : undefined}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-white text-foreground shadow-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary active:bg-muted"
        >
          <Pencil className="size-5" aria-hidden />
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
