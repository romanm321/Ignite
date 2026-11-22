'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BadgeCheck, Camera } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { avatarLabels, avatarSrc, cardColors, defaultControls, newKidPhotos, themes, type CardColor, type Kid, type KidAvatar, type KidTheme } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'
import { useFamily } from './family-provider'
import { KidCard } from './kid-visuals'

const steps = ['About them', 'Look & feel', 'Money setup', 'Ground rules'] as const

export function AddChildSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useFamily()
  const { notify, dispatch: bankDispatch } = useBank()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [age, setAge] = useState(7)
  const [birthday, setBirthday] = useState('')
  const [photo, setPhoto] = useState<string>('')
  const [avatar, setAvatar] = useState<KidAvatar>('unicorn')
  const [theme, setTheme] = useState<KidTheme>('candy')
  const [cardColor, setCardColor] = useState<CardColor>('sky')
  const [allowance, setAllowance] = useState(5)
  const [starter, setStarter] = useState(10)
  const [goal, setGoal] = useState('')
  const [controls, setControls] = useState(defaultControls(7))

  const displayName = name.trim() || 'Your child'
  const preview: Kid = {
    id: 'preview',
    name: displayName,
    age,
    birthday: birthday || 'Birthday',
    photo: photo || '/placeholder-user.jpg',
    avatar,
    theme,
    balance: starter,
    cardMask: '7714',
    accountNumber: '4398 2210 7714',
    cardColor,
    stickers: [],
    goals: [],
    tasks: [],
    allowance: { amount: allowance, day: 'Friday', savePct: 20, on: true },
    controls,
    xp: 0,
    lessonsDone: [],
    streak: 0,
    activity: [],
  }

  const canNext = [name.trim().length >= 2 && birthday.trim().length >= 3, true, true, true][step]

  const finish = () => {
    const id = `kid-${Date.now()}`
    const kid: Kid = {
      ...preview,
      id,
      name: name.trim(),
      balance: starter,
      activity: starter ? [{ id: `a-${id}`, label: 'Welcome money from Mom', amount: starter, when: 'Just now', kind: 'gift' }] : [],
      photo: photo || avatarSrc.unicorn,
      goals: goal.trim() ? [{ id: `g-${id}`, name: goal.trim(), target: 50, saved: 0, icon: 'gift' }] : [],
      tasks: [{ id: `t-${id}`, title: 'Make your bed', reward: 0.5, status: 'todo', repeat: 'weekly' }],
    }
    dispatch({ type: 'addKid', kid })
    if (starter > 0) bankDispatch({ type: 'familyFund', amount: starter, memo: `Welcome money · ${kid.name}` })
    bankDispatch({
      type: 'celebrate',
      celebration: { kind: 'product', title: `Welcome to TD Family, ${kid.name}!`, body: 'Their card ships in 5–7 days. The virtual card works today in Apple Pay with your rules already on.' },
    })
    notify(`${kid.name}’s account is open`)
    onClose()
  }

  return (
    <BottomSheet className="td-playful" title="Add a child" description={`Step ${step + 1} of 4 · ${steps[step]}`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <ol className="flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <li key={s} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </ol>

        {step === 0 && (
          <>
            <p className="flex items-start gap-2 rounded-2xl bg-accent p-3 text-sm text-accent-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              You’re the account owner, so we only need a few details. No SSN needed for kids under 13.
            </p>
            <Field label="First name">
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="e.g. Ava" className={inputClass} />
            </Field>
            <Field label="Birthday" hint="We’ll remind you a week before so you can send a gift">
              <input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="e.g. Mar 14" className={inputClass} />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Age</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Younger" onClick={() => setAge((a) => Math.max(5, a - 1))} className="size-12 rounded-full border bg-card text-xl font-semibold">
                  −
                </button>
                <span className="tabular w-16 text-center font-mono text-2xl font-semibold" aria-live="polite">
                  {age}
                </span>
                <button type="button" aria-label="Older" onClick={() => setAge((a) => Math.min(17, a + 1))} className="size-12 rounded-full border bg-card text-xl font-semibold">
                  +
                </button>
                <span className="text-sm text-muted-foreground">{age < 9 ? 'Little saver' : age < 13 ? 'Tween' : 'Teen'} experience</span>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Photo for your view</span>
              <div className="flex gap-3">
                {newKidPhotos.map((p) => (
                  <button key={p} type="button" aria-pressed={photo === p} onClick={() => setPhoto(p)} className={cn('relative size-16 overflow-hidden rounded-full ring-offset-2 ring-offset-background', photo === p && 'ring-[3px] ring-primary')}>
                    <Image src={p} alt="Suggested photo from your camera roll" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
                <button type="button" onClick={() => setPhoto(newKidPhotos[0])} className="flex size-16 flex-col items-center justify-center rounded-full border-2 border-dashed text-muted-foreground">
                  <Camera className="size-5" aria-hidden />
                  <span className="sr-only">Choose a photo</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{displayName}’s character</span>
              <div role="radiogroup" aria-label="Character" className="flex gap-3">
                {(['fox', 'robot', 'unicorn'] as const).map((a) => (
                  <button key={a} type="button" role="radio" aria-checked={avatar === a} onClick={() => setAvatar(a)} className="flex flex-col items-center gap-1">
                    <span className={cn('relative block size-16 overflow-hidden rounded-full ring-offset-2 ring-offset-background', avatar === a && 'ring-[3px] ring-primary')}>
                      <Image src={avatarSrc[a]} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                    <span className="text-[11px] font-medium">{avatarLabels[a]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-4 gap-2">
              {(Object.keys(themes) as KidTheme[]).map((t) => (
                <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => setTheme(t)} className={cn('h-14 rounded-2xl text-xs font-bold', themes[t].bg, themes[t].ink, theme === t && 'ring-[3px] ring-primary')}>
                  {themes[t].label}
                </button>
              ))}
            </div>
            <KidCard kid={preview} />
            <div role="radiogroup" aria-label="Card color" className="flex justify-center gap-3">
              {(Object.keys(cardColors) as CardColor[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={cardColor === c} aria-label={cardColors[c].label} onClick={() => setCardColor(c)} className={cn('size-11 rounded-full ring-offset-2 ring-offset-background', cardColors[c].cls, cardColor === c && 'ring-[3px] ring-foreground')} />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <ChipRow label="Weekly allowance" options={[0, 3, 5, 10]} value={allowance} onChange={setAllowance} />
            <ChipRow label="Welcome money from you" options={[0, 5, 10, 20]} value={starter} onChange={setStarter} />
            <Field label="First savings goal (optional)" hint={`${displayName} can change this later`}>
              <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Art supplies" className={inputClass} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We set these for a {age}-year-old. You can change them anytime from Controls.
            </p>
            <ul className="divide-y rounded-2xl border text-sm">
              <Rule label="Daily spending limit" value={formatMoney(controls.dailyLimit)} />
              <Rule label="Ask me before purchases over" value={formatMoney(controls.approveOver)} />
              <Rule label="Online purchases" value={controls.online ? 'Allowed' : 'Off'} action={() => setControls({ ...controls, online: !controls.online })} />
              <Rule label="Blocked" value={controls.blocked.join(', ') || 'None'} />
              <Rule label={`${displayName} can customize`} value="Theme, character, stickers" />
            </ul>
            <button type="button" onClick={() => setControls(defaultControls(age))} className="self-start text-sm font-semibold text-primary">
              Reset to suggested for age {age}
            </button>
          </>
        )}

        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="h-12 rounded-xl border-2 border-shield px-6 font-semibold bg-card text-shield-700">
              Back
            </button>
          )}
          <div className="flex-1">
            <PrimaryButton
              disabled={!canNext}
              onClick={() => {
                if (step === 0) setControls(defaultControls(age))
                if (step < 3) setStep((s) => s + 1)
                else finish()
              }}
            >
              {step < 3 ? 'Continue' : `Open ${displayName}’s account`}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}

function ChipRow({ label, options, value, onChange }: { label: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)} className={cn('min-h-11 flex-1 rounded-xl border text-sm font-semibold', value === o ? 'border-shield bg-shield text-shield-foreground' : 'bg-card')}>
            {o ? `$${o}` : 'None'}
          </button>
        ))}
      </div>
    </div>
  )
}

function Rule({ label, value, action }: { label: string; value: string; action?: () => void }) {
  return (
    <li className="flex min-h-12 items-center gap-3 px-4 py-2">
      <span className="flex-1 text-muted-foreground">{label}</span>
      {action ? (
        <button type="button" onClick={action} className="font-semibold text-primary underline">
          {value}
        </button>
      ) : (
        <span className="text-right font-semibold">{value}</span>
      )}
    </li>
  )
}
