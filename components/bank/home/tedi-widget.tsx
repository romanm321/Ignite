'use client'

import { useState, type FormEvent } from 'react'
import { ChevronUp, MessageCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TediMark } from '../tedi-icon'
import { useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { useNextBestAction } from './next-best-action'

/** Tedi on Home: one insight worth acting on, and a box to ask anything. Replaces the old next-best-action tile. */
export function TediWidget({ masked, showInsight }: { masked: boolean; showInsight: boolean }) {
  const { dispatch, customerType } = useBank()
  const { profile } = useTrust()
  const { main, skip } = useNextBestAction(masked)
  const [open, setOpen] = useState(true)
  const [question, setQuestion] = useState('')
  const insight = showInsight ? main : null
  const Icon = insight?.icon

  const ask = (event: FormEvent) => {
    event.preventDefault()
    const text = question.trim()
    setQuestion('')
    if (text) dispatch({ type: 'askTedi', prompt: text })
    else dispatch({ type: 'navigate', tab: 'sage' })
  }

  return (
    <section aria-labelledby="tedi-h" className="rounded-3xl bg-accent p-2 text-accent-foreground">
      <div className="flex items-center gap-2.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fbf6ee] ring-2 ring-white/70">
          <TediMark className="size-7" />
        </span>
        <h2 id="tedi-h" className="min-w-0 flex-1 text-sm font-semibold leading-snug">
          {insight
            ? `Hi ${profile.preferredName}, I’ve got an insight for you…`
            : customerType === 'new'
              ? `Hi ${profile.preferredName}, I’m Tedi. Ask me anything.`
              : `Hi ${profile.preferredName}, what can I help with?`}
        </h2>
        {insight && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Hide insight' : 'Show insight'}
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <ChevronUp className={cn('size-5 transition-transform', !open && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>

      {insight && open && (
        <div
          key={insight.id}
          className="mt-1.5 flex items-center gap-2.5 rounded-2xl bg-card p-2 pl-2.5 text-card-foreground animate-in fade-in slide-in-from-bottom-1"
        >
          {Icon && (
            <span className="flex size-7 shrink-0 items-center justify-center self-start rounded-lg bg-accent text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <p className="min-w-0 flex-1 text-sm leading-snug">{insight.title}</p>
          <div className="flex shrink-0 flex-col items-center">
            <button
              type="button"
              onClick={() => {
                insight.run()
                skip(insight.id)
              }}
              className="h-9 rounded-full bg-forest px-3 text-sm font-semibold text-forest-foreground active:opacity-90"
            >
              {insight.cta}
            </button>
            <button type="button" onClick={() => skip(insight.id)} className="h-7 px-2 text-xs font-medium text-muted-foreground">
              Not now
            </button>
          </div>
        </div>
      )}

      <form onSubmit={ask} className="mt-1.5 flex h-11 items-center gap-2 rounded-full bg-card pl-4 pr-0.5 shadow-sm">
        <MessageCircle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label="Ask Tedi anything"
          placeholder="Ask Tedi anything…"
          enterKeyHint="send"
          className="min-w-0 flex-1 bg-transparent text-base text-card-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Send to Tedi"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-forest-foreground active:opacity-90"
        >
          <Send className="size-[18px]" aria-hidden />
        </button>
      </form>
    </section>
  )
}
