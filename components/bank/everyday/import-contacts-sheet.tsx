'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Search, Smartphone } from 'lucide-react'
import { deviceContacts, type Contact } from '@/lib/everyday-data'
import { cn } from '@/lib/utils'
import { BottomSheet, PrimaryButton, inputClass } from '../overlay'

/**
 * Stands in for the phone's contacts permission and address book. Names, numbers and photos
 * come over together, so friends are easy to recognise in the Send list.
 */
export function ImportContactsSheet({
  existing,
  onClose,
  onImport,
}: {
  existing: Contact[]
  onClose: () => void
  onImport: (contacts: Contact[]) => void
}) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])

  const alreadyHave = (name: string) => existing.some((c) => c.name.toLowerCase() === name.toLowerCase())
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return deviceContacts.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
  }, [query])

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submit = () => {
    onImport(
      deviceContacts
        .filter((c) => picked.includes(c.id))
        .map((c) => ({ id: `phone-${c.id}`, name: c.name, handle: c.phone, photo: c.photo, known: true })),
    )
  }

  return (
    <BottomSheet title="Import from your phone" description="Choose who to bring into TD." onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="relative">
          <span className="sr-only">Search your contacts</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your contacts"
            className={cn(inputClass, 'rounded-full pl-10')}
          />
        </label>

        <p className="px-1 text-sm text-muted-foreground">{deviceContacts.length} contacts on this phone</p>

        <ul className="max-h-80 divide-y overflow-y-auto rounded-2xl bg-muted/60">
          {visible.map((c) => {
            const have = alreadyHave(c.name)
            const on = picked.includes(c.id)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={have}
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left disabled:opacity-60"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image src={c.photo} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block text-sm text-muted-foreground">{have ? 'Already in TD' : c.phone}</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                      have && 'invisible',
                    )}
                  >
                    {on && <Check className="size-4" />}
                  </span>
                </button>
              </li>
            )
          })}
          {visible.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No contacts match that search</li>}
        </ul>

        <PrimaryButton onClick={submit} disabled={picked.length === 0}>
          {picked.length === 0 ? 'Import' : `Import ${picked.length} ${picked.length === 1 ? 'contact' : 'contacts'}`}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
