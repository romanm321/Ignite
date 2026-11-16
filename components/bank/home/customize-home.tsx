'use client'

import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { defaultHomeOrder, homeTileLabels, moveTile, type HomeTileId } from './home-tiles'

/** `visible` lists every tile this customer can have, including ones they've hidden, so hidden tiles can be turned back on. */
export function CustomizeHomeSheet({ visible, focusId, onClose }: { visible: HomeTileId[]; focusId: HomeTileId | null; onClose: () => void }) {
  const { homeOrder, homeHidden, dispatch } = useBank()
  const shown = homeOrder.filter((tile) => visible.includes(tile))
  const move = (id: HomeTileId, direction: -1 | 1) => dispatch({ type: 'homeOrder', order: moveTile(homeOrder, visible, id, direction) })
  const toggle = (id: HomeTileId) =>
    dispatch({ type: 'homeHidden', hidden: homeHidden.includes(id) ? homeHidden.filter((h) => h !== id) : [...homeHidden, id] })

  return (
    <BottomSheet title="Edit Home" description="Reorder sections, or hide the ones you don’t need." onClose={onClose}>
      <ol className="flex flex-col gap-2">
        {shown.map((id, i) => {
          const hidden = homeHidden.includes(id)
          return (
          <li key={id} className={cn('flex items-center gap-1 rounded-2xl border bg-card py-1 pl-1 pr-1', id === focusId && 'border-primary bg-accent')}>
            <button
              type="button"
              onClick={() => toggle(id)}
              aria-pressed={!hidden}
              aria-label={`${hidden ? 'Show' : 'Hide'} ${homeTileLabels[id]}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground"
            >
              {hidden ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5 text-primary" aria-hidden />}
            </button>
            <span className={cn('min-w-0 flex-1 font-medium', hidden && 'text-muted-foreground line-through')}>{homeTileLabels[id]}</span>
            <button
              type="button"
              onClick={() => move(id, -1)}
              disabled={i === 0}
              aria-label={`Move ${homeTileLabels[id]} up`}
              className="flex size-11 items-center justify-center rounded-xl disabled:opacity-30"
            >
              <ArrowUp className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => move(id, 1)}
              disabled={i === shown.length - 1}
              aria-label={`Move ${homeTileLabels[id]} down`}
              className="flex size-11 items-center justify-center rounded-xl disabled:opacity-30"
            >
              <ArrowDown className="size-5" aria-hidden />
            </button>
          </li>
          )
        })}
      </ol>
      <div className="mt-4 flex flex-col gap-2">
        <PrimaryButton onClick={onClose}>Done</PrimaryButton>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'homeOrder', order: defaultHomeOrder })
            dispatch({ type: 'homeHidden', hidden: [] })
          }}
          className="h-11 rounded-xl text-sm font-semibold text-primary"
        >
          Reset to default
        </button>
      </div>
    </BottomSheet>
  )
}
