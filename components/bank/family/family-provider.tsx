'use client'

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { initialKids, lessons, type Goal, type Kid, type KidActivity, type Task } from '@/lib/family-data'
import { useBank } from '../bank-provider'

type State = { kids: Kid[]; activeId: string; view: 'parent' | 'kid' }

type Action =
  | { type: 'select'; id: string }
  | { type: 'view'; view: State['view'] }
  | { type: 'patch'; id: string; patch: Partial<Kid> }
  | { type: 'addKid'; kid: Kid }
  | { type: 'credit'; id: string; amount: number; label: string; kind: KidActivity['kind'] }
  | { type: 'task'; id: string; taskId: string; status: Task['status'] }
  | { type: 'addTask'; id: string; task: Task }
  | { type: 'removeTask'; id: string; taskId: string }
  | { type: 'addGoal'; id: string; goal: Goal }
  | { type: 'fundGoal'; id: string; goalId: string; amount: number }
  | { type: 'lesson'; id: string; lessonId: string }

const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

function updateKid(state: State, id: string, fn: (k: Kid) => Kid): State {
  return { ...state, kids: state.kids.map((k) => (k.id === id ? fn(k) : k)) }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select':
      return { ...state, activeId: action.id }
    case 'view':
      return { ...state, view: action.view }
    case 'patch':
      return updateKid(state, action.id, (k) => ({ ...k, ...action.patch }))
    case 'addKid':
      return { ...state, kids: [...state.kids, action.kid], activeId: action.kid.id }
    case 'credit':
      return updateKid(state, action.id, (k) => ({
        ...k,
        balance: Math.round((k.balance + action.amount) * 100) / 100,
        activity: [{ id: stamp(), label: action.label, amount: action.amount, when: 'Just now', kind: action.kind }, ...k.activity],
      }))
    case 'task':
      return updateKid(state, action.id, (k) => ({
        ...k,
        tasks: k.tasks.map((t) => (t.id === action.taskId ? { ...t, status: action.status } : t)),
      }))
    case 'addTask':
      return updateKid(state, action.id, (k) => ({ ...k, tasks: [action.task, ...k.tasks] }))
    case 'removeTask':
      return updateKid(state, action.id, (k) => ({ ...k, tasks: k.tasks.filter((t) => t.id !== action.taskId) }))
    case 'addGoal':
      return updateKid(state, action.id, (k) => ({ ...k, goals: [...k.goals, action.goal] }))
    case 'fundGoal':
      return updateKid(state, action.id, (k) => {
        const goal = k.goals.find((g) => g.id === action.goalId)
        const amount = Math.min(action.amount, k.balance, goal ? goal.target - goal.saved : 0)
        if (!goal || amount <= 0) return k
        return {
          ...k,
          balance: Math.round((k.balance - amount) * 100) / 100,
          goals: k.goals.map((g) => (g.id === goal.id ? { ...g, saved: Math.round((g.saved + amount) * 100) / 100 } : g)),
          activity: [{ id: stamp(), label: `Saved for ${goal.name}`, amount: -amount, when: 'Just now', kind: 'goal' }, ...k.activity],
        }
      })
    case 'lesson': {
      const lesson = lessons.find((l) => l.id === action.lessonId)
      return updateKid(state, action.id, (k) =>
        !lesson || k.lessonsDone.includes(lesson.id)
          ? k
          : { ...k, xp: k.xp + lesson.xp, lessonsDone: [...k.lessonsDone, lesson.id], streak: k.streak + 1 },
      )
    }
  }
}

type Ctx = State & {
  kid: Kid
  dispatch: React.Dispatch<Action>
  /** Moves money from the parent's checking to the child, recording it on both sides. */
  fund: (kidId: string, amount: number, label: string, kind: KidActivity['kind']) => boolean
}

const FamilyContext = createContext<Ctx | null>(null)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { kids: initialKids, activeId: initialKids[0].id, view: 'parent' })
  const bank = useBank()
  const checking = bank.accounts.find((a) => a.id === 'chk')?.balance ?? 0

  const fund = useCallback(
    (kidId: string, amount: number, label: string, kind: KidActivity['kind']) => {
      const kid = state.kids.find((k) => k.id === kidId)
      if (!kid || amount <= 0 || amount > checking) return false
      bank.dispatch({ type: 'familyFund', amount, memo: `${label} · ${kid.name}` })
      dispatch({ type: 'credit', id: kidId, amount, label, kind })
      return true
    },
    [bank, checking, state.kids],
  )

  const value = useMemo<Ctx>(() => {
    const kid = state.kids.find((k) => k.id === state.activeId) ?? state.kids[0]
    return { ...state, kid, dispatch, fund }
  }, [state, fund])

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
