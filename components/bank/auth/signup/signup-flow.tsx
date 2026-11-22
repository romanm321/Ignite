'use client'

import { useState } from 'react'
import { useBank } from '../../bank-provider'
import { useTrust } from '../../trust-provider'
import { DetailsStep, IdCheckStep, ProveStep } from './about-steps'
import { AchFlow, DirectDepositFlow, FundingChoose, WalletFundingFlow, type WalletKind } from './funding-steps'
import { MethodStep, OtpStep, PhoneEntryStep } from './phone-steps'
import { SignupShell, type PhaseIndex } from './shell'
import { StoryStep } from './story-step'
import { blankFields, DEFAULT_PHONE, proveProfile, type Fields, type FundingMethod, type FundingResult } from './types'

type Step = 'story' | 'phone' | 'otp' | 'method' | 'prove' | 'details' | 'idv' | 'fund' | 'fund-flow'

const phaseOf: Record<Step, PhaseIndex> = {
  story: 0,
  phone: 0,
  otp: 0,
  method: 0,
  prove: 0,
  details: 0,
  idv: 0,
  fund: 1,
  'fund-flow': 1,
}

export function SignupFlow({ onExit, onLogin }: { onExit: () => void; onLogin: () => void }) {
  const { dispatch } = useBank()
  const trust = useTrust()
  const [step, setStep] = useState<Step>('story')
  const [fields, setFields] = useState<Fields>(blankFields)
  const [phone, setPhone] = useState(DEFAULT_PHONE)
  const [proveUsed, setProveUsed] = useState(false)
  const [snapshot, setSnapshot] = useState<Pick<Fields, 'name' | 'email' | 'dob' | 'ssn' | 'address'> | null>(null)
  const [method, setMethod] = useState<FundingMethod | null>(null)
  const [wallet, setWallet] = useState<WalletKind>('Apple Pay')

  const changedFromProve =
    proveUsed &&
    snapshot !== null &&
    (fields.name !== snapshot.name ||
      fields.email !== snapshot.email ||
      fields.dob !== snapshot.dob ||
      fields.ssn !== snapshot.ssn ||
      fields.address !== snapshot.address)

  const back: Partial<Record<Step, () => void>> = {
    phone: () => setStep('story'),
    otp: () => setStep('phone'),
    method: () => setStep('otp'),
    prove: () => setStep('method'),
    details: () => setStep('method'),
    idv: () => setStep('details'),
    fund: () => setStep(changedFromProve ? 'idv' : 'details'),
    'fund-flow': () => setStep('fund'),
  }

  const finish = (funding: FundingResult | null) => {
    trust.dispatch({
      type: 'profile',
      patch: {
        legalName: fields.name,
        preferredName: fields.name.trim().split(' ')[0] || 'Ava',
        dob: fields.dob,
        email: fields.email,
        phone,
        address: fields.address,
        memberSince: '2026',
        paperless: false,
      },
    })
    trust.dispatch({ type: 'biometrics', on: false })
    trust.dispatch({ type: 'passkey', on: false })
    dispatch({
      type: 'activateNewCustomer',
      funded: funding?.posted ?? 0,
      fundingLabel: funding?.label,
      setup: { directDeposit: funding?.method === 'direct-deposit' },
    })
    if (funding) dispatch({ type: 'setupDone', id: 'fund' })
    dispatch({
      type: 'celebrate',
      celebration: {
        kind: 'product',
        title: 'Your account is open',
        body: 'Set up $500 in direct deposits within 90 days to earn it.',
        amount: 250,
        cta: 'onboarding',
      },
    })
  }

  if (step === 'story') {
    return <StoryStep onCreate={() => setStep('phone')} onLogin={onLogin} onClose={onExit} />
  }

  return (
    <SignupShell phase={phaseOf[step]} stepKey={step} onBack={back[step]}>
      {step === 'phone' && <PhoneEntryStep phone={phone} setPhone={setPhone} onContinue={() => setStep('otp')} />}
      {step === 'otp' && <OtpStep phone={phone} onVerified={() => setStep('method')} />}
      {step === 'method' && (
        <MethodStep
          onSim={() => setStep('prove')}
          onManual={() => {
            setProveUsed(false)
            setSnapshot(null)
            setFields(blankFields)
            setStep('details')
          }}
        />
      )}
      {step === 'prove' && (
        <ProveStep
          phone={phone}
          mode="instant"
          onCancel={() => setStep('method')}
          onVerified={() => {
            const filled = { ...fields, ...proveProfile }
            setFields(filled)
            setSnapshot({ name: filled.name, email: filled.email, dob: filled.dob, ssn: filled.ssn, address: filled.address })
            setProveUsed(true)
            setStep('details')
          }}
        />
      )}
      {step === 'details' && (
        <DetailsStep
          fields={fields}
          setFields={setFields}
          proveUsed={proveUsed}
          changedFromProve={changedFromProve}
          onContinue={() => setStep(changedFromProve ? 'idv' : 'fund')}
        />
      )}
      {step === 'idv' && <IdCheckStep onVerified={() => setStep('fund')} />}
      {step === 'fund' && (
        <FundingChoose
          onPick={(m, w) => {
            setMethod(m)
            if (w) setWallet(w)
            setStep('fund-flow')
          }}
          onSkip={() => finish(null)}
        />
      )}
      {step === 'fund-flow' && method === 'direct-deposit' && <DirectDepositFlow employerName={fields.employer} onDone={finish} />}
      {step === 'fund-flow' && method === 'ach' && <AchFlow onDone={finish} />}
      {step === 'fund-flow' && method === 'wallet' && <WalletFundingFlow initialWallet={wallet} onDone={finish} />}
    </SignupShell>
  )
}
