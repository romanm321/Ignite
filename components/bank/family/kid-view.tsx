'use client'

import Image from 'next/image'
import { Check, Clock, Flame, Gift, Lock, Plus, Sparkles, Star, Trophy, Wand2 } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import { lessons, levelFor, themes } from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { useFamily } from './family-provider'
import { KidCard, KidFace, goalIconMap } from './kid-visuals'
import type { FamilySheet } from './family-screen'

export function KidView({ open }: { open: (s: FamilySheet) => void }) {
  const { kid, dispatch } = useFamily()
  const { notify } = useBank()
  const t = themes[kid.theme]
  const lvl = levelFor(kid.xp)
  const latestGift = kid.activity.find((a) => a.kind === 'gift')
  const canDecorate = Object.values(kid.controls.canCustomize).some(Boolean)
  const dark = kid.theme === 'space'

  const tip = kid.tasks.some((x) => x.status === 'todo')
    ? `Finish a job to earn money for ${kid.goals[0]?.name ?? 'your goal'}!`
    : 'Wow, all jobs done! Try a lesson to earn XP.'

  return (
    <div className={cn('-mx-2 flex flex-col gap-5 rounded-[16px] px-4 pb-6 pt-5', t.bg, t.ink)}>
      <section aria-labelledby="hi-h" className="flex items-center gap-4">
        <KidFace kid={kid} className="size-20" ring="ring-4 ring-white shadow-lg" />
        <div className="min-w-0 flex-1">
          <h2 id="hi-h" className="text-3xl font-black tracking-tight">
            Hey {kid.name}!
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
            <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5', t.soft)}>{lvl.level.name}</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Flame className="size-4 text-[#ff7a1a]" aria-hidden /> {kid.streak} day streak
            </span>
          </p>
        </div>
        {canDecorate && (
          <button type="button" onClick={() => open({ kind: 'studio' })} aria-label="Make it yours" className={cn('flex size-12 items-center justify-center rounded-full shadow-md', t.accent, t.accentText)}>
            <Wand2 className="size-5" aria-hidden />
          </button>
        )}
      </section>

      <div className="flex items-end gap-2">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-white">
          <Image src="/images/family/penny.webp" alt="Penny the piggy bank" fill sizes="64px" className="scale-125 object-contain" />
        </span>
        <p className={cn('relative mb-3 flex-1 rounded-3xl rounded-bl-md p-3 text-sm font-semibold shadow-sm', t.panel)}>{tip}</p>
      </div>

      <section aria-labelledby="bal-h" className={cn('rounded-[14px] p-5 text-center shadow-sm', t.panel)}>
        <p id="bal-h" className="text-sm font-bold opacity-70">
          Money to spend
        </p>
        <p className="tabular font-mono text-5xl font-semibold">{formatMoney(kid.balance)}</p>
        {latestGift && latestGift.when === 'Just now' && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#ffcf3f] px-3 py-1 text-sm font-bold text-[#5a3a00] animate-in zoom-in-75">
            <Gift className="size-4" aria-hidden /> You got a gift! +{formatMoney(latestGift.amount)}
          </p>
        )}
      </section>

      <section aria-label="My card" className="flex flex-col gap-2">
        <KidCard kid={kid} className="rotate-[-2deg]" />
        {kid.controls.canCustomize.stickers && (
          <button type="button" onClick={() => open({ kind: 'studio' })} className={cn('mx-auto flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm', t.panel)}>
            <Sparkles className="size-4" aria-hidden /> Add stickers
          </button>
        )}
      </section>

      <section aria-labelledby="kgoals-h" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 id="kgoals-h" className="text-xl font-black">
            My goals
          </h3>
          <button type="button" onClick={() => open({ kind: 'goal', kidTone: true })} className={cn('flex min-h-11 items-center gap-1 rounded-xl px-4 text-sm font-bold', t.accent, t.accentText)}>
            <Plus className="size-4" aria-hidden /> New
          </button>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {kid.goals.map((g) => {
            const Icon = goalIconMap[g.icon]
            const pct = Math.min(100, (g.saved / g.target) * 100)
            return (
              <li key={g.id}>
                <button type="button" onClick={() => open({ kind: 'fundGoal', goalId: g.id })} className={cn('flex w-full flex-col items-center gap-2 rounded-[14px] p-4 text-center shadow-sm', t.panel)}>
                  <span className="relative flex h-24 w-16 items-end overflow-hidden rounded-b-3xl rounded-t-xl border-4 border-current/20 bg-current/5" aria-hidden>
                    <span className={cn('w-full transition-all', t.accent)} style={{ height: `${pct}%` }} />
                    <Icon className="absolute inset-x-0 top-3 mx-auto size-7" />
                  </span>
                  <span className="line-clamp-1 text-sm font-bold">{g.name}</span>
                  <span className="tabular font-mono text-xs opacity-80">
                    {formatMoney(g.saved)} of {formatMoney(g.target)}
                  </span>
                  {pct >= 100 && (
                    <span className="flex items-center gap-1 text-xs font-bold">
                      <Star className="size-3.5 fill-[#ffcf3f] text-[#ffcf3f]" aria-hidden /> Goal reached!
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="jobs-h" className="flex flex-col gap-3">
        <h3 id="jobs-h" className="text-xl font-black">
          My jobs
        </h3>
        <ul className="flex flex-col gap-2">
          {kid.tasks.map((task) => (
            <li key={task.id} className={cn('flex min-h-16 items-center gap-3 rounded-3xl p-3 pl-4 shadow-sm', t.panel)}>
              <span className="min-w-0 flex-1">
                <span className={cn('block font-bold', task.status === 'done' && 'line-through opacity-60')}>{task.title}</span>
                <span className="block text-sm font-semibold opacity-70">Earn {formatMoney(task.reward)}</span>
              </span>
              {task.status === 'todo' && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'task', id: kid.id, taskId: task.id, status: 'submitted' })
                    notify('Nice work! We told Mom.')
                  }}
                  className={cn('min-h-11 rounded-xl px-4 text-sm font-black', t.accent, t.accentText)}
                >
                  I did it!
                </button>
              )}
              {task.status === 'submitted' && (
                <span className="flex items-center gap-1 text-xs font-bold opacity-80">
                  <Clock className="size-4" aria-hidden /> Waiting for Mom
                </span>
              )}
              {task.status === 'done' && (
                <span className="flex size-10 items-center justify-center rounded-full bg-[#2fb24c] text-white">
                  <Check className="size-5" aria-hidden />
                  <span className="sr-only">Paid</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="klearn-h" className="flex flex-col gap-3">
        <h3 id="klearn-h" className="text-xl font-black">
          Learn & earn
        </h3>
        <div className={cn('flex flex-col gap-2 rounded-3xl p-4 shadow-sm', t.panel)}>
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-1.5">
              <Trophy className="size-4 text-[#e8a400]" aria-hidden /> {kid.xp} XP
            </span>
            <span className="opacity-70">{lvl.next ? `${lvl.next.min - kid.xp} XP to ${lvl.next.name}` : 'Max level!'}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-current/10">
            <span className="block h-full rounded-full bg-[#ffcf3f]" style={{ width: `${lvl.progress * 100}%` }} />
          </div>
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Badges earned">
            {lessons
              .filter((l) => kid.lessonsDone.includes(l.id))
              .map((l) => (
                <li key={l.id} className="rounded-full bg-[#ffcf3f] px-2.5 py-1 text-xs font-bold text-[#5a3a00]">
                  {l.badge}
                </li>
              ))}
          </ul>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {lessons.map((l, i) => {
            const done = kid.lessonsDone.includes(l.id)
            const locked = l.minAge > kid.age
            return (
              <li key={l.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => open({ kind: 'lesson', lessonId: l.id })}
                  className={cn('flex h-full w-full flex-col gap-2 rounded-3xl p-4 text-left shadow-sm disabled:opacity-50', done ? t.soft : t.panel, dark && done && 'text-white')}
                >
                  <span className="flex items-center justify-between">
                    <span className={cn('flex size-8 items-center justify-center rounded-full text-sm font-black', done ? 'bg-[#2fb24c] text-white' : cn(t.accent, t.accentText))}>
                      {done ? <Check className="size-4" aria-hidden /> : locked ? <Lock className="size-4" aria-hidden /> : i + 1}
                    </span>
                    <span className="text-xs font-bold opacity-70">+{l.xp} XP</span>
                  </span>
                  <span className="text-sm font-bold leading-snug">{l.title}</span>
                  <span className="text-xs opacity-70">{locked ? `Unlocks at age ${l.minAge}` : done ? 'Badge earned' : l.blurb}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
