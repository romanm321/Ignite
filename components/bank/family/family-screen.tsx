'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { parentProfile } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { OverlayFrame } from '../overlay'
import { AddChildSheet } from './add-child-sheet'
import { AddGoalSheet, AddTaskSheet, AllowanceSheet, ControlsSheet, FundGoalSheet, GiftSheet } from './family-sheets'
import { useFamily } from './family-provider'
import { CardStudioSheet, LessonSheet } from './kid-sheets'
import { Face, KidFace } from './kid-visuals'
import { KidView } from './kid-view'
import { ParentView } from './parent-view'

export type FamilySheet =
  | { kind: 'addChild' }
  | { kind: 'gift' }
  | { kind: 'allowance' }
  | { kind: 'controls' }
  | { kind: 'studio' }
  | { kind: 'task' }
  | { kind: 'goal'; kidTone?: boolean }
  | { kind: 'fundGoal'; goalId: string }
  | { kind: 'lesson'; lessonId: string }

export function FamilyScreen() {
  const { dispatch: bankDispatch } = useBank()
  const { kids, kid, view, dispatch } = useFamily()
  const [sheet, setSheet] = useState<FamilySheet | null>(null)
  const close = () => setSheet(null)

  return (
    <OverlayFrame
      title="TD Family"
      onBack={() => bankDispatch({ type: 'overlay', overlay: null })}
      right={
        <button type="button" onClick={() => setSheet({ kind: 'addChild' })} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-primary">
          <Plus className="size-4" aria-hidden /> Add child
        </button>
      }
    >
      <div className="flex flex-col gap-5 px-4">
        <div role="tablist" aria-label="Choose child" className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={k.id === kid.id}
              onClick={() => dispatch({ type: 'select', id: k.id })}
              className={cn('flex min-h-14 shrink-0 items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-4', k.id === kid.id ? 'border-shield bg-shield-50' : 'bg-card')}
            >
              <KidFace kid={k} mode="photo" className="size-10" />
              <span className="text-left text-sm">
                <span className="block font-semibold leading-tight">{k.name}</span>
                <span className="block text-xs text-muted-foreground">Age {k.age}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSheet({ kind: 'addChild' })}
            className="flex min-h-14 shrink-0 items-center gap-2 rounded-xl border border-dashed border-primary/50 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-primary"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-lime">
              <Plus className="size-5" aria-hidden />
            </span>
            Add a child
          </button>
        </div>

        <div role="radiogroup" aria-label="View" className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
          {(['parent', 'kid'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => dispatch({ type: 'view', view: v })}
              className={cn('flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold', view === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}
            >
              {v === 'parent' ? <Face src={parentProfile.photo} alt="" className="size-7" /> : <KidFace kid={kid} className="size-7" />}
              {v === 'parent' ? 'Parent view' : `${kid.name}’s view`}
            </button>
          ))}
        </div>

        {view === 'parent' ? <ParentView open={setSheet} /> : <KidView open={setSheet} />}
      </div>

      {sheet?.kind === 'addChild' && <AddChildSheet onClose={close} />}
      {sheet?.kind === 'gift' && <GiftSheet onClose={close} />}
      {sheet?.kind === 'allowance' && <AllowanceSheet onClose={close} />}
      {sheet?.kind === 'controls' && <ControlsSheet onClose={close} />}
      {sheet?.kind === 'studio' && <CardStudioSheet onClose={close} />}
      {sheet?.kind === 'task' && <AddTaskSheet onClose={close} />}
      {sheet?.kind === 'goal' && <AddGoalSheet onClose={close} kidTone={sheet.kidTone} />}
      {sheet?.kind === 'fundGoal' && <FundGoalSheet goalId={sheet.goalId} onClose={close} />}
      {sheet?.kind === 'lesson' && <LessonSheet lessonId={sheet.lessonId} onClose={close} />}
    </OverlayFrame>
  )
}
