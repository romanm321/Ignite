'use client'

import { CalendarHeart, Check, Coins, Flame, Gift, ListChecks, Palette, Plus, ShieldCheck, Trash2, Trophy, X } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { lessons, levelFor, parentProfile } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { SectionHeader } from '../primitives'
import { useFamily } from './family-provider'
import { Face, KidCard, KidFace, goalIconMap } from './kid-visuals'
import type { FamilySheet } from './family-screen'

export function ParentView({ open }: { open: (s: FamilySheet) => void }) {
  const { kid, dispatch, fund } = useFamily()
  const { notify, streetSafe } = useBank()
  const mask = (s: string) => (streetSafe ? '••••' : s)
  const saved = kid.goals.reduce((s, g) => s + g.saved, 0)
  const pending = kid.tasks.filter((t) => t.status === 'submitted')
  const lvl = levelFor(kid.xp)
  const birthdayDays = daysUntil(kid.birthday)

  const approve = (taskId: string, reward: number, title: string) => {
    if (!fund(kid.id, reward, title, 'task')) return notify('Not enough in checking to pay this task')
    dispatch({ type: 'task', id: kid.id, taskId, status: 'done' })
    notify(`Paid ${kid.name} ${formatMoney(reward)}. High five sent!`)
  }

  const actions = [
    { label: 'Send gift', icon: Gift, onClick: () => open({ kind: 'gift' }) },
    { label: 'Allowance', icon: Coins, onClick: () => open({ kind: 'allowance' }) },
    { label: 'Controls', icon: ShieldCheck, onClick: () => open({ kind: 'controls' }) },
    { label: 'Card', icon: Palette, onClick: () => open({ kind: 'studio' }) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="pair-h" className="flex flex-col gap-4 rounded-3xl bg-forest p-5 text-forest-foreground">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 -space-x-4">
            <Face src={parentProfile.photo} alt={`${parentProfile.name}, account owner`} className="size-16" ring="ring-4 ring-forest" />
            <KidFace kid={kid} mode="photo" className="size-16" ring="ring-4 ring-forest" />
          </div>
          <div className="min-w-0">
            <h2 id="pair-h" className="text-lg font-semibold leading-tight">
              {parentProfile.name} & {kid.name}
            </h2>
            <p className="text-sm text-forest-foreground/70">
              You manage · {kid.name} is {kid.age}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <dt className="text-xs text-forest-foreground/70">Spending</dt>
            <dd className="tabular font-mono text-xl font-semibold">{mask(formatMoney(kid.balance))}</dd>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <dt className="text-xs text-forest-foreground/70">Saved in goals</dt>
            <dd className="tabular font-mono text-xl font-semibold text-lime">{mask(formatMoney(saved))}</dd>
          </div>
          <div className="col-span-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-forest-foreground/70">
            <span>Account {streetSafe ? '•••• ••••' : kid.accountNumber}</span>
            <span>Card •••• {kid.cardMask}</span>
            <span>{kid.allowance.on ? `${formatMoney(kid.allowance.amount)} every ${kid.allowance.day}` : 'Allowance paused'}</span>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-card text-xs font-semibold">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-lime">
              <a.icon className="size-5" aria-hidden />
            </span>
            {a.label}
          </button>
        ))}
      </div>

      {birthdayDays !== null && birthdayDays <= 30 && (
        <button type="button" onClick={() => open({ kind: 'gift' })} className="flex items-center gap-3 rounded-3xl bg-[#ffcf3f] p-4 text-left text-forest">
          <CalendarHeart className="size-6 shrink-0" aria-hidden />
          <span className="flex-1 text-sm">
            <span className="block font-semibold">{kid.name}’s birthday is in {birthdayDays} days</span>
            <span className="block">Wrap a gift now and we’ll unwrap it on {kid.birthday}.</span>
          </span>
        </button>
      )}

      <section aria-labelledby="ok-h" className="flex flex-col gap-3">
        <SectionHeader id="ok-h" title={pending.length ? `Needs your OK · ${pending.length}` : 'Needs your OK'} />
        {pending.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">All caught up. Nothing waiting on you.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                <KidFace kid={kid} className="size-10" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold">{t.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {kid.name} says it’s done · {formatMoney(t.reward)}
                  </span>
                </span>
                <button type="button" aria-label={`Send back ${t.title}`} onClick={() => dispatch({ type: 'task', id: kid.id, taskId: t.id, status: 'todo' })} className="flex size-11 items-center justify-center rounded-full bg-secondary">
                  <X className="size-4" aria-hidden />
                </button>
                <button type="button" aria-label={`Approve and pay ${t.title}`} onClick={() => approve(t.id, t.reward, t.title)} className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tasks-h" className="flex flex-col gap-3">
        <SectionHeader
          id="tasks-h"
          title="Tasks & chores"
          action={
            <button type="button" onClick={() => open({ kind: 'task' })} className="flex h-11 items-center gap-1 text-sm font-semibold text-primary">
              <Plus className="size-4" aria-hidden /> Add
            </button>
          }
        />
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          {kid.tasks.map((t) => (
            <li key={t.id} className="flex min-h-14 items-center gap-3 py-2 pl-4 pr-2">
              <ListChecks className={cn('size-5 shrink-0', t.status === 'done' ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block font-medium">{t.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatMoney(t.reward)} · {t.repeat === 'weekly' ? 'Weekly' : 'Once'} · {t.status === 'done' ? 'Paid' : t.status === 'submitted' ? 'Waiting on you' : 'To do'}
                </span>
              </span>
              <button type="button" aria-label={`Delete ${t.title}`} onClick={() => dispatch({ type: 'removeTask', id: kid.id, taskId: t.id })} className="flex size-11 items-center justify-center text-muted-foreground">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="goals-h" className="flex flex-col gap-3">
        <SectionHeader
          id="goals-h"
          title={`${kid.name}’s goals`}
          action={
            <button type="button" onClick={() => open({ kind: 'goal' })} className="flex h-11 items-center gap-1 text-sm font-semibold text-primary">
              <Plus className="size-4" aria-hidden /> New
            </button>
          }
        />
        <ul className="flex flex-col gap-2">
          {kid.goals.map((g) => {
            const Icon = goalIconMap[g.icon]
            const pct = Math.min(100, (g.saved / g.target) * 100)
            return (
              <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-sm">
                    <span className="truncate font-semibold">{g.name}</span>
                    <span className="tabular font-mono text-xs">
                      {formatMoney(g.saved)} / {formatMoney(g.target)}
                    </span>
                  </span>
                  <span className="mt-2 block h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                </span>
                {pct < 100 && (
                  <button
                    type="button"
                    onClick={() => {
                      const amt = Math.min(5, g.target - g.saved)
                      if (fund(kid.id, amt, `Boost for ${g.name}`, 'gift')) {
                        dispatch({ type: 'fundGoal', id: kid.id, goalId: g.id, amount: amt })
                        notify(`You chipped in ${formatMoney(amt)} to ${g.name}`)
                      }
                    }}
                    className="min-h-11 shrink-0 rounded-xl bg-shield-50 px-3 text-xs font-semibold text-shield-700"
                  >
                    Chip in $5
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="learn-h" className="flex flex-col gap-3">
        <SectionHeader id="learn-h" title="Money smarts" />
        <div className="flex flex-col gap-3 rounded-3xl bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#ffcf3f] text-[#5a3a00]">
              <Trophy className="size-5" aria-hidden />
            </span>
            <span className="flex-1 text-sm">
              <span className="block font-semibold">
                {lvl.level.name} · {kid.xp} XP
              </span>
              <span className="block text-xs text-muted-foreground">
                {kid.lessonsDone.length} of {lessons.length} lessons · {formatMoney(kid.controls.learnBonus)} per lesson
              </span>
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-[#e5531a]">
              <Flame className="size-4" aria-hidden /> {kid.streak}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-[#ffcf3f]" style={{ width: `${lvl.progress * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {lvl.next ? `${lvl.next.min - kid.xp} XP to ${lvl.next.name}.` : 'Top level reached!'} Up next:{' '}
            {lessons.find((l) => !kid.lessonsDone.includes(l.id) && l.minAge <= kid.age)?.title ?? 'all done'}
          </p>
        </div>
      </section>

      <section aria-labelledby="act-h" className="flex flex-col gap-3">
        <SectionHeader id="act-h" title="Recent activity" />
        <ul className="divide-y overflow-hidden rounded-3xl bg-card">
          {kid.activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex min-h-14 items-center gap-3 px-4 py-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.label}</span>
                <span className="block text-xs capitalize text-muted-foreground">
                  {a.kind} · {a.when}
                </span>
              </span>
              <span className={cn('tabular font-mono font-semibold', a.amount > 0 && 'text-primary')}>
                {a.amount > 0 ? '+' : '−'}
                {formatMoney(Math.abs(a.amount))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={`${kid.name}’s card`} className="flex flex-col gap-3">
        <KidCard kid={kid} masked={streetSafe} />
        <button type="button" onClick={() => open({ kind: 'studio' })} className="h-12 rounded-xl border-2 border-shield font-semibold bg-card text-shield-700">
          Customize card
        </button>
      </section>
    </div>
  )
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function daysUntil(birthday: string) {
  const [m, d] = birthday.split(' ')
  const mi = months.indexOf(m)
  const day = Number(d)
  if (mi < 0 || !day) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), mi, day)
  if (next < today) next = new Date(now.getFullYear() + 1, mi, day)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}
