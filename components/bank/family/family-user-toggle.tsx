'use client'

import { ChevronRight } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { parentProfile } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { useFamily } from './family-provider'
import { Face, KidFace } from './kid-visuals'

export function FamilyUserToggle() {
  const { customerType, streetSafe, dispatch: bankDispatch } = useBank()
  const { kids, kid, view, dispatch } = useFamily()

  if (customerType === 'new' || kids.length === 0) return null

  const activeId = view === 'parent' ? 'parent' : kid.id
  const choose = (id: string) => {
    if (id === 'parent') return dispatch({ type: 'view', view: 'parent' })
    dispatch({ type: 'select', id })
    dispatch({ type: 'view', view: 'kid' })
  }
  const total = kids.reduce((sum, k) => sum + k.balance, 0)
  const money = (n: number) => (streetSafe ? '••••' : formatMoney(n))
  const chip = (selected: boolean) =>
    cn('flex min-h-14 shrink-0 items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-4 text-left', selected ? 'border-shield bg-shield-50' : 'bg-card')

  return (
    <section aria-labelledby="family-user-h" className="flex flex-col gap-3">
      <SectionHeader id="family-user-h" title="TD Family" action={<span className="text-xs text-muted-foreground">Switch user</span>} />
      <div role="radiogroup" aria-label="Switch user" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <button type="button" role="radio" aria-checked={activeId === 'parent'} onClick={() => choose('parent')} className={chip(activeId === 'parent')}>
          <Face src={parentProfile.photo} alt="" className="size-10" />
          <span className="text-sm">
            <span className="block font-semibold leading-tight">{parentProfile.name}</span>
            <span className="block text-xs text-muted-foreground">You · Parent</span>
          </span>
        </button>
        {kids.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={activeId === k.id} onClick={() => choose(k.id)} className={chip(activeId === k.id)}>
            <KidFace kid={k} mode="photo" className="size-10" />
            <span className="text-sm">
              <span className="block font-semibold leading-tight">{k.name}</span>
              <span className="block text-xs text-muted-foreground">Age {k.age}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => bankDispatch({ type: 'overlay', overlay: 'family' })}
        className="flex min-h-16 items-center gap-3 rounded-3xl bg-card px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{activeId === 'parent' ? 'Manage TD Family' : `Open ${kid.name}’s account`}</span>
          <span className="block text-xs text-muted-foreground">
            {activeId === 'parent'
              ? `${kids.length} child account${kids.length === 1 ? '' : 's'} · ${money(total)} in total`
              : `Viewing as ${kid.name} · ${money(kid.balance)} balance`}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </section>
  )
}
