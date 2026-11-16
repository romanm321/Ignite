'use client'

import { useState } from 'react'
import { useBank } from '../../bank-provider'
import { useTrust } from '../../trust-provider'
import { DetailsStep, IdCheckStep, KycStep, OfferStep, PhoneStep, ProveStep } from './about-steps'
import { AchFlow, DirectDepositFlow, FundingChoose, WalletFundingFlow } from './funding-steps'
import { SignupShell, type PhaseIndex } from './shell'
import { SetupChecklist, WalletIssuanceFlow, ZelleFlow } from './setup-steps'
import { blankFields, DEFAULT_PHONE, proveProfile, type Fields, type FundingMethod, type FundingResult, type SetupResult } from './types'

type Step = 'offer' | 'phone' | 'prove' | 'details' | 'kyc' | 'idv' | 'fund' | 'fund-flow' | 'extras' | 'wallet' | 'zelle'

const phaseOf: Record<Step, PhaseIndex> = {
  offer: 0,
  phone: 0,
  prove: 0,
  details: 0,
  kyc: 0,
  idv: 0,
  fund: 1,
  'fund-flow': 1,
  extras: 2,
  wallet: 2,
  zelle: 2,
}

export function SignupFlow({ onExit }: { onExit: () => void }) {
  const { dispatch } = useBank()
  const trust = useTrust()
  const [step, setStep] = useState<Step>('offer')
  const [fields, setFields] = useState<Fields>(blankFields)
  const [phone, setPhone] = useState(DEFAULT_PHONE)
  const [proveUsed, setProveUsed] = useState(false)
  const [proveMode, setProveMode] = useState<'instant' | 'link'>('instant')
  const [snapshot, setSnapshot] = useState<Pick<Fields, 'name' | 'email' | 'dob' | 'ssn' | 'address'> | null>(null)
  const [method, setMethod] = useState<FundingMethod | null>(null)
  const [funding, setFunding] = useState<FundingResult | null>(null)
  const [setup, setSetup] = useState<SetupResult>({ card: false, wallet: false, zelle: false })

  const changedFromProve =
    proveUsed &&
    snapshot !== null &&
    (fields.name !== snapshot.name ||
      fields.email !== snapshot.email ||
      fields.dob !== snapshot.dob ||
      fields.ssn !== snapshot.ssn ||
      fields.address !== snapshot.address)

  const afterFunding = () => setStep('extras')

  const back: Partial<Record<Step, () => void>> = {
    offer: onExit,
    phone: () => setStep('offer'),
    prove: () => setStep('phone'),
    details: () => setStep('phone'),
    kyc: () => setStep('details'),
    idv: () => setStep('kyc'),
    fund: () => setStep(changedFromProve ? 'idv' : 'kyc'),
    'fund-flow': () => setStep('fund'),
    extras: () => setStep('fund'),
    wallet: () => setStep('extras'),
    zelle: () => setStep('extras'),
  }

  const finish = () => {
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
      card: setup.card,
      setup: { zelle: setup.zelle, wallet: setup.wallet, directDeposit: funding?.method === 'direct-deposit' },
    })
    dispatch({
      type: 'celebrate',
      celebration: {
        kind: 'product',
        title: 'Welcome to the family, Ava!',
        body: 'Your checking account is open. Get $500 in direct deposits within 90 days and your $250 welcome bonus is yours.',
      },
    })
  }

  return (
    <SignupShell phase={phaseOf[step]} stepKey={step} showProgress={step !== 'offer'} onBack={back[step]}>
      {step === 'offer' && <OfferStep onContinue={() => setStep('phone')} />}
      {step === 'phone' && (
        <PhoneStep
          phone={phone}
          setPhone={setPhone}
          onProve={(mode) => {
            setProveMode(mode)
            setStep('prove')
          }}
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
          mode={proveMode}
          onCancel={() => setStep('phone')}
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
          onContinue={() => setStep('kyc')}
        />
      )}
      {step === 'kyc' && (
        <KycStep
          fields={fields}
          setFields={setFields}
          changedFromProve={changedFromProve}
          onContinue={() => setStep(changedFromProve ? 'idv' : 'fund')}
        />
      )}
      {step === 'idv' && <IdCheckStep onVerified={() => setStep('fund')} />}
      {step === 'fund' && (
        <FundingChoose
          value={method}
          onChange={setMethod}
          onContinue={() => setStep('fund-flow')}
          onSkip={() => {
            setFunding(null)
            afterFunding()
          }}
        />
      )}
      {step === 'fund-flow' && method === 'direct-deposit' && (
        <DirectDepositFlow
          employerName={fields.employer}
          onDone={(r) => {
            setFunding(r)
            afterFunding()
          }}
        />
      )}
      {step === 'fund-flow' && method === 'ach' && (
        <AchFlow
          onDone={(r) => {
            setFunding(r)
            afterFunding()
          }}
        />
      )}
      {step === 'fund-flow' && method === 'wallet' && (
        <WalletFundingFlow
          onDone={(r) => {
            setFunding(r)
            afterFunding()
          }}
        />
      )}
      {step === 'extras' && <SetupChecklist done={{ wallet: setup.card, zelle: setup.zelle }} onStart={setStep} onFinish={finish} />}
      {step === 'wallet' && (
        <WalletIssuanceFlow
          onDone={(r) => {
            setSetup((s) => ({ ...s, card: r.card, wallet: r.wallet }))
            setStep('extras')
          }}
        />
      )}
      {step === 'zelle' && (
        <ZelleFlow
          phone={phone}
          email={fields.email}
          onDone={() => {
            setSetup((s) => ({ ...s, zelle: true }))
            setStep('extras')
          }}
        />
      )}
    </SignupShell>
  )
}
