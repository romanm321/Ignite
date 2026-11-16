'use client'

import { useMemo, useState } from 'react'
import {
  Building2,
  CalendarCheck,
  Check,
  ChevronLeft,
  Download,
  FileCheck2,
  Phone,
  Sparkles,
  Star,
  Video,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  appointmentReasons,
  bankers,
  timeSlots,
  upcomingDays,
  type AppointmentMode,
  type Branch,
} from '@/lib/bank-data'
import { useBank } from '../bank-provider'

type Step = 'reason' | 'mode' | 'banker' | 'time' | 'review' | 'done'
const steps: Step[] = ['reason', 'mode', 'banker', 'time', 'review']

const modes: { id: AppointmentMode; label: string; detail: string; icon: typeof Video }[] = [
  { id: 'in-branch', label: 'In branch', detail: 'Meet face to face', icon: Building2 },
  { id: 'video', label: 'Video call', detail: 'From anywhere, screen-share docs', icon: Video },
  { id: 'phone', label: 'Phone call', detail: 'We call you at the time', icon: Phone },
]

function isTaken(dayIdx: number, slot: string) {
  return (dayIdx * 7 + slot.length * 3) % 5 === 0
}

function toIcsDate(date: Date, time: string) {
  const [hm, ampm] = time.split(' ')
  const [hRaw, m] = hm.split(':').map(Number)
  const h = (hRaw % 12) + (ampm === 'PM' ? 12 : 0)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function BookingSheet({ branch, onClose }: { branch: Branch; onClose: () => void }) {
  const { dispatch, notify } = useBank()
  const [step, setStep] = useState<Step>('reason')
  const [reasonId, setReasonId] = useState<string | null>(null)
  const [mode, setMode] = useState<AppointmentMode>('in-branch')
  const [bankerId, setBankerId] = useState<string>('any')
  const [dayIdx, setDayIdx] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [checked, setChecked] = useState<string[]>([])

  const days = useMemo(() => upcomingDays(10), [])
  const reason = appointmentReasons.find((r) => r.id === reasonId)

  const bankerPool = useMemo(() => {
    const pool = mode === 'in-branch' ? bankers.filter((b) => branch.bankerIds.includes(b.id)) : bankers
    return [...pool].sort(
      (a, b) =>
        Number(reason ? b.specialties.includes(reason.specialty) : 0) -
        Number(reason ? a.specialties.includes(reason.specialty) : 0),
    )
  }, [mode, branch, reason])

  const banker = bankers.find((b) => b.id === bankerId)
  const stepIdx = steps.indexOf(step)

  const canNext =
    (step === 'reason' && !!reasonId) ||
    step === 'mode' ||
    step === 'banker' ||
    (step === 'time' && !!slot) ||
    step === 'review'

  function next() {
    if (step === 'review') return confirm()
    setStep(steps[stepIdx + 1])
  }

  function confirm() {
    if (!reason || !slot) return
    const assigned = banker ?? bankerPool[0]
    dispatch({
      type: 'book',
      appointment: {
        id: `apt-${Date.now()}`,
        branchId: branch.id,
        bankerId: assigned.id,
        reason: reason.label,
        mode,
        dateISO: days[dayIdx].toISOString(),
        time: slot,
        notes,
      },
    })
    if (bankerId === 'any') setBankerId(assigned.id)
    notify('Appointment booked')
    setStep('done')
  }

  function downloadIcs() {
    if (!reason || !slot) return
    const start = toIcsDate(days[dayIdx], slot)
    const where = mode === 'in-branch' ? branch.address : mode === 'video' ? 'TD Video (link in app)' : 'Phone call'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TD Bank//Appointments//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@td.com`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      'DURATION:PT45M',
      `SUMMARY:TD Bank — ${reason.label}`,
      `LOCATION:${where}`,
      `DESCRIPTION:Bring: ${reason.checklist.join(', ')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'td-appointment.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      className="absolute inset-0 z-40 flex flex-col bg-background animate-in slide-in-from-bottom-8 fade-in"
    >
      <header className="flex items-center gap-1 px-2 pt-2">
        {step !== 'reason' && step !== 'done' ? (
          <button
            type="button"
            onClick={() => setStep(steps[stepIdx - 1])}
            aria-label="Back"
            className="flex size-11 items-center justify-center rounded-full"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
        ) : (
          <span className="size-11" />
        )}
        <div className="flex-1 text-center">
          <h2 id="booking-title" className="font-semibold">
            {step === 'done' ? 'You’re booked' : 'Book an appointment'}
          </h2>
          <p className="text-xs text-muted-foreground">{branch.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-full"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      {step !== 'done' && (
        <div className="flex gap-1.5 px-4 py-3" aria-hidden>
          {steps.map((s, i) => (
            <span key={s} className={cn('h-1 flex-1 rounded-full', i <= stepIdx ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>
      )}

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        {step === 'reason' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 text-xl font-semibold">What can we help with?</legend>
            {appointmentReasons.map((r) => (
              <label
                key={r.id}
                className={cn(
                  'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card p-4 transition-colors',
                  reasonId === r.id && 'border-primary ring-2 ring-primary/30',
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.id}
                  checked={reasonId === r.id}
                  onChange={() => setReasonId(r.id)}
                  className="sr-only"
                />
                <span className="flex-1">
                  <span className="block font-medium">{r.label}</span>
                  <span className="block text-sm text-muted-foreground">{r.detail}</span>
                </span>
                {reasonId === r.id && <Check className="size-5 text-primary" aria-hidden />}
              </label>
            ))}
          </fieldset>
        )}

        {step === 'mode' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 text-xl font-semibold">How would you like to meet?</legend>
            {modes.map(({ id, label, detail, icon: Icon }) => (
              <label
                key={id}
                className={cn(
                  'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card p-4',
                  mode === id && 'border-primary ring-2 ring-primary/30',
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={mode === id}
                  onChange={() => {
                    setMode(id)
                    setBankerId('any')
                  }}
                  className="sr-only"
                />
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-lime">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-sm text-muted-foreground">{detail}</span>
                </span>
                {mode === id && <Check className="size-5 text-primary" aria-hidden />}
              </label>
            ))}
            <p className="mt-2 text-sm text-muted-foreground">
              Video and phone appointments open up bankers from every branch, often with same-day availability.
            </p>
          </fieldset>
        )}

        {step === 'banker' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 text-xl font-semibold">Choose your banker</legend>
            <label
              className={cn(
                'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border bg-card p-4',
                bankerId === 'any' && 'border-primary ring-2 ring-primary/30',
              )}
            >
              <input
                type="radio"
                name="banker"
                checked={bankerId === 'any'}
                onChange={() => setBankerId('any')}
                className="sr-only"
              />
              <span className="flex-1 font-medium">First available specialist</span>
              {bankerId === 'any' && <Check className="size-5 text-primary" aria-hidden />}
            </label>
            {bankerPool.map((b) => {
              const match = reason && b.specialties.includes(reason.specialty)
              return (
                <label
                  key={b.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4',
                    bankerId === b.id && 'border-primary ring-2 ring-primary/30',
                  )}
                >
                  <input
                    type="radio"
                    name="banker"
                    checked={bankerId === b.id}
                    onChange={() => setBankerId(b.id)}
                    className="sr-only"
                  />
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-lime">
                    {b.initials}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{b.name}</span>
                      {match && (
                        <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold text-lime-foreground">
                          Best match
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-muted-foreground">{b.role}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-current text-amber-500" aria-hidden />
                      {b.rating} ({b.reviews}) · Speaks {b.languages.join(', ')}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {b.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {s}
                        </span>
                      ))}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        )}

        {step === 'time' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Pick a time</h3>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="listbox" aria-label="Day">
              {days.map((d, i) => (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="option"
                  aria-selected={dayIdx === i}
                  onClick={() => {
                    setDayIdx(i)
                    setSlot(null)
                  }}
                  className={cn(
                    'flex min-h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border bg-card',
                    dayIdx === i && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  <span className="text-xs">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-lg font-semibold">{d.getDate()}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2" role="listbox" aria-label="Time">
              {timeSlots.map((t) => {
                const taken = isTaken(dayIdx, t)
                return (
                  <button
                    key={t}
                    type="button"
                    role="option"
                    aria-selected={slot === t}
                    disabled={taken}
                    onClick={() => setSlot(t)}
                    className={cn(
                      'h-11 rounded-xl border bg-card text-sm font-medium disabled:line-through disabled:opacity-40',
                      slot === t && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            {mode === 'in-branch' && (
              <p className="rounded-2xl bg-accent p-3 text-sm text-accent-foreground">
                Tip: {branch.name} is quietest {branch.quietest}. Pick then and you’ll be seen right away.
              </p>
            )}
          </div>
        )}

        {step === 'review' && reason && slot && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Review & prep</h3>
            <dl className="divide-y rounded-2xl bg-card text-sm">
              {[
                ['Topic', reason.label],
                ['Where', mode === 'in-branch' ? `${branch.name} · ${branch.address}` : modes.find((m) => m.id === mode)?.label],
                ['With', banker?.name ?? 'First available specialist'],
                [
                  'When',
                  `${days[dayIdx].toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · ${slot}`,
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-3">
                  <dt className="w-14 shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <fieldset className="rounded-2xl bg-card p-4">
              <legend className="sr-only">Document checklist</legend>
              <p className="flex items-center gap-2 font-semibold">
                <FileCheck2 className="size-4 text-primary" aria-hidden /> What to bring
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tick off what you have, or upload securely now so your banker is ready.
              </p>
              <ul className="mt-2 flex flex-col">
                {reason.checklist.map((item) => (
                  <li key={item}>
                    <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={checked.includes(item)}
                        onChange={(e) =>
                          setChecked((c) => (e.target.checked ? [...c, item] : c.filter((x) => x !== item)))
                        }
                        className="size-5 accent-[var(--primary)]"
                      />
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="apt-notes" className="text-sm font-medium">
                Anything we should know?
              </label>
              <textarea
                id="apt-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. First-time buyer, looking around $650k in Queens"
                className="rounded-2xl border bg-card p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                Tedi shares a summary of your goals with your banker so you never start from scratch.
              </p>
            </div>
          </div>
        )}

        {step === 'done' && reason && slot && (
          <div className="flex flex-col items-center gap-4 pt-8 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-lime text-lime-foreground">
              <CalendarCheck className="size-9" aria-hidden />
            </span>
            <div>
              <p className="text-2xl font-semibold">{reason.label}</p>
              <p className="mt-1 text-muted-foreground">
                {days[dayIdx].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {slot}
              </p>
              <p className="text-muted-foreground">
                with {banker?.name ?? 'your specialist'} ·{' '}
                {mode === 'in-branch' ? branch.name : modes.find((m) => m.id === mode)?.label}
              </p>
            </div>
            <ul className="w-full rounded-2xl bg-card p-4 text-left text-sm">
              <li className="flex gap-2 py-1">
                <Check className="size-4 shrink-0 text-primary" aria-hidden /> Reminder the day before and 1 hour prior
              </li>
              <li className="flex gap-2 py-1">
                <Check className="size-4 shrink-0 text-primary" aria-hidden /> Running late? Reschedule in one tap — your spot is held 15 min
              </li>
              <li className="flex gap-2 py-1">
                <Check className="size-4 shrink-0 text-primary" aria-hidden /> {checked.length}/{reason.checklist.length} documents ready
              </li>
            </ul>
            <button
              type="button"
              onClick={downloadIcs}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-shield font-semibold bg-card text-shield-700"
            >
              <Download className="size-4" aria-hidden /> Add to calendar
            </button>
          </div>
        )}
      </div>

      <div className="border-t bg-background p-4">
        {step === 'done' ? (
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-xl bg-shield font-semibold text-shield-foreground"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className="h-12 w-full rounded-xl bg-shield font-semibold text-shield-foreground disabled:opacity-40"
          >
            {step === 'review' ? 'Confirm appointment' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  )
}
