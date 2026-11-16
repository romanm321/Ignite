'use client'

import { useState } from 'react'
import { ArrowRight, Fingerprint } from 'lucide-react'
import { useBank } from '../bank-provider'
import { TdMark } from '../primitives'
import { SignupFlow } from './signup/signup-flow'

export function AuthScreen() {
  const { auth, dispatch } = useBank()
  const [mode, setMode] = useState<'login' | 'signup' | null>(null)

  if (auth === 'authenticated') return null

  return (
    <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 z-[100] overflow-y-auto bg-background">
        <div className="mx-auto flex min-h-full w-full max-w-[440px] flex-col px-5 pb-8 pt-8">
        <div className="flex items-center gap-3">
          <TdMark className="size-10 rounded-xl" />
          <span className="font-semibold tracking-tight">Banking that moves with you</span>
        </div>

        {mode === 'signup' ? (
          <SignupFlow onExit={() => setMode(null)} />
        ) : mode === 'login' ? (
          <div className="flex flex-1 flex-col justify-center py-12">
            <button type="button" onClick={() => setMode(null)} className="flex h-11 items-center self-start text-sm font-medium text-primary">
              Back
            </button>
            <div className="mt-10 flex flex-col items-center text-center">
              <span className="flex size-24 items-center justify-center rounded-full bg-accent text-primary ring-8 ring-accent/40">
                <Fingerprint className="size-12" aria-hidden />
              </span>
              <h1 className="mt-8 text-3xl font-semibold">Use Face ID to log in</h1>
              <p className="mt-3 max-w-xs leading-relaxed text-muted-foreground">A quick biometric check keeps your account private on this device.</p>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'authenticate' })
                  setMode(null)
                }}
                className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground"
              >
                <Fingerprint className="size-5" aria-hidden /> Confirm with Face ID
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center py-12">
            <p className="text-sm font-medium text-primary">Welcome back</p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">Your money, ready when you are.</h1>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">A calmer way to bank, with help whenever you need it.</p>
            <div className="mt-8 flex flex-col gap-3">
              <button type="button" onClick={() => setMode('login')} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground">
                Log in <ArrowRight className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={() => setMode('signup')} className="flex h-14 items-center justify-center rounded-2xl border-2 border-primary font-semibold text-primary">
                Sign up
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">Protected by TD security and biometric confirmation.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
