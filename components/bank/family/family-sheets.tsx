'use client'

import { useState } from 'react'
import { Ban, CalendarHeart, Gift, Lock, Send, Users } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { allBlocked, giftOccasions, goalIcons, type GiftOccasion, type GoalIcon, type KidControls } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { BottomSheet, Field, PrimaryButton, inputClass } from '../overlay'
import { Switch } from '../primitives'
import { Confetti } from '../celebrate'
import { useFamily } from './family-provider'
import { KidFace, goalIconMap } from './kid-visuals'

const stamp = () => `${Date.now().toString(36)}`

function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            'min-h-11 rounded-xl border px-4 text-sm font-semibold',
            value === o ? 'border-shield bg-shield text-shield-foreground' : 'bg-card',
          )}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

export function ControlsSheet({ onClose }: { onClose: () => void }) {
  const { kid, dispatch } = useFamily()
  const { notify } = useBank()
  const c = kid.controls
  const set = (patch: Partial<KidControls>) => dispatch({ type: 'patch', id: kid.id, patch: { controls: { ...c, ...patch } } })

  const rows: { title: string; detail: string; checked: boolean; onChange: (v: boolean) => void; tone?: 'destructive' }[] = [
    {
      title: 'Pause card',
      detail: 'Stops all card spending instantly',
      checked: c.cardLocked,
      tone: 'destructive',
      onChange: (v) => {
        set({ cardLocked: v })
        notify(v ? `${kid.name}’s card is paused` : `${kid.name}’s card is back on`)
      },
    },
    { title: 'Online purchases', detail: 'Apps, games and websites', checked: c.online, onChange: (v) => set({ online: v }) },
    { title: 'ATM withdrawals', detail: 'Cash from TD ATMs only', checked: c.atm, onChange: (v) => set({ atm: v }) },
  ]

  return (
    <BottomSheet className="td-playful" title={`${kid.name}’s controls`} description="Changes apply instantly. We’ll tell them what changed, kindly." onClose={onClose}>
      <div className="flex flex-col gap-5">
        <ul className="divide-y rounded-2xl border">
          {rows.map((r) => (
            <li key={r.title} className="flex items-center gap-3 py-1.5 pl-4 pr-2">
              <span className="flex-1">
                <span className="block text-sm font-semibold">{r.title}</span>
                <span className="block text-xs text-muted-foreground">{r.detail}</span>
              </span>
              <Switch label={r.title} checked={r.checked} onChange={r.onChange} tone={r.tone} />
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Daily spending limit</span>
          <Chips label="Daily spending limit" options={[10, 15, 30, 50] as const} value={c.dailyLimit as 10} onChange={(v) => set({ dailyLimit: v })} format={(v) => `$${v}`} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Ask me before purchases over</span>
          <Chips label="Approval threshold" options={[5, 10, 25, 50] as const} value={c.approveOver as 5} onChange={(v) => set({ approveOver: v })} format={(v) => `$${v}`} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Ban className="size-4 text-destructive" aria-hidden /> Blocked categories
          </span>
          <div className="flex flex-wrap gap-2">
            {allBlocked.map((b) => {
              const on = c.blocked.includes(b)
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ blocked: on ? c.blocked.filter((x) => x !== b) : [...c.blocked, b] })}
                  className={cn('min-h-11 rounded-xl border px-4 text-sm font-semibold', on ? 'border-destructive bg-destructive/10 text-destructive' : 'bg-card')}
                >
                  {b}
                </button>
              )
            })}
            <span className="flex min-h-11 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm text-muted-foreground">
              <Lock className="size-3.5" aria-hidden /> Gambling, alcohol, adult: always
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Learn & earn bonus per lesson</span>
          <Chips label="Lesson bonus" options={[0, 0.5, 1, 2] as const} value={c.learnBonus as 0} onChange={(v) => set({ learnBonus: v })} format={(v) => (v ? formatMoney(v) : 'Off')} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">What {kid.name} can customize</span>
          <ul className="divide-y rounded-2xl border">
            {(['theme', 'avatar', 'stickers'] as const).map((k) => (
              <li key={k} className="flex items-center gap-3 py-1.5 pl-4 pr-2">
                <span className="flex-1 text-sm font-medium capitalize">{k === 'stickers' ? 'Card stickers & color' : k === 'avatar' ? 'Character' : 'App theme'}</span>
                <Switch label={`Allow ${k}`} checked={c.canCustomize[k]} onChange={(v) => set({ canCustomize: { ...c.canCustomize, [k]: v } })} />
              </li>
            ))}
          </ul>
        </div>
        <PrimaryButton onClick={onClose}>Done</PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function AllowanceSheet({ onClose }: { onClose: () => void }) {
  const { kid, dispatch, fund } = useFamily()
  const { notify } = useBank()
  const [a, setA] = useState(kid.allowance)
  const save = Math.round(a.amount * a.savePct) / 100

  return (
    <BottomSheet className="td-playful" title="Allowance" description={`Paid from your checking every ${a.day}.`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Weekly amount</span>
          <Chips label="Weekly amount" options={[5, 10, 15, 20] as const} value={a.amount as 5} onChange={(v) => setA({ ...a, amount: v })} format={(v) => `$${v}`} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Pay day</span>
          <Chips label="Pay day" options={['Monday', 'Friday', 'Sunday'] as const} value={a.day as 'Monday'} onChange={(v) => setA({ ...a, day: v })} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Auto-save to goals</span>
          <Chips label="Auto-save" options={[0, 20, 30, 50] as const} value={a.savePct as 0} onChange={(v) => setA({ ...a, savePct: v })} format={(v) => `${v}%`} />
          <p className="text-xs text-muted-foreground">
            {a.savePct ? `${formatMoney(save)} goes to ${kid.goals[0]?.name ?? 'savings'} automatically, ${formatMoney(a.amount - save)} to spend.` : 'All of it lands in spending.'}
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border py-1.5 pl-4 pr-2">
          <span className="flex-1 text-sm font-semibold">Allowance on</span>
          <Switch label="Allowance on" checked={a.on} onChange={(on) => setA({ ...a, on })} />
        </label>
        <PrimaryButton
          onClick={() => {
            dispatch({ type: 'patch', id: kid.id, patch: { allowance: a } })
            notify(a.on ? `${formatMoney(a.amount)} every ${a.day}. Set!` : 'Allowance paused')
            onClose()
          }}
        >
          Save allowance
        </PrimaryButton>
        <button
          type="button"
          className="h-12 rounded-xl font-semibold text-primary"
          onClick={() => {
            if (fund(kid.id, a.amount, 'Allowance (early)', 'allowance')) notify(`Sent ${formatMoney(a.amount)} to ${kid.name} now`)
            onClose()
          }}
        >
          Pay this week now
        </button>
      </div>
    </BottomSheet>
  )
}

export function AddTaskSheet({ onClose }: { onClose: () => void }) {
  const { kid, dispatch } = useFamily()
  const { notify } = useBank()
  const [title, setTitle] = useState('')
  const [reward, setReward] = useState(1)
  const [repeat, setRepeat] = useState<'once' | 'weekly'>('weekly')
  const ideas = ['Walk the dog', 'Set the table', 'Water the plants', 'Practice piano', 'Fold laundry']

  return (
    <BottomSheet className="td-playful" title={`New task for ${kid.name}`} description="They tick it off, you approve, they get paid." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Task">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="e.g. Walk the dog" className={inputClass} />
        </Field>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {ideas.map((i) => (
            <button key={i} type="button" onClick={() => setTitle(i)} className="min-h-11 shrink-0 rounded-xl bg-secondary px-4 text-sm">
              {i}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Reward</span>
          <Chips label="Reward" options={[0.5, 1, 2, 5] as const} value={reward as 1} onChange={setReward} format={(v) => formatMoney(v)} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">How often</span>
          <Chips label="Repeat" options={['once', 'weekly'] as const} value={repeat} onChange={setRepeat} format={(v) => (v === 'once' ? 'Just once' : 'Every week')} />
        </div>
        <PrimaryButton
          disabled={title.trim().length < 2}
          onClick={() => {
            dispatch({ type: 'addTask', id: kid.id, task: { id: `t-${stamp()}`, title: title.trim(), reward, status: 'todo', repeat } })
            notify(`Added “${title.trim()}” for ${kid.name}`)
            onClose()
          }}
        >
          Add task
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function AddGoalSheet({ onClose, kidTone }: { onClose: () => void; kidTone?: boolean }) {
  const { kid, dispatch } = useFamily()
  const { notify } = useBank()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [icon, setIcon] = useState<GoalIcon>('gamepad')
  const t = Number(target)
  const valid = name.trim().length >= 2 && t >= 1 && t <= 5000

  return (
    <BottomSheet className="td-playful" title={kidTone ? 'What are you saving for?' : `New goal for ${kid.name}`} description={kidTone ? 'Dream big! Pick a picture and a price.' : undefined} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Goal picture" className="grid grid-cols-6 gap-2">
          {goalIcons.map((g) => {
            const Icon = goalIconMap[g]
            return (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={icon === g}
                aria-label={g}
                onClick={() => setIcon(g)}
                className={cn('flex aspect-square items-center justify-center rounded-2xl border', icon === g ? 'border-primary bg-accent text-primary' : 'bg-card')}
              >
                <Icon className="size-6" aria-hidden />
              </button>
            )
          })}
        </div>
        <Field label="Goal name">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="e.g. Nintendo Switch game" className={inputClass} />
        </Field>
        <Field label="How much does it cost?">
          <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="$60" className={inputClass} />
        </Field>
        <PrimaryButton
          disabled={!valid}
          onClick={() => {
            dispatch({ type: 'addGoal', id: kid.id, goal: { id: `g-${stamp()}`, name: name.trim(), target: t, saved: 0, icon } })
            notify(kidTone ? 'New goal! You got this.' : `Goal added for ${kid.name}`)
            onClose()
          }}
        >
          Create goal
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}

export function FundGoalSheet({ goalId, onClose }: { goalId: string; onClose: () => void }) {
  const { kid, dispatch } = useFamily()
  const { notify } = useBank()
  const goal = kid.goals.find((g) => g.id === goalId)
  const [amount, setAmount] = useState(1)
  if (!goal) return null
  const left = goal.target - goal.saved
  const max = Math.min(left, kid.balance)
  const options = [1, 5, 10].filter((n) => n <= max)

  return (
    <BottomSheet className="td-playful" title={`Add to ${goal.name}`} description={`${formatMoney(left)} to go. You have ${formatMoney(kid.balance)} to spend.`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {max <= 0 ? (
          <p className="rounded-2xl bg-secondary p-4 text-sm">{left <= 0 ? 'This goal is done! Woohoo!' : 'No spending money right now. Finish a task to earn some!'}</p>
        ) : (
          <>
            <Chips label="Amount" options={[...options, Math.round(max * 100) / 100]} value={amount} onChange={setAmount} format={(v) => (v === Math.round(max * 100) / 100 ? `All ${formatMoney(v)}` : formatMoney(v))} />
            <PrimaryButton
              onClick={() => {
                dispatch({ type: 'fundGoal', id: kid.id, goalId: goal.id, amount })
                notify(amount >= left ? `Goal reached! ${goal.name} is yours!` : `Nice! ${formatMoney(amount)} closer to ${goal.name}`)
                onClose()
              }}
            >
              Move {formatMoney(Math.min(amount, max))} to my goal
            </PrimaryButton>
          </>
        )}
      </div>
    </BottomSheet>
  )
}

export function GiftSheet({ onClose }: { onClose: () => void }) {
  const { kid, kids, fund, dispatch } = useFamily()
  const { notify, accounts } = useBank()
  const [toId, setToId] = useState(kid.id)
  const to = kids.find((k) => k.id === toId) ?? kid
  const [occasion, setOccasion] = useState<GiftOccasion>('birthday')
  const occ = giftOccasions.find((o) => o.id === occasion)!
  const [amount, setAmount] = useState(25)
  const [message, setMessage] = useState(occ.message)
  const [goalId, setGoalId] = useState<string>('')
  const [when, setWhen] = useState<'now' | 'birthday'>('now')
  const [sent, setSent] = useState(false)
  const checking = accounts.find((a) => a.id === 'chk')?.balance ?? 0

  if (sent) {
    return (
      <BottomSheet className="td-playful" title="Gift sent!" onClose={onClose}>
        <Confetti count={50} />
        <div className="flex flex-col items-center gap-4 text-center">
          <KidFace kid={to} mode="photo" className="size-24" ring="ring-4 ring-lime" />
          <p className="text-balance text-xl font-semibold">
            {when === 'now' ? `${to.name} just got ${formatMoney(amount)}` : `${formatMoney(amount)} is wrapped for ${to.birthday}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {when === 'now' ? 'They’ll see a surprise animation with your note next time they open the app.' : 'We’ll unwrap it on their birthday morning.'}
          </p>
          <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          <button
            type="button"
            onClick={() => notify('Gift link copied. Grandparents can send money without a TD account.')}
            className="flex h-12 items-center gap-2 font-semibold text-primary"
          >
            <Users className="size-4" aria-hidden /> Invite family to chip in
          </button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet className="td-playful" title="Send a gift" description="Money with a message. Way better than a gift card." onClose={onClose}>
      <div className="flex flex-col gap-4">
        {kids.length > 1 && (
          <div role="radiogroup" aria-label="Gift for" className="flex gap-3">
            {kids.map((k) => (
              <button key={k.id} type="button" role="radio" aria-checked={toId === k.id} onClick={() => setToId(k.id)} className="flex flex-col items-center gap-1">
                <KidFace kid={k} mode="photo" className="size-14" ring={toId === k.id ? 'ring-[3px] ring-primary ring-offset-2 ring-offset-background' : undefined} />
                <span className="text-xs font-semibold">{k.name}</span>
              </button>
            ))}
          </div>
        )}
        <div role="radiogroup" aria-label="Occasion" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {giftOccasions.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={occasion === o.id}
              onClick={() => {
                setOccasion(o.id)
                setMessage(o.message)
                if (o.id !== 'birthday') setWhen('now')
              }}
              className={cn('min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold text-forest', o.tone, occasion === o.id ? 'ring-2 ring-forest' : 'opacity-70')}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className={cn('flex flex-col gap-2 rounded-3xl p-5 text-forest', occ.tone)}>
          <span className="flex items-center gap-2 text-sm font-bold">
            <Gift className="size-4" aria-hidden /> For {to.name}
          </span>
          <p className="tabular font-mono text-4xl font-semibold">{formatMoney(amount)}</p>
          <p className="text-pretty text-sm leading-relaxed">{message || ' '}</p>
        </div>

        <Chips label="Amount" options={[10, 25, 50, 100] as const} value={amount as 10} onChange={setAmount} format={(v) => `$${v}`} />
        <Field label="Your note">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={120} rows={2} className={cn(inputClass, 'h-auto py-3')} />
        </Field>
        {to.goals.length > 0 && (
          <Field label="Put it toward a goal? (optional)">
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={inputClass}>
              <option value="">No, it’s spending money</option>
              {to.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {occasion === 'birthday' && (
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <CalendarHeart className="size-4 text-primary" aria-hidden /> When
            </span>
            <Chips label="When" options={['now', 'birthday'] as const} value={when} onChange={setWhen} format={(v) => (v === 'now' ? 'Send now' : `On ${to.birthday}`)} />
          </div>
        )}
        {amount > checking && <p role="alert" className="text-sm text-destructive">That’s more than your checking balance.</p>}
        <PrimaryButton
          disabled={amount > checking}
          onClick={() => {
            if (when === 'now') {
              const ok = fund(to.id, amount, `${occ.label} gift from Mom`, 'gift')
              if (!ok) return
              if (goalId) dispatch({ type: 'fundGoal', id: to.id, goalId, amount })
            }
            setSent(true)
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Send className="size-4" aria-hidden /> {when === 'now' ? 'Send gift' : 'Schedule gift'}
          </span>
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
