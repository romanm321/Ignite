'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronLeft, Lock, RotateCcw } from 'lucide-react'
import { TediIcon } from '../tedi-icon'
import { cn } from '@/lib/utils'
import { customer, formatMoney } from '@/lib/bank-data'
import { respond, type ConfirmStatus, type Effect, type Widget } from '@/lib/sage-engine'
import { STREET_SAFE_CAP, useBank } from '../bank-provider'
import { useTrust } from '../trust-provider'
import { BranchResultsCard, HumanHandoffCard, SpendingCard, VaultConfirmCard } from '../sage/tool-cards'
import {
  ActionDoneCard,
  BalancesWidget,
  BookWidget,
  CapabilitiesWidget,
  ControlsWidget,
  CreditWidget,
  DisputeWidget,
  ScamWidget,
  SecurityWidget,
  SendWidget,
  VirtualCardWidget,
  type WidgetUpdate,
} from '../sage/chat-widgets'
import { OfferWidget } from '../sage/offer-widget'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  widgets: Widget[]
  chips: string[]
}

const suggestions = [
  'I lost my wallet, freeze my card',
  'How much did I spend on dining?',
  'Move $200 to my Tokyo trip',
  'Send $40 to Alex',
  'I got a weird text about my account',
  'Book a mortgage appointment',
]

let idSeq = 0
const nextId = () => `m${++idSeq}`

function Typewriter({ text, onDone }: { text: string; onDone: () => void }) {
  const [count, setCount] = useState(0)
  const words = text.split(' ')
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (count >= words.length) {
      doneRef.current()
      return
    }
    const timer = window.setTimeout(() => setCount((c) => c + 1), 28)
    return () => window.clearTimeout(timer)
  }, [count, words.length])

  return <>{words.slice(0, count).join(' ')}</>
}

