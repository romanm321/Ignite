'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/bank-data'
import { cdTerms, products, riskProfiles, type Product, type ProductId } from '@/lib/offers'
import { boostCategories, studentPerkChoices } from '@/lib/segments'
import { useBank, type OnboardStep } from '../bank-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { openVaultsLanding } from '../vaults/open-vaults'
import { StepBody } from './identity-steps'
import { ProductStory } from './product-story'
import { VaultStep } from './vault-step'
import { CardArt, cdEarnings, defaultSetup, parseAmount, SetupStep, type SetupValues } from './setup-step'

export function OnboardingFlow() {
  const { onboarding, drafts } = useBank()
  if (!onboarding) return null
  return <Flow key={onboarding} productId={onboarding} initial={drafts[onboarding] ?? 'intro'} />
}

const baseSteps: OnboardStep[] = ['setup', 'terms']

function Flow({ productId, initial }: { productId: ProductId; initial: OnboardStep }) {
  const { dispatch, notify, onboardingVault, onboardingSkipIntro } = useBank()
  const product = products[productId]
  const withVault = onboardingVault && productId === 'growth-savings'
  const progressSteps = baseSteps
  const [vaultId] = useState(() => `v-${Date.now()}`)
  // Setting up the first Vault comes before the account steps, so the progress bar still reads 1 and 2.
  // The Vaults reel has just played, so this flow skips the savings account reel and starts at the Vault.
  const order: OnboardStep[] = [
    ...(withVault ? (['vault'] as OnboardStep[]) : onboardingSkipIntro ? [] : ['intro' as OnboardStep]),
    ...progressSteps,
    'decision',
    'done',
  ]
  const [step, setStep] = useState<OnboardStep>(order.includes(initial) ? initial : order[0])
  const [values, setValues] = useState<SetupValues>(() => defaultSetup(product))
  const [agreed, setAgreed] = useState(false)
  const [exitAsk, setExitAsk] = useState(false)

  const next = () => setStep(order[order.indexOf(step) + 1])
  const back = () => (order.indexOf(step) === 0 ? dispatch({ type: 'exitOnboarding' }) : setStep(order[order.indexOf(step) - 1]))
  const set = (patch: Partial<SetupValues>) => setValues((v) => ({ ...v, ...patch }))

  const shownSteps = order.filter((s) => progressSteps.includes(s))
  const pos = shownSteps.indexOf(step)
  const inProgress = pos >= 0 || step === 'vault'

  useEffect(() => {
    if (step !== 'decision') return
    const t = window.setTimeout(() => {
      const amount = product.setup === 'card' ? 0 : parseAmount(values.amount)
      const risk = riskProfiles.find((r) => r.id === values.risk)?.label
      dispatch({
        type: 'openProduct',
        productId,
        funding: amount,
        fromId: values.fromId,
        vault: withVault
          ? {
              id: vaultId,
              name: values.vaultName.trim().slice(0, 28),
              balance: 0,
              goal: parseAmount(values.vaultGoal),
              apy: 0,
              kind: 'savings',
              tone: 'lime',
              access: values.vaultAccess,
              withdrawalsUsed: 0,
              lockedUntil: null,
              salarySort: 0,
              billPayeeIds: [],
              photo: values.vaultPhoto,
            }
          : undefined,
        limit: product.setup === 'card' ? 8000 : undefined,
        label:
          product.setup === 'deposit'
            ? `TD ${values.months}-mo Step Rate CD`
            : product.setup === 'invest'
              ? `TD Auto Invest · ${risk}`
              : undefined,
        meta:
          product.id === 'student'
            ? { school: values.school.trim(), perk: values.studentPerk, earlyPay: values.earlyPay, creditBuilder: values.creditBuilder }
            : product.id === 'complete'
              ? { boost: values.boost, sweep: values.sweep, sweepTarget: values.sweepTarget }
              : undefined,
      })
      if (withVault) {
        // The Vault is the point of this flow, so skip the account confirmation and land on it.
        dispatch({
          type: 'celebrate',
          celebration: {
            kind: 'product',
            title: 'Great job, your vault is now open',
            body: `${values.vaultName.trim()} is ready${amount > 0 ? `, with ${formatMoney(amount)} already saved in it` : ''}.`,
          },
        })
        dispatch({ type: 'exitOnboarding' })
        // Open the new savings account first, so Back from the Vault lands there instead of on the Vaults page or Home.
        dispatch({ type: 'overlay', overlay: null })
        dispatch({ type: 'openAccount', id: 'sav-new' })
        dispatch({ type: 'openVault', id: vaultId })
        return
      }
      dispatch({
        type: 'celebrate',
        celebration: {
          kind: 'product',
          title: `Your ${product.name} is open`,
          body: 'You’re all set. It’s ready whenever you are.',
        },
      })
      setStep('done')
    }, 2200)
    return () => window.clearTimeout(t)
  }, [step, dispatch, product, productId, values, withVault, vaultId])

  const close = () => {
    if (inProgress) setExitAsk(true)
    else dispatch({ type: 'exitOnboarding' })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Open ${product.name}`}
      className="absolute inset-0 z-40 flex flex-col bg-background animate-in fade-in slide-in-from-bottom-6"
    >
      {step === 'intro' && <ProductStory product={product} onStart={next} onClose={close} />}
      {step !== 'intro' && (
      <header className="flex flex-col gap-2 px-3 pb-2 pt-[calc(var(--safe-top)+0.75rem)]">
        <div className="flex items-center justify-between">
          {inProgress ? (
            <button type="button" onClick={back} aria-label="Back" className="flex size-11 items-center justify-center rounded-full">
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          ) : (
            <span className="size-11" />
          )}
          <span className="text-sm font-semibold">{product.name}</span>
          {inProgress ? (
            <button type="button" onClick={close} aria-label="Exit application" className="flex size-11 items-center justify-center rounded-full">
              <X className="size-5" aria-hidden />
            </button>
          ) : (
            <span className="size-11" />
          )}
        </div>
        {pos >= 0 && (
          <div className="flex items-center gap-3 px-2">
            <div
              className="flex flex-1 gap-1"
              role="progressbar"
              aria-label="Application progress"
              aria-valuemin={1}
              aria-valuemax={shownSteps.length}
              aria-valuenow={pos + 1}
            >
              {shownSteps.map((s, i) => (
                <span key={s} className={cn('h-1 flex-1 rounded-full transition-colors', i <= pos ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
            <span className="tabular text-xs font-medium text-muted-foreground">
              {pos + 1}/{shownSteps.length}
            </span>
          </div>
        )}
      </header>
      )}

      {step !== 'intro' && (
      <div className="no-scrollbar flex-1 overflow-y-auto">
        {step === 'setup' && <SetupStep product={product} values={values} set={set} onNext={next} />}
        {step === 'terms' && (
          <Terms product={product} values={values} agreed={agreed} setAgreed={setAgreed} onSubmit={next} creatingVault={withVault} />
        )}
        {step === 'vault' && <VaultStep values={values} set={set} onNext={next} />}
        {step === 'decision' && <Deciding product={product} />}
        {step === 'done' && <Done product={product} values={values} />}
      </div>
      )}

      {exitAsk && (
        <BottomSheet title="Finish later?" description="We’ll save your progress for 30 days." onClose={() => setExitAsk(false)}>
          <div className="flex flex-col gap-2">
            <PrimaryButton
              onClick={() => {
                dispatch({ type: 'exitOnboarding', draftStep: step })
                notify('Saved — resume anytime from Home')
              }}
            >
              Save and exit
            </PrimaryButton>
            <button type="button" onClick={() => setExitAsk(false)} className="h-12 rounded-xl border-2 border-shield font-semibold bg-card text-shield-700">
              Keep going
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'exitOnboarding' })}
              className="h-11 text-sm font-medium text-destructive"
            >
              Discard application
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

function Terms({
  product,
  values,
  agreed,
  setAgreed,
  onSubmit,
  creatingVault,
}: {
  product: Product
  values: SetupValues
  agreed: boolean
  setAgreed: (v: boolean) => void
  onSubmit: () => void
  /** Opening savings to start a Vault, so the last button creates the Vault. */
  creatingVault?: boolean
}) {
  const { accounts } = useBank()
  const sourceName = accounts.find((a) => a.id === values.fromId)?.name ?? 'TD Everyday Checking'
  const amount = parseAmount(values.amount)
  const summary =
    product.setup === 'card'
      ? [
          { label: 'Credit limit', value: '$8,000' },
          { label: 'Design', value: values.design[0].toUpperCase() + values.design.slice(1) },
          { label: 'AutoPay', value: values.autopay ? 'Full balance' : 'Off' },
        ]
      : product.id === 'growth-savings'
        ? [
            { label: 'First deposit', value: amount > 0 ? formatMoney(amount) : 'Add money later' },
            ...(amount > 0 ? [{ label: 'Moving from', value: sourceName }] : []),
            { label: 'Interest', value: '4.60%' },
            { label: 'Monthly fee', value: '$0' },
          ]
        : product.id === 'student'
        ? [
            { label: 'School', value: values.school.trim() || '—' },
            { label: 'Perks Pass', value: studentPerkChoices.find((p) => p.id === values.studentPerk)?.label ?? '' },
            { label: 'Credit Builder', value: values.creditBuilder ? 'On' : 'Off' },
            { label: 'First deposit', value: formatMoney(amount) },
          ]
        : product.id === 'complete'
          ? [
              { label: '5% boost', value: boostCategories.find((b) => b.id === values.boost)?.label ?? '' },
              { label: 'Smart Sweep', value: values.sweep ? `Keep ${formatMoney(values.sweepTarget)}` : 'Off' },
              { label: 'First deposit', value: formatMoney(amount) },
            ]
          : product.setup === 'deposit'
        ? [
            { label: 'Deposit', value: formatMoney(amount) },
            { label: 'Moving from', value: sourceName },
            { label: 'Term', value: `${values.months} months at ${cdTerms.find((t) => t.months === values.months)?.apy.toFixed(2)}% interest` },
            { label: 'Interest earned', value: formatMoney(cdEarnings(amount, values.months)) },
          ]
        : [
            { label: 'First deposit', value: formatMoney(amount) },
            { label: 'Portfolio', value: riskProfiles.find((r) => r.id === values.risk)?.label ?? '' },
            { label: 'Round-ups', value: values.roundUps ? 'On' : 'Off' },
          ]

  return (
    <StepBody title="Review and agree" body="The important parts, in plain language. Full documents are linked below.">
      <dl className="divide-y rounded-3xl bg-forest px-4 text-forest-foreground">
        {summary.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-sm text-forest-foreground/70">{r.label}</dt>
            <dd className="tabular text-right text-sm font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>
      {product.id !== 'growth-savings' && (
      <dl className="divide-y rounded-3xl border bg-card px-4">
        {product.keyTerms.map((t) => (
          <div key={t.label} className="flex items-start justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="text-right text-sm font-medium">{t.value}</dd>
          </div>
        ))}
      </dl>
      )}
      {product.softPull && (
        <p className="flex gap-2 rounded-2xl bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          You&apos;re pre-approved with a soft inquiry. A hard inquiry happens only after you accept.
        </p>
      )}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-sm leading-relaxed">
          I agree to the{' '}
          <span className="font-semibold text-primary underline underline-offset-2">account agreement</span>,{' '}
          <span className="font-semibold text-primary underline underline-offset-2">privacy notice</span> and to receive
          documents electronically.
        </span>
      </label>
      <div className="mt-auto">
        <PrimaryButton onClick={onSubmit} disabled={!agreed}>
          {creatingVault ? 'Create Vault' : product.setup === 'card' ? 'Accept my offer' : amount > 0 ? 'Open and fund account' : 'Open account'}
        </PrimaryButton>
      </div>
    </StepBody>
  )
}

function Deciding({ product }: { product: Product }) {
  const lines =
    product.setup === 'card'
      ? ['Confirming your pre-approval', 'Issuing your virtual card', 'Adding it to your wallet']
      : product.id === 'growth-savings'
        ? ['Opening your account', 'Setting up your first deposit', 'Getting your Vaults ready']
        : product.id === 'student'
        ? ['Confirming your enrollment', 'Opening your account', 'Unlocking your Perks Pass']
        : product.id === 'complete'
          ? ['Opening your account', 'Boosting your savings rate', 'Introducing you to your banker']
          : ['Opening your account', 'Moving money from checking', product.setup === 'invest' ? 'Buying your portfolio' : 'Locking in your rate']
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setI((x) => Math.min(x + 1, lines.length - 1)), 700)
    return () => window.clearInterval(t)
  }, [lines.length])
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-8 text-center" aria-live="polite">
      <span className="flex size-20 items-center justify-center rounded-full bg-muted text-lime">
        <Loader2 className="size-9 animate-spin" aria-hidden />
      </span>
      <ul className="flex flex-col gap-2">
        {lines.map((l, idx) => (
          <li
            key={l}
            className={cn('flex items-center justify-center gap-2 text-sm', idx <= i ? 'font-semibold text-foreground' : 'text-muted-foreground/60')}
          >
            {idx < i ? <Check className="size-4 text-primary" aria-hidden /> : <span className="size-4" />}
            {l}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Done({ product, values }: { product: Product; values: SetupValues }) {
  const { dispatch, notify, owned, accounts } = useBank()
  const sourceName = accounts.find((a) => a.id === values.fromId)?.name ?? 'Everyday Checking'
  const amount = parseAmount(values.amount)
  const maturity = new Date(2026, 9, 26)
  maturity.setMonth(maturity.getMonth() + values.months)
  const nextUp =
    product.id === 'growth-savings'
      ? undefined
      : (['step-cd', 'auto-invest', 'double-up'] as ProductId[]).find((id) => id !== product.id && !owned.includes(id))

  return (
    <StepBody
      title={
        product.id === 'growth-savings'
          ? 'Your savings account is open'
          : product.id === 'student'
          ? 'You’re all set, scholar'
          : product.id === 'complete'
            ? 'Welcome to Complete'
            : product.setup === 'card'
              ? 'You’re approved'
              : product.setup === 'deposit'
                ? 'Your CD is open'
                : 'You’re invested'
      }
      body={
        product.id === 'growth-savings'
          ? 'Now you can add Vaults to save for the things that matter, and watch each one grow.'
          : product.id === 'student'
          ? `Enrollment at ${values.school.trim()} confirmed. Your debit card is in your wallet and your perk is ready to claim.`
          : product.id === 'complete'
            ? 'Your rate boost is live on every TD savings account. Your banker, Priya, will say hi in the app today.'
            : product.setup === 'card'
          ? 'Your virtual card is ready to use right now. The physical card arrives in 5–7 days.'
          : product.setup === 'deposit'
            ? `${formatMoney(amount)} is earning a guaranteed rate until ${maturity.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
            : `${formatMoney(amount)} is invested in your ${riskProfiles.find((r) => r.id === values.risk)?.label} portfolio.`
      }
    >
      {product.setup === 'card' ? (
        <CardArt design={values.design} mask={product.mask} className="animate-in zoom-in-95" />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-forest p-6 text-center text-forest-foreground animate-in zoom-in-95">
          <span className="flex size-14 items-center justify-center rounded-full bg-lime text-lime-foreground">
            <Check className="size-7" aria-hidden />
          </span>
          <span className="tabular font-mono text-3xl font-semibold">{formatMoney(amount)}</span>
          <span className="text-sm text-forest-foreground/70">{amount > 0 ? `Moved from ${sourceName}` : 'Open and ready for your first deposit'}</span>
        </div>
      )}
      {product.setup === 'card' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-card p-3">
            <span className="block text-xs text-muted-foreground">Credit limit</span>
            <span className="tabular block font-mono text-lg font-semibold">$8,000</span>
          </div>
          <div className="rounded-2xl bg-card p-3">
            <span className="block text-xs text-muted-foreground">Welcome bonus</span>
            <span className="block text-sm font-semibold">$200 after $1,000</span>
          </div>
        </div>
      )}
      {nextUp && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'startOnboarding', productId: nextUp })}
          className="flex items-center gap-3 rounded-2xl border border-dashed bg-card p-3 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lime">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Next: {products[nextUp].name}</span>
            <span className="block text-xs text-muted-foreground">{products[nextUp].tagline} · you&apos;re already verified</span>
          </span>
        </button>
      )}
      <div className="mt-auto flex flex-col gap-2">
        {product.setup === 'card' && values.wallet && (
          <button
            type="button"
            onClick={() => notify('Added to Apple Wallet')}
            className="h-12 rounded-xl bg-shield-950 font-semibold text-white"
          >
            Add to Apple Wallet
          </button>
        )}
        {product.id === 'growth-savings' ? (
          <>
            <PrimaryButton
              onClick={() => {
                dispatch({ type: 'exitOnboarding' })
                openVaultsLanding(dispatch)
              }}
            >
              Create your first Vault
            </PrimaryButton>
            <button type="button" onClick={() => dispatch({ type: 'exitOnboarding' })} className="h-12 rounded-xl font-semibold text-primary">
              Not now
            </button>
          </>
        ) : (
          <PrimaryButton onClick={() => dispatch({ type: 'exitOnboarding' })}>Done</PrimaryButton>
        )}
      </div>
    </StepBody>
  )
}
