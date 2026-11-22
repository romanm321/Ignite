'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Lock, Trophy, X } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import {
  avatarLabels,
  avatarSrc,
  cardColors,
  lessons,
  stickerSlots,
  stickerSrc,
  themes,
  type CardColor,
  type KidAvatar,
  type KidTheme,
  type StickerId,
} from '@/lib/family-data'
import { cn } from '@/lib/utils'
import { useBank } from '../bank-provider'
import { BottomSheet, PrimaryButton } from '../overlay'
import { Confetti } from '../celebrate'
import { useFamily } from './family-provider'
import { KidCard, StickerImg } from './kid-visuals'

export function CardStudioSheet({ onClose }: { onClose: () => void }) {
  const { kid, dispatch } = useFamily()
  const { notify } = useBank()
  const allowed = kid.controls.canCustomize
  const full = kid.stickers.length >= stickerSlots.length

  const addSticker = (sticker: StickerId) => {
    if (full) return notify('Your card is full! Tap a sticker to peel it off.')
    const used = new Set(kid.stickers.map((s) => s.slot))
    const slot = stickerSlots.findIndex((_, i) => !used.has(i))
    dispatch({ type: 'patch', id: kid.id, patch: { stickers: [...kid.stickers, { id: `st-${Date.now()}`, sticker, slot }] } })
  }

  return (
    <BottomSheet className="td-playful" title="Make it yours" description="Decorate your card and pick your look." onClose={onClose}>
      <div className="flex flex-col gap-6">
        <section aria-labelledby="studio-card" className="flex flex-col gap-3">
          <h3 id="studio-card" className="sr-only">
            Your card
          </h3>
          <KidCard kid={kid} onSticker={allowed.stickers ? (id) => dispatch({ type: 'patch', id: kid.id, patch: { stickers: kid.stickers.filter((s) => s.id !== id) } }) : undefined} />
          {allowed.stickers ? (
            <>
              <p className="text-center text-xs text-muted-foreground">Tap a sticker below to stick it. Tap one on the card to peel it off.</p>
              <div className="grid grid-cols-6 gap-2">
                {(Object.keys(stickerSrc) as StickerId[]).map((s) => (
                  <button key={s} type="button" aria-label={`Add ${s} sticker`} onClick={() => addSticker(s)} className="aspect-square transition-transform active:scale-90">
                    <StickerImg id={s} className="size-full" />
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Card color" className="flex justify-center gap-3">
                {(Object.keys(cardColors) as CardColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={kid.cardColor === c}
                    aria-label={cardColors[c].label}
                    onClick={() => dispatch({ type: 'patch', id: kid.id, patch: { cardColor: c } })}
                    className={cn('size-11 rounded-full ring-offset-2 ring-offset-background', cardColors[c].cls, kid.cardColor === c && 'ring-[3px] ring-foreground')}
                  />
                ))}
              </div>
            </>
          ) : (
            <Locked what="Stickers" />
          )}
        </section>

        <section aria-labelledby="studio-avatar" className="flex flex-col gap-3">
          <h3 id="studio-avatar" className="font-semibold">
            Your character
          </h3>
          {allowed.avatar ? (
            <div role="radiogroup" aria-label="Character" className="grid grid-cols-4 gap-2">
              {(['photo', 'fox', 'robot', 'unicorn'] as KidAvatar[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={kid.avatar === a}
                  onClick={() => dispatch({ type: 'patch', id: kid.id, patch: { avatar: a } })}
                  className="flex flex-col items-center gap-1"
                >
                  <span className={cn('relative block size-16 overflow-hidden rounded-full bg-muted ring-offset-2 ring-offset-background', kid.avatar === a && 'ring-[3px] ring-primary')}>
                    <Image src={a === 'photo' ? kid.photo : avatarSrc[a]} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="text-center text-[11px] font-medium leading-tight">{avatarLabels[a]}</span>
                </button>
              ))}
            </div>
          ) : (
            <Locked what="Characters" />
          )}
        </section>

        <section aria-labelledby="studio-theme" className="flex flex-col gap-3">
          <h3 id="studio-theme" className="font-semibold">
            App world
          </h3>
          {allowed.theme ? (
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-4 gap-2">
              {(Object.keys(themes) as KidTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={kid.theme === t}
                  onClick={() => dispatch({ type: 'patch', id: kid.id, patch: { theme: t } })}
                  className={cn('flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold', themes[t].bg, themes[t].ink, kid.theme === t && 'ring-[3px] ring-primary')}
                >
                  <span className={cn('size-4 rounded-full', themes[t].accent)} aria-hidden />
                  {themes[t].label}
                </button>
              ))}
            </div>
          ) : (
            <Locked what="Themes" />
          )}
        </section>
        <PrimaryButton onClick={onClose}>Looks awesome</PrimaryButton>
      </div>
    </BottomSheet>
  )
}

function Locked({ what }: { what: string }) {
  return (
    <p className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
      <Lock className="size-4 shrink-0" aria-hidden /> {what} are turned off by your grown-up.
    </p>
  )
}

export function LessonSheet({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const { kid, dispatch, fund } = useFamily()
  const lesson = lessons.find((l) => l.id === lessonId)!
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const already = kid.lessonsDone.includes(lesson.id)
  const correct = picked === lesson.answer

  const finish = () => {
    if (!already) {
      dispatch({ type: 'lesson', id: kid.id, lessonId: lesson.id })
      if (kid.controls.learnBonus > 0) fund(kid.id, kid.controls.learnBonus, `Learn & earn: ${lesson.title}`, 'lesson')
    }
    setDone(true)
  }

  if (done) {
    return (
      <BottomSheet className="td-playful" title="Lesson complete!" onClose={onClose}>
        {!already && <Confetti count={60} />}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-[#ffcf3f] text-[#5a3a00] shadow-lg">
            <Trophy className="size-10" aria-hidden />
          </span>
          <p className="text-2xl font-black">{already ? 'Still a pro!' : `+${lesson.xp} XP`}</p>
          <p className="text-sm text-muted-foreground">
            {already
              ? 'You already earned this badge. Practice makes perfect.'
              : `You earned the ${lesson.badge} badge${kid.controls.learnBonus ? ` and ${formatMoney(kid.controls.learnBonus)} from Mom` : ''}!`}
          </p>
          <PrimaryButton onClick={onClose}>Awesome!</PrimaryButton>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet className="td-playful" title={lesson.title} description={lesson.blurb} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-3xl bg-accent p-4">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-full bg-white">
            <Image src="/images/family/penny.webp" alt="Penny the piggy bank" fill sizes="64px" className="scale-125 object-contain" />
          </span>
          <p className="text-pretty text-base font-semibold leading-snug text-accent-foreground">{lesson.question}</p>
        </div>
        <div role="radiogroup" aria-label={lesson.question} className="flex flex-col gap-2">
          {lesson.options.map((o, i) => {
            const state = picked === null ? 'idle' : i === lesson.answer ? 'right' : picked === i ? 'wrong' : 'idle'
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={picked === i}
                disabled={correct}
                onClick={() => setPicked(i)}
                className={cn(
                  'flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 px-4 text-left text-base font-semibold transition-transform active:scale-[0.98]',
                  state === 'right' && picked !== null && correct && 'border-primary bg-accent',
                  state === 'wrong' && 'border-destructive bg-destructive/10',
                  state === 'idle' && 'bg-card',
                )}
              >
                {o}
                {correct && i === lesson.answer && <Check className="size-5 text-primary" aria-hidden />}
                {state === 'wrong' && <X className="size-5 text-destructive" aria-hidden />}
              </button>
            )
          })}
        </div>
        {picked !== null && (
          <p role="status" className={cn('rounded-2xl p-3 text-sm leading-relaxed', correct ? 'bg-accent text-accent-foreground' : 'bg-secondary')}>
            {correct ? lesson.why : 'Not quite! Give it another try.'}
          </p>
        )}
        <PrimaryButton disabled={!correct} onClick={finish}>
          {already ? 'Finish' : `Collect ${lesson.xp} XP`}
        </PrimaryButton>
      </div>
    </BottomSheet>
  )
}
