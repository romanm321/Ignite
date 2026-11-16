'use client'

import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import {
  initialConnections,
  initialDevices,
  initialLogins,
  initialProfile,
  type AlertKey,
  type Connection,
  type DataScope,
  type Device,
  type FraudCase,
  type LoginEvent,
  type Profile,
} from '@/lib/trust-data'

export type SecurityTab = 'prevent' | 'detect' | 'resolve' | 'data'

type State = {
  securityTab: SecurityTab
  profile: Profile
  passkey: boolean
  biometrics: boolean
  contactReviewed: boolean
  idGuard: boolean
  alerts: Record<AlertKey, boolean>
  devices: Device[]
  logins: LoginEvent[]
  connections: Connection[]
  cases: FraudCase[]
  completedLessons: string[]
}

type Action =
  | { type: 'securityTab'; tab: SecurityTab }
  | { type: 'profile'; patch: Partial<Profile> }
  | { type: 'passkey'; on: boolean }
  | { type: 'biometrics'; on: boolean }
  | { type: 'contactReviewed' }
  | { type: 'idGuard'; on: boolean }
  | { type: 'alert'; key: AlertKey; on: boolean }
  | { type: 'removeDevice'; id: string }
  | { type: 'trustDevice'; id: string }
  | { type: 'scope'; id: string; scope: DataScope; on: boolean }
  | { type: 'disconnect'; id: string }
  | { type: 'openCase'; fraudCase: FraudCase }
  | { type: 'lesson'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'securityTab':
      return { ...state, securityTab: action.tab }
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'passkey':
      return { ...state, passkey: action.on }
    case 'biometrics':
      return { ...state, biometrics: action.on }
    case 'contactReviewed':
      return { ...state, contactReviewed: true }
    case 'idGuard':
      return { ...state, idGuard: action.on }
    case 'alert':
      return { ...state, alerts: { ...state.alerts, [action.key]: action.on } }
    case 'removeDevice':
      return {
        ...state,
        devices: state.devices.filter((d) => d.id !== action.id),
        logins: state.logins.map((l) => (l.flagged ? { ...l, flagged: false } : l)),
      }
    case 'trustDevice':
      return { ...state, devices: state.devices.map((d) => (d.id === action.id ? { ...d, trusted: true } : d)) }
    case 'scope':
      return {
        ...state,
        connections: state.connections.map((c) =>
          c.id === action.id ? { ...c, scopes: { ...c.scopes, [action.scope]: action.on } } : c,
        ),
      }
    case 'disconnect':
      return { ...state, connections: state.connections.filter((c) => c.id !== action.id) }
    case 'openCase':
      return { ...state, cases: [action.fraudCase, ...state.cases] }
    case 'lesson':
      return state.completedLessons.includes(action.id)
        ? state
        : { ...state, completedLessons: [...state.completedLessons, action.id] }
  }
}

const initialState: State = {
  securityTab: 'prevent',
  profile: initialProfile,
  passkey: false,
  biometrics: true,
  contactReviewed: true,
  idGuard: false,
  alerts: { largePurchase: true, newDevice: false, international: true, newPayee: false, profileChange: true, declined: false },
  devices: initialDevices,
  logins: initialLogins,
  connections: initialConnections,
  cases: [],
  completedLessons: [],
}

export type ChecklistItem = {
  id: string
  title: string
  why: string
  points: number
  done: boolean
  tab: SecurityTab
}

function buildChecklist(state: State): ChecklistItem[] {
  const alertsOn = Object.values(state.alerts).every(Boolean)
  const unknownDevice = state.devices.some((d) => !d.trusted)
  const staleApp = state.connections.some((c) => c.stale)
  return [
    {
      id: 'device',
      title: 'Review an unrecognized device',
      why: 'A Windows PC in Newark, NJ signed in at 3:17 AM.',
      points: 20,
      done: !unknownDevice,
      tab: 'detect',
    },
    {
      id: 'passkey',
      title: 'Turn on a passkey',
      why: 'Phishing-proof sign-in. Nothing to steal, nothing to type.',
      points: 20,
      done: state.passkey,
      tab: 'prevent',
    },
    {
      id: 'alerts',
      title: 'Switch on all fraud alerts',
      why: 'New-device and new-payee alerts catch takeovers early.',
      points: 15,
      done: alertsOn,
      tab: 'detect',
    },
    {
      id: 'stale',
      title: 'Disconnect an unused app',
      why: 'BudgetPal still sees your account numbers after 14 months.',
      points: 15,
      done: !staleApp,
      tab: 'data',
    },
    {
      id: 'trusted',
      title: 'Add a trusted contact',
      why: 'Someone we can call if we spot signs of scams or exploitation.',
      points: 10,
      done: !!state.profile.trustedContact,
      tab: 'prevent',
    },
    {
      id: 'contact',
      title: 'Confirm your contact info',
      why: 'So security codes and alerts always reach you.',
      points: 10,
      done: state.contactReviewed,
      tab: 'prevent',
    },
    {
      id: 'idguard',
      title: 'Activate TD ID Guard',
      why: 'Dark-web and credit monitoring, free with your account.',
      points: 10,
      done: state.idGuard,
      tab: 'data',
    },
  ]
}

type TrustContextValue = State & {
  dispatch: React.Dispatch<Action>
  checklist: ChecklistItem[]
  score: number
}

const TrustContext = createContext<TrustContextValue | null>(null)

export function TrustProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value = useMemo(() => {
    const checklist = buildChecklist(state)
    // Biometric sign-in and verified identity are already on, so they form a fixed baseline.
    const earned = checklist.reduce((s, i) => s + (i.done ? i.points : 0), 0)
    const score = Math.round(30 + earned * 0.7)
    return { ...state, dispatch, checklist, score }
  }, [state])

  return <TrustContext.Provider value={value}>{children}</TrustContext.Provider>
}

export function useTrust() {
  const ctx = useContext(TrustContext)
  if (!ctx) throw new Error('useTrust must be used within TrustProvider')
  return ctx
}