export function SageScreen() {
  const bank = useBank()
  const trust = useTrust()
  const ctxRef = useRef({ bank, trust })
  ctxRef.current = { bank, trust }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [typingId, setTypingId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const busy = thinking || typingId !== null

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking, typingId])

  function runEffects(effects: Effect[]) {
    const { bank: b, trust: tr } = ctxRef.current
    for (const e of effects) {
      if (e.type === 'freeze') b.dispatch({ type: 'freeze', frozen: e.frozen })
      else if (e.type === 'streetSafe') b.dispatch({ type: 'streetSafe', on: e.on })
      else if (e.type === 'passkey') tr.dispatch({ type: 'passkey', on: true })
      else if (e.type === 'virtualCard')
        b.dispatch({
          type: 'virtualCard',
          card: { id: `vc-${Date.now()}`, label: 'Single-use', last4: e.last4, singleUse: true, used: false },
        })
    }
  }

  function addAssistant(text: string, widgets: Widget[] = [], chips: string[] = []) {
    const id = nextId()
    setMessages((m) => [...m, { id, role: 'assistant', text, widgets, chips }])
    setTypingId(id)
  }

  function ask(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { id: nextId(), role: 'user', text, widgets: [], chips: [] }])
    setThinking(true)
    const delay = 550 + Math.min(700, text.length * 12)
    window.setTimeout(() => {
      const { bank: b, trust: tr } = ctxRef.current
      const reply = respond(text, {
        firstName: customer.firstName,
        cardFrozen: b.cardFrozen,
        streetSafe: b.streetSafe,
        passkey: tr.passkey,
        score: tr.score,
        vaults: b.vaults,
        transactions: b.transactions,
      })
      runEffects(reply.effects)
      setThinking(false)
      addAssistant(reply.text, reply.widgets, reply.chips)
    }, delay)
  }

  // A question handed off from another screen (e.g. Help) is asked once, as if the customer typed it.
  const handoff = bank.sagePrompt
  const handledHandoff = useRef<number | null>(null)
  useEffect(() => {
    if (!handoff || busy || handledHandoff.current === handoff.id) return
    handledHandoff.current = handoff.id
    bank.dispatch({ type: 'clearSagePrompt' })
    ask(handoff.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff, busy])

  function updateWidget(msgId: string, index: number, patch: WidgetUpdate) {
    setMessages((list) =>
      list.map((m) =>
        m.id === msgId ? { ...m, widgets: m.widgets.map((w, i) => (i === index ? ({ ...w, ...patch } as Widget) : w)) } : m,
      ),
    )
  }

  function confirmVault(msgId: string, index: number, vaultId: string, amount: number) {
    const { accounts, vaults, streetSafe, dispatch, notify } = ctxRef.current.bank
    const checking = accounts.find((a) => a.id === 'chk')!
    const vault = vaults.find((v) => v.id === vaultId)!
    if (streetSafe && amount > STREET_SAFE_CAP)
      return updateWidget(msgId, index, { status: 'blocked', result: `Blocked by Street Safe ($${STREET_SAFE_CAP} cap).` })
    if (amount > checking.balance) return updateWidget(msgId, index, { status: 'blocked', result: 'Not enough in checking.' })
    dispatch({ type: 'vaultTransfer', vaultId, amount })
    notify(`${formatMoney(amount)} moved to ${vault.name}`)
    const newBalance = vault.balance + amount
    updateWidget(msgId, index, { status: 'confirmed', result: `Done. ${vault.name} is now at ${formatMoney(newBalance)}.` })
    if (newBalance >= vault.goal) addAssistant(`You just hit your ${vault.name} goal. Congratulations, ${customer.firstName}!`)
  }

  function renderWidget(m: ChatMessage, w: Widget, i: number) {
    const resolve = (u: WidgetUpdate) => updateWidget(m.id, i, u)
    const decline = (result: string) => resolve({ status: 'declined', result })
    const toolState = (s: ConfirmStatus) => (s === 'pending' ? 'input-available' : 'output-available')
    const toolOutput = (s: ConfirmStatus, result?: string) =>
      s === 'pending' ? undefined : { status: s as 'confirmed' | 'declined' | 'blocked', message: result ?? '' }

    switch (w.kind) {
      case 'capabilities':
        return <CapabilitiesWidget ask={ask} />
      case 'action':
        return <ActionDoneCard action={w.action} text={w.text} />
      case 'balances':
        return <BalancesWidget />
      case 'spending':
        return <SpendingCard />
      case 'credit':
        return <CreditWidget />
      case 'controls':
        return <ControlsWidget />
      case 'virtualCard':
        return <VirtualCardWidget last4={w.last4} />
      case 'security':
        return <SecurityWidget />
      case 'scam':
        return <ScamWidget ask={ask} />
      case 'dispute':
        return <DisputeWidget status={w.status} result={w.result} onResolve={resolve} />
      case 'send':
        return <SendWidget payee={w.payee} amount={w.amount} status={w.status} result={w.result} onResolve={resolve} />
      case 'book':
        return <BookWidget reasonId={w.reasonId} status={w.status} result={w.result} onResolve={resolve} />
      case 'branches':
        return <BranchResultsCard ids={w.ids} />
      case 'handoff':
        return <HumanHandoffCard topic={w.topic} />
      case 'offer':
        return <OfferWidget productId={w.productId} />
      case 'vault':
        return (
          <VaultConfirmCard
            input={{ vaultId: w.vaultId, amount: w.amount }}
            state={toolState(w.status)}
            output={toolOutput(w.status, w.result)}
            onConfirm={() => confirmVault(m.id, i, w.vaultId, w.amount)}
            onDecline={() => decline('Cancelled — nothing moved.')}
          />
        )
    }
  }

  const last = messages[messages.length - 1]

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="flex items-center gap-3 border-b bg-background/90 py-3 pl-1 pr-4 backdrop-blur">
        <button
          type="button"
          onClick={() => bank.dispatch({ type: 'navigate', tab: bank.returnTab })}
          aria-label="Close Tedi"
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-forest text-lime">
          <TediIcon className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h1 className="font-semibold leading-tight">Tedi</h1>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden /> Acts on your accounts · you approve money moves
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (busy) return
              setMessages([])
            }}
            aria-label="New conversation"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="size-5" aria-hidden />
          </button>
        )}
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-5 pt-2">
            <div>
              <p className="text-2xl font-semibold text-balance">Hi {customer.firstName}, what can I take care of?</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Ask in your own words. I can freeze cards, move and send money, check for scams, dispute charges, and book
                a banker.
              </p>
            </div>
            <CapabilitiesWidget ask={ask} />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try asking</p>
              <ul className="flex flex-col gap-2">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => ask(s)}
                      className="min-h-11 w-full rounded-2xl border bg-card px-4 py-3 text-left text-sm font-medium"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {messages.map((m) => {
              const typing = m.id === typingId
              return (
                <li key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                  {m.text && (
                    <p
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed',
                        m.role === 'user' ? 'rounded-br-lg bg-primary text-primary-foreground' : 'rounded-bl-lg bg-card',
                      )}
                    >
                      {typing ? <Typewriter text={m.text} onDone={() => setTypingId(null)} /> : m.text}
                    </p>
                  )}
                  {!typing &&
                    m.widgets.map((w, i) => (
                      <div
                        key={`${m.id}-${i}`}
                        className="w-[92%] animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        {renderWidget(m, w, i)}
                      </div>
                    ))}
                  {!typing && m === last && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => ask(c)}
                          disabled={busy}
                          className="min-h-11 rounded-xl border border-primary/30 bg-shield-50 px-4 text-sm font-medium text-shield-700 disabled:opacity-50"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
            {thinking && (
              <li className="flex items-center gap-1 rounded-3xl rounded-bl-lg bg-card px-4 py-3 self-start" aria-label="Tedi is typing">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </li>
            )}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="flex items-end gap-2 border-t bg-background px-3 py-3"
      >
        <label htmlFor="sage-input" className="sr-only">
          Message Tedi
        </label>
        <textarea
          id="sage-input"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              ask(input)
            }
          }}
          placeholder="Ask Tedi anything…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border bg-card px-4 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim() || busy}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  )
}
