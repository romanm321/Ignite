'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Download, MessageSquarePlus, MoreHorizontal, RotateCcw } from 'lucide-react'
import { TediColorMark, TediIcon } from '../tedi-icon'
import { BottomSheet } from '../overlay'
import { cn } from '@/lib/utils'
import { customer, formatMoney } from '@/lib/bank-data'
import { respond, type ConfirmStatus, type Effect, type Widget } from '@/lib/sage-engine'
import { STREET_SAFE_CAP, useBank, type Tab } from '../bank-provider'
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

const defaultSuggestions = ['What’s my account balance?', 'I need help with a transaction.', 'Why was my debit card declined?']

/** The three most useful questions for the part of the app the customer came from. */
const suggestionsByTab: Partial<Record<Tab, string[]>> = {
  home: defaultSuggestions,
  grow: ['Move $200 to my Tokyo trip', 'How much did I spend on dining?', 'How can I earn more interest?'],
  pay: ['Send $40 to Alex', 'Pay my Con Edison bill', 'Split dinner with a friend'],
  rewards: ['How much cash back do I have?', 'Am I pre-approved for a better card?', 'Where did I spend the most?'],
  cards: ['How much cash back do I have?', 'Am I pre-approved for a better card?', 'Where did I spend the most?'],
  products: ['Am I pre-approved for a credit card?', 'What is the best CD rate?', 'Help me start investing'],
  more: ['Talk to a real person', 'Book a mortgage appointment', 'I got a weird text about my account'],
  branches: ['Find a Spanish-speaking mortgage banker', 'Book a mortgage appointment', 'Talk to a real person'],
}

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
  const [menuOpen, setMenuOpen] = useState(false)
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
      return updateWidget(msgId, index, { status: 'blocked', result: `Street Safe is on, so transfers are capped at $${STREET_SAFE_CAP}. Turn it off to move more.` })
    if (amount > checking.balance) return updateWidget(msgId, index, { status: 'blocked', result: 'There isn’t enough in checking for that yet.' })
    dispatch({ type: 'vaultTransfer', vaultId, amount })
    notify(`${formatMoney(amount)} moved to ${vault.name}`)
    const newBalance = vault.balance + amount
    updateWidget(msgId, index, { status: 'confirmed', result: `Done. ${vault.name} is now at ${formatMoney(newBalance)}.` })
    if (newBalance >= vault.goal) addAssistant(`You’ve reached your ${vault.name} goal, ${customer.firstName}. That’s a real milestone. Nicely done.`)
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
            onDecline={() => decline('No problem. Nothing moved.')}
          />
        )
    }
  }

  const last = messages[messages.length - 1]

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center px-2 pb-1 pt-[calc(var(--safe-top)+0.75rem)]">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Chat options"
          aria-haspopup="dialog"
          className="flex size-12 items-center justify-center rounded-full text-primary active:bg-muted"
        >
          <MoreHorizontal className="size-6" aria-hidden />
        </button>
        <h1 className="flex items-center justify-center gap-2 text-xl font-semibold">
          <TediIcon className="size-6" aria-hidden />
          Tedi
        </h1>
        <button
          type="button"
          onClick={() => bank.dispatch({ type: 'navigate', tab: bank.returnTab })}
          aria-label="Close Tedi"
          className="flex size-12 items-center justify-center rounded-full text-primary active:bg-muted"
        >
          <ChevronDown className="size-8" strokeWidth={2.25} aria-hidden />
        </button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-6 pt-4">
              <div className="flex flex-col items-center text-center">
                <TediColorMark className="h-24 w-auto" />
                <h2 className="mt-8 font-heading text-4xl font-bold leading-tight">Hi {customer.firstName}</h2>
                <p className="mt-3 text-lg font-semibold">I’m Tedi, your AI Assistant.</p>
                <p className="mt-2 max-w-sm text-pretty leading-relaxed">
                  I’m not a real person, but I can help with TD products, services, and everyday banking questions.
                </p>
              </div>
              <ul className="flex w-full flex-col gap-3" aria-label="Try asking">
                {(suggestionsByTab[bank.returnTab] ?? defaultSuggestions).map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => ask(q)}
                      className="flex min-h-14 w-full items-center gap-3 rounded-full bg-card px-4 py-3 text-left text-base font-semibold shadow-card active:bg-muted"
                    >
                      <MessageSquarePlus className="size-6 shrink-0 text-primary" aria-hidden />
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="px-2 pb-2 text-center text-sm leading-relaxed text-muted-foreground">
              Your chat will be monitored and recorded by TD and our service providers to improve customer service and other business
              purposes.{' '}
              <button type="button" onClick={() => bank.notify('The TD privacy notice opens here')} className="underline underline-offset-2">
                Learn more
              </button>
            </p>
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

      <div className="px-3 pb-3 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => bank.notify(messages.length ? 'Chat saved to your documents' : 'Nothing to save yet. Ask Tedi something first.')}
            aria-label="Save this chat"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-primary active:bg-muted"
          >
            <Download className="size-5" aria-hidden />
          </button>
          <label htmlFor="sage-input" className="sr-only">
            Message Tedi
          </label>
          <div className="flex min-h-14 flex-1 items-center gap-2 rounded-[28px] bg-secondary py-1.5 pl-5 pr-2 focus-within:ring-2 focus-within:ring-ring">
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
              placeholder="How can I help you?"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-lg outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || busy}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors disabled:bg-muted-foreground/25 disabled:text-muted-foreground"
            >
              <ArrowUp className="size-6" aria-hidden />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI-generated content may be incorrect.{' '}
          <button type="button" onClick={() => bank.notify('How Tedi uses AI opens here')} className="underline underline-offset-2">
            Learn more
          </button>
        </p>
      </div>

      {menuOpen && (
        <BottomSheet title="Chat options" onClose={() => setMenuOpen(false)}>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            <li>
              <button
                type="button"
                disabled={messages.length === 0 || busy}
                onClick={() => {
                  setMessages([])
                  setMenuOpen(false)
                }}
                className="flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium disabled:opacity-40"
              >
                <RotateCcw className="size-5" aria-hidden /> Start a new conversation
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  bank.notify(messages.length ? 'Chat saved to your documents' : 'Nothing to save yet')
                  setMenuOpen(false)
                }}
                className="flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium"
              >
                <Download className="size-5" aria-hidden /> Save this chat
              </button>
            </li>
          </ul>
        </BottomSheet>
      )}
    </div>
  )
}
