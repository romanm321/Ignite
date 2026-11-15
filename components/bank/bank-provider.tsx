'use client'

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import {
  initialAccounts,
  initialTransactions,
  initialVaults,
  initialWallets,
  type Account,
  type Appointment,
  type QueueTicket,
  type Transaction,
  type Vault,
  type VirtualCard,
  type Wallet,
} from '@/lib/bank-data'
import { products, type ProductId } from '@/lib/offers'
import { INITIAL_REWARDS_BALANCE } from '@/lib/rewards'
import { withRates, withdrawBlock } from '@/lib/vaults'
import {
  defaultA11y,
  defaultAlertPrefs,
  initialContacts,
  initialPayees,
  type A11yPrefs,
  type AlertPrefs,
  type Celebration,
  type Contact,
  type P2PNetwork,
  type Payee,
  type ScheduledBill,
} from '@/lib/everyday-data'

import { securityBySymbol, type CdChoice, type Holding, type InvestProfile } from '@/lib/invest-data'

export type OnboardStep = 'intro' | 'identity' | 'confirm' | 'setup' | 'terms' | 'decision' | 'done'

export type Tab = 'home' | 'accounts' | 'cards' | 'pay' | 'grow' | 'more' | 'branches' | 'sage'
export type Overlay =
  | null
  | 'global'
  | 'profile'
  | 'security'
  | 'subscriptions'
  | 'billpay'
  | 'send'
  | 'deposit'
  | 'alerts'
  | 'credit'
  | 'accessibility'
  | 'explore'
  | 'invest'
  | 'family'

export type InvestState = {
  opened: boolean
  profile: InvestProfile | null
  holdings: Record<string, Holding>
  cdChoice: CdChoice | null
  sweep: boolean
  lens: 'auto' | 'starter' | 'wealth'
}

export type ProductMeta = Record<string, string | number | boolean>

export type SubStatus = 'active' | 'paused' | 'canceled'
export type SubState = { status: SubStatus; card: string }
export type DisputeCase = { caseId: string; reason: string; amount: number; merchant: string }

export type CardControls = {
  online: boolean
  contactless: boolean
  atm: boolean
  international: boolean
}

type State = {
  tab: Tab
  overlay: Overlay
  focusBranchId: string | null
  returnTab: Tab
  accounts: Account[]
  transactions: Transaction[]
  wallets: Wallet[]
  vaults: Vault[]
  cardFrozen: boolean
  streetSafe: boolean
  monthlyLimit: number
  controls: CardControls
  virtualCards: VirtualCard[]
  appointments: Appointment[]
  queue: QueueTicket | null
  toast: string | null
  onboarding: ProductId | null
  owned: ProductId[]
  drafts: Partial<Record<ProductId, OnboardStep>>
  productMeta: Partial<Record<ProductId, ProductMeta>>
  dismissedOffers: string[]
  personalizedOffers: boolean
  identityVerified: boolean
  txnId: string | null
  disputes: Record<string, DisputeCase>
  subs: Record<string, SubState>
  accountId: string | null
  rewardsId: string | null
  rewardsBalance: number
  vaultId: string | null
  roundUpsVaultId: string | null
  accountSettings: Record<string, AccountSettings>
  celebration: Celebration | null
  invest: InvestState
  payees: Payee[]
  scheduledBills: ScheduledBill[]
  contacts: Contact[]
  a11y: A11yPrefs
  alertPrefs: AlertPrefs
  creditMonitoring: boolean
}

export type AccountSettings = {
  autopay: boolean
  paperless: boolean
  lowBalanceAlert: boolean
  largePurchaseAlert: boolean
  overdraftProtection: boolean
  roundUps: boolean
}

export const defaultAccountSettings: AccountSettings = {
  autopay: false,
  paperless: true,
  lowBalanceAlert: true,
  largePurchaseAlert: true,
  overdraftProtection: true,
  roundUps: false,
}

export const accountOf = (t: Transaction) => t.accountId ?? 'chk'

type Action =
  | { type: 'navigate'; tab: Tab; focusBranchId?: string | null }
  | { type: 'overlay'; overlay: Overlay }
  | { type: 'freeze'; frozen: boolean }
  | { type: 'streetSafe'; on: boolean }
  | { type: 'limit'; amount: number }
  | { type: 'control'; key: keyof CardControls; value: boolean }
  | { type: 'virtualCard'; card: VirtualCard }
  | { type: 'vaultTransfer'; vaultId: string; amount: number }
  | { type: 'openVault'; id: string | null }
  | { type: 'vaultWithdraw'; vaultId: string; amount: number }
  | { type: 'vaultPatch'; vaultId: string; patch: Partial<Pick<Vault, 'name' | 'goal' | 'access' | 'lockedUntil' | 'salarySort'>> }
  | { type: 'vaultBillPayee'; vaultId: string; payeeId: string; on: boolean }
  | { type: 'vaultPayBill'; vaultId: string; payeeId: string }
  | { type: 'vaultCreate'; vault: Vault }
  | { type: 'vaultClose'; vaultId: string }
  | { type: 'roundUpsVault'; vaultId: string | null }
  | { type: 'convert'; from: string; to: string; amount: number }
  | { type: 'book'; appointment: Appointment }
  | { type: 'cancelAppointment'; id: string }
  | { type: 'queue'; ticket: QueueTicket | null }
  | { type: 'toast'; message: string | null }
  | { type: 'payment'; payee: string; amount: number }
  | { type: 'startOnboarding'; productId: ProductId }
  | { type: 'exitOnboarding'; draftStep?: OnboardStep }
  | { type: 'verifyIdentity' }
  | { type: 'openProduct'; productId: ProductId; funding: number; limit?: number; label?: string; meta?: ProductMeta }
  | { type: 'dismissOffer'; id: string }
  | { type: 'personalizedOffers'; on: boolean }
  | { type: 'openTxn'; id: string | null }
  | { type: 'dispute'; txnId: string; reason: string; amount: number; merchant: string; caseId: string }
  | { type: 'updateSub'; id: string; patch: Partial<SubState> }
  | { type: 'openAccount'; id: string | null }
  | { type: 'openRewards'; id: string | null }
  | { type: 'redeemRewards'; amount: number; to: 'statement' | 'checking'; cardId: string }
  | { type: 'transfer'; from: string; to: string; amount: number }
  | { type: 'renameAccount'; id: string; name: string }
  | { type: 'accountSetting'; id: string; key: keyof AccountSettings; value: boolean }
  | { type: 'celebrate'; celebration: Celebration | null }
  | { type: 'familyFund'; amount: number; memo: string }
  | { type: 'investOpen'; profile: InvestProfile }
  | { type: 'investTrade'; side: 'buy' | 'sell'; symbol: string; dollars: number; accountId: string }
  | { type: 'investPatch'; patch: Partial<Pick<InvestState, 'cdChoice' | 'sweep' | 'lens'>> }
  | { type: 'billPay'; payeeId: string; amount: number; date: string | null }
  | { type: 'cancelBill'; id: string }
  | { type: 'addPayee'; payee: Payee }
  | { type: 'payeeAutopay'; id: string; on: boolean }
  | { type: 'p2p'; network: P2PNetwork; contactId: string; amount: number; memo: string; fee?: number }
  | { type: 'addContact'; contact: Contact }
  | { type: 'deposit'; accountId: string; amount: number; checkNo: string }
  | { type: 'a11y'; patch: Partial<A11yPrefs> }
  | { type: 'alertPrefs'; patch: Partial<AlertPrefs> }
  | { type: 'creditMonitoring'; on: boolean }

export const STREET_SAFE_CAP = 200

function debitChecking(state: State, amount: number) {
  return {
    accounts: state.accounts.map((a) => (a.id === 'chk' ? { ...a, balance: a.balance - amount } : a)),
    wallets: state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance - amount } : w)),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'celebrate':
      return { ...state, celebration: action.celebration }
    case 'familyFund': {
      const amount = Math.round(action.amount * 100) / 100
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === 'chk' ? { ...a, balance: a.balance - amount } : a)),
        wallets: state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance - amount } : w)),
        transactions: [
          { id: `fam-${Date.now()}`, accountId: 'chk', merchant: `TD Family · ${action.memo}`, category: 'Transfer', amount: -amount, when: 'Just now' },
          ...state.transactions,
        ],
      }
    }
    case 'investOpen':
      return { ...state, invest: { ...state.invest, opened: true, profile: action.profile } }
    case 'investPatch':
      return { ...state, invest: { ...state.invest, ...action.patch } }
    case 'investTrade': {
      const sec = securityBySymbol[action.symbol]
      const account = state.accounts.find((a) => a.id === action.accountId)
      const dollars = Math.round(action.dollars * 100) / 100
      if (!sec || !account || dollars <= 0) return state
      const current = state.invest.holdings[sec.symbol] ?? { shares: 0, cost: 0 }
      const shares = dollars / sec.price
      const buying = action.side === 'buy'
      if (buying && dollars > account.balance) return state
      if (!buying && shares > current.shares + 1e-9) return state
      const nextShares = buying ? current.shares + shares : current.shares - shares
      const nextCost = buying ? current.cost + dollars : current.cost * (nextShares / current.shares || 0)
      const holdings = { ...state.invest.holdings }
      if (nextShares < 1e-6) delete holdings[sec.symbol]
      else holdings[sec.symbol] = { shares: nextShares, cost: nextCost }
      const delta = buying ? -dollars : dollars
      return {
        ...state,
        invest: { ...state.invest, holdings },
        accounts: state.accounts.map((a) => (a.id === account.id ? { ...a, balance: a.balance + delta } : a)),
        wallets:
          account.id === 'chk'
            ? state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance + delta } : w))
            : state.wallets,
        transactions: [
          {
            id: `iv-${Date.now()}`,
            accountId: account.id,
            merchant: `${buying ? 'Bought' : 'Sold'} ${sec.symbol} · TD Direct Investing`,
            category: 'Transfer',
            amount: delta,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
    }
    case 'billPay': {
      const payee = state.payees.find((p) => p.id === action.payeeId)
      if (!payee || action.amount <= 0) return state
      if (action.date) {
        return {
          ...state,
          payees: state.payees.map((p) => (p.id === payee.id ? { ...p, paid: true } : p)),
          scheduledBills: [
            { id: `sb-${Date.now()}`, payeeId: payee.id, amount: action.amount, date: action.date },
            ...state.scheduledBills,
          ],
        }
      }
      return {
        ...state,
        ...debitChecking(state, action.amount),
        payees: state.payees.map((p) => (p.id === payee.id ? { ...p, paid: true } : p)),
        transactions: [
          { id: `bp-${Date.now()}`, merchant: `Bill payment · ${payee.name}`, category: 'Bills', amount: -action.amount, when: 'Just now' },
          ...state.transactions,
        ],
      }
    }
    case 'cancelBill': {
      const bill = state.scheduledBills.find((b) => b.id === action.id)
      return {
        ...state,
        scheduledBills: state.scheduledBills.filter((b) => b.id !== action.id),
        payees: bill ? state.payees.map((p) => (p.id === bill.payeeId ? { ...p, paid: false } : p)) : state.payees,
      }
    }
    case 'addPayee':
      return { ...state, payees: [...state.payees, action.payee] }
    case 'payeeAutopay':
      return { ...state, payees: state.payees.map((p) => (p.id === action.id ? { ...p, autopay: action.on } : p)) }
    case 'addContact':
      return { ...state, contacts: [action.contact, ...state.contacts] }
    case 'p2p': {
      const contact = state.contacts.find((c) => c.id === action.contactId)
      if (!contact || action.amount <= 0) return state
      const stamp = Date.now()
      if (action.network === 'wire') {
        if (!contact.wire) return state
        const fee = action.fee ?? 0
        const scopeLabel = contact.wire.scope === 'international' ? 'International wire' : 'Wire'
        return {
          ...state,
          ...debitChecking(state, action.amount + fee),
          contacts: state.contacts.map((c) => (c.id === contact.id ? { ...c, known: true } : c)),
          transactions: [
            ...(fee > 0
              ? [{ id: `wf-${stamp}`, merchant: `${scopeLabel} fee`, category: 'Bills' as const, amount: -fee, when: 'Just now' }]
              : []),
            {
              id: `wr-${stamp}`,
              merchant: `${scopeLabel} to ${contact.name} · ${contact.wire.bank}`,
              category: 'Transfer',
              amount: -action.amount,
              when: 'Just now',
            },
            ...state.transactions,
          ],
        }
      }
      return {
        ...state,
        ...debitChecking(state, action.amount),
        contacts: state.contacts.map((c) => (c.id === contact.id ? { ...c, known: true } : c)),
        transactions: [
          { id: `zl-${stamp}`, merchant: `Zelle® to ${contact.name}`, category: 'Transfer', amount: -action.amount, when: 'Just now' },
          ...state.transactions,
        ],
      }
    }
    case 'deposit': {
      if (action.amount <= 0) return state
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.accountId ? { ...a, balance: a.balance + action.amount } : a)),
        wallets:
          action.accountId === 'chk'
            ? state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance + action.amount } : w))
            : state.wallets,
        transactions: [
          {
            id: `md-${Date.now()}`,
            accountId: action.accountId,
            merchant: `Mobile deposit · Check #${action.checkNo}`,
            category: 'Income',
            amount: action.amount,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
    }
    case 'a11y':
      return { ...state, a11y: { ...state.a11y, ...action.patch } }
    case 'alertPrefs':
      return { ...state, alertPrefs: { ...state.alertPrefs, ...action.patch } }
    case 'creditMonitoring':
      return { ...state, creditMonitoring: action.on }
    case 'navigate':
      return {
        ...state,
        tab: action.tab,
        returnTab: action.tab === 'sage' && state.tab !== 'sage' ? state.tab : state.returnTab,
        overlay: null,
        accountId: null,
        rewardsId: null,
        vaultId: null,
        txnId: null,
        focusBranchId: action.focusBranchId ?? null,
      }
    case 'overlay':
      return { ...state, overlay: action.overlay }
    case 'openTxn':
      return { ...state, txnId: action.id }
    case 'openAccount':
      return { ...state, accountId: action.id }
    case 'openRewards':
      return { ...state, rewardsId: action.id, accountId: action.id ?? state.accountId }
    case 'redeemRewards': {
      const amount = Math.round(Math.min(action.amount, state.rewardsBalance) * 100) / 100
      if (amount <= 0) return state
      const targetId = action.to === 'statement' ? action.cardId : 'chk'
      return {
        ...state,
        rewardsBalance: Math.round((state.rewardsBalance - amount) * 100) / 100,
        accounts: state.accounts.map((a) => (a.id === targetId ? { ...a, balance: a.balance + amount } : a)),
        wallets:
          targetId === 'chk'
            ? state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance + amount } : w))
            : state.wallets,
        transactions: [
          {
            id: `rw-${Date.now()}`,
            accountId: targetId,
            merchant: 'TD Rewards redemption',
            category: 'Transfer',
            amount,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
    }
    case 'renameAccount':
      return { ...state, accounts: state.accounts.map((a) => (a.id === action.id ? { ...a, name: action.name } : a)) }
    case 'accountSetting':
      return {
        ...state,
        accountSettings: {
          ...state.accountSettings,
          [action.id]: { ...defaultAccountSettings, ...state.accountSettings[action.id], [action.key]: action.value },
        },
      }
    case 'transfer': {
      const from = state.accounts.find((a) => a.id === action.from)
      const to = state.accounts.find((a) => a.id === action.to)
      if (!from || !to || action.amount <= 0) return state
      const stamp = Date.now()
      const toLabel = to.kind === 'credit' ? `${to.name} payment` : `To ${to.name}`
      const fromLabel = to.kind === 'credit' ? 'Payment received · thank you' : `From ${from.name}`
      const usdDelta = (from.id === 'chk' ? -action.amount : 0) + (to.id === 'chk' ? action.amount : 0)
      return {
        ...state,
        accounts: state.accounts.map((a) => {
          if (a.id === from.id) return { ...a, balance: a.balance - action.amount }
          if (a.id === to.id) return { ...a, balance: a.balance + action.amount }
          return a
        }),
        wallets: usdDelta
          ? state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance + usdDelta } : w))
          : state.wallets,
        transactions: [
          { id: `tr-in-${stamp}`, accountId: to.id, merchant: fromLabel, category: 'Transfer', amount: action.amount, when: 'Just now' },
          { id: `tr-out-${stamp}`, accountId: from.id, merchant: toLabel, category: 'Transfer', amount: -action.amount, when: 'Just now' },
          ...state.transactions,
        ],
      }
    }
    case 'dispute': {
      const original = state.transactions.find((t) => t.id === action.txnId)
      const creditTo = original ? accountOf(original) : 'chk'
      return {
        ...state,
        disputes: {
          ...state.disputes,
          [action.txnId]: { caseId: action.caseId, reason: action.reason, amount: action.amount, merchant: action.merchant },
        },
        accounts: state.accounts.map((a) => (a.id === creditTo ? { ...a, balance: a.balance + action.amount } : a)),
        wallets:
          creditTo === 'chk'
            ? state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance + action.amount } : w))
            : state.wallets,
        transactions: [
          {
            id: `pc-${action.txnId}`,
            accountId: creditTo,
            merchant: `Provisional credit · ${action.merchant}`,
            category: 'Transfer',
            amount: action.amount,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
    }
    case 'updateSub':
      return {
        ...state,
        subs: { ...state.subs, [action.id]: { ...state.subs[action.id], ...action.patch } },
      }
    case 'freeze':
      return { ...state, cardFrozen: action.frozen }
    case 'streetSafe':
      return { ...state, streetSafe: action.on }
    case 'limit':
      return { ...state, monthlyLimit: action.amount }
    case 'control':
      return { ...state, controls: { ...state.controls, [action.key]: action.value } }
    case 'virtualCard':
      return { ...state, virtualCards: [action.card, ...state.virtualCards] }
    case 'vaultTransfer': {
      const vault = state.vaults.find((v) => v.id === action.vaultId)
      if (!vault) return state
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === 'chk' ? { ...a, balance: a.balance - action.amount } : a)),
        wallets: state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance - action.amount } : w)),
        vaults: withRates(state.vaults.map((v) => (v.id === action.vaultId ? { ...v, balance: v.balance + action.amount } : v))),
        transactions: [
          {
            id: `vt-${Date.now()}`,
            merchant: `To ${vault.name} vault`,
            category: 'Transfer',
            amount: -action.amount,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
    }
    case 'openVault':
      return { ...state, vaultId: action.id }
    case 'vaultWithdraw': {
      const vault = state.vaults.find((v) => v.id === action.vaultId)
      const amount = Math.round(Math.min(action.amount, vault?.balance ?? 0) * 100) / 100
      if (!vault || amount <= 0 || withdrawBlock(vault)) return state
      return {
        ...state,
        ...debitChecking(state, -amount),
        vaults: withRates(
          state.vaults.map((v) =>
            v.id === vault.id
              ? { ...v, balance: v.balance - amount, withdrawalsUsed: v.access === 'select' ? v.withdrawalsUsed + 1 : v.withdrawalsUsed }
              : v,
          ),
        ),
        transactions: [
          { id: `vw-${Date.now()}`, merchant: `From ${vault.name} vault`, category: 'Transfer', amount, when: 'Just now' },
          ...state.transactions,
        ],
      }
    }
    case 'vaultPatch':
      return {
        ...state,
        vaults: withRates(state.vaults.map((v) => (v.id === action.vaultId ? { ...v, ...action.patch } : v))),
      }
    case 'vaultBillPayee':
      return {
        ...state,
        vaults: state.vaults.map((v) => {
          const rest = v.billPayeeIds.filter((id) => id !== action.payeeId)
          if (v.id !== action.vaultId) return action.on ? { ...v, billPayeeIds: rest } : v
          return { ...v, billPayeeIds: action.on ? [...rest, action.payeeId] : rest }
        }),
      }
    case 'vaultPayBill': {
      const vault = state.vaults.find((v) => v.id === action.vaultId)
      const payee = state.payees.find((p) => p.id === action.payeeId)
      if (!vault || !payee || payee.paid || vault.balance < payee.amountDue) return state
      return {
        ...state,
        vaults: withRates(state.vaults.map((v) => (v.id === vault.id ? { ...v, balance: v.balance - payee.amountDue } : v))),
        payees: state.payees.map((p) => (p.id === payee.id ? { ...p, paid: true } : p)),
        transactions: [
          {
            id: `vb-${Date.now()}`,
            merchant: `Bill payment · ${payee.name} (from ${vault.name})`,
            category: 'Bills',
            amount: -payee.amountDue,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
    }
    case 'vaultCreate':
      return { ...state, vaults: withRates([...state.vaults, action.vault]), vaultId: action.vault.id }
    case 'vaultClose': {
      const vault = state.vaults.find((v) => v.id === action.vaultId)
      if (!vault || vault.lockedUntil) return state
      return {
        ...state,
        ...(vault.balance > 0 ? debitChecking(state, -vault.balance) : {}),
        vaults: withRates(state.vaults.filter((v) => v.id !== vault.id)),
        vaultId: null,
        roundUpsVaultId: state.roundUpsVaultId === vault.id ? null : state.roundUpsVaultId,
        transactions:
          vault.balance > 0
            ? [
                { id: `vc-${Date.now()}`, merchant: `Closed ${vault.name} vault`, category: 'Transfer', amount: vault.balance, when: 'Just now' },
                ...state.transactions,
              ]
            : state.transactions,
      }
    }
    case 'roundUpsVault':
      return { ...state, roundUpsVaultId: action.vaultId }
    case 'convert': {
      const from = state.wallets.find((w) => w.code === action.from)
      const to = state.wallets.find((w) => w.code === action.to)
      if (!from || !to) return state
      const received = (action.amount / from.perUsd) * to.perUsd
      return {
        ...state,
        accounts: state.accounts.map((a) => {
          if (a.id !== 'chk') return a
          if (from.code === 'USD') return { ...a, balance: a.balance - action.amount }
          if (to.code === 'USD') return { ...a, balance: a.balance + received }
          return a
        }),
        wallets: state.wallets.map((w) => {
          if (w.code === from.code) return { ...w, balance: w.balance - action.amount }
          if (w.code === to.code) return { ...w, balance: w.balance + received }
          return w
        }),
      }
    }
    case 'book':
      return { ...state, appointments: [action.appointment, ...state.appointments] }
    case 'cancelAppointment':
      return { ...state, appointments: state.appointments.filter((a) => a.id !== action.id) }
    case 'queue':
      return { ...state, queue: action.ticket }
    case 'toast':
      return { ...state, toast: action.message }
    case 'startOnboarding':
      return { ...state, onboarding: action.productId }
    case 'exitOnboarding': {
      if (!state.onboarding) return state
      const drafts = { ...state.drafts }
      if (action.draftStep) drafts[state.onboarding] = action.draftStep
      else delete drafts[state.onboarding]
      return { ...state, onboarding: null, drafts }
    }
    case 'verifyIdentity':
      return { ...state, identityVerified: true }
    case 'dismissOffer':
      return { ...state, dismissedOffers: [...state.dismissedOffers, action.id] }
    case 'personalizedOffers':
      return { ...state, personalizedOffers: action.on }
    case 'openProduct': {
      if (state.owned.includes(action.productId)) return state
      const p = products[action.productId]
      const drafts = { ...state.drafts }
      delete drafts[action.productId]
      const account: Account = {
        id: p.id,
        name: action.label ?? p.name,
        kind: p.accountKind,
        balance: p.accountKind === 'credit' ? 0 : action.funding,
        mask: p.mask,
        limit: action.limit,
      }
      const funded = action.funding > 0
      return {
        ...state,
        owned: [...state.owned, action.productId],
        drafts,
        productMeta: action.meta ? { ...state.productMeta, [action.productId]: action.meta } : state.productMeta,
        accounts: [
          ...state.accounts.map((a) => (a.id === 'chk' && funded ? { ...a, balance: a.balance - action.funding } : a)),
          account,
        ],
        wallets: funded
          ? state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance - action.funding } : w))
          : state.wallets,
        transactions: funded
          ? [
              {
                id: `open-in-${Date.now()}`,
                accountId: p.id,
                merchant: 'Opening deposit · from TD Everyday Checking',
                category: 'Transfer',
                amount: action.funding,
                when: 'Just now',
              },
              { id: `open-${Date.now()}`, accountId: 'chk', merchant: `To ${p.name}`, category: 'Transfer', amount: -action.funding, when: 'Just now' },
              ...state.transactions,
            ]
          : state.transactions,
      }
    }
    case 'payment':
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === 'chk' ? { ...a, balance: a.balance - action.amount } : a)),
        wallets: state.wallets.map((w) => (w.code === 'USD' ? { ...w, balance: w.balance - action.amount } : w)),
        transactions: [
          {
            id: `pay-${Date.now()}`,
            merchant: `Sent to ${action.payee}`,
            category: 'Transfer',
            amount: -action.amount,
            when: 'Just now',
          },
          ...state.transactions,
        ],
      }
  }
}

const initialState: State = {
  tab: 'home',
  overlay: null,
  focusBranchId: null,
  returnTab: 'home',
  accounts: initialAccounts,
  transactions: initialTransactions,
  wallets: initialWallets,
  vaults: withRates(initialVaults),
  vaultId: null,
  roundUpsVaultId: 'japan',
  cardFrozen: false,
  streetSafe: false,
  monthlyLimit: 2500,
  controls: { online: true, contactless: true, atm: true, international: true },
  virtualCards: [{ id: 'vc1', label: 'Subscriptions', last4: '3391', singleUse: false, used: false }],
  appointments: [],
  queue: null,
  toast: null,
  onboarding: null,
  owned: [],
  drafts: {},
  productMeta: {},
  dismissedOffers: [],
  personalizedOffers: true,
  identityVerified: false,
  txnId: null,
  accountId: null,
  rewardsId: null,
  rewardsBalance: INITIAL_REWARDS_BALANCE,
  accountSettings: {
    cc: { ...defaultAccountSettings, autopay: true },
    sav: { ...defaultAccountSettings, lowBalanceAlert: false, roundUps: true },
  },
  disputes: {},
  celebration: null,
  invest: { opened: false, profile: null, holdings: {}, cdChoice: null, sweep: false, lens: 'auto' },
  payees: initialPayees,
  scheduledBills: [],
  contacts: initialContacts,
  a11y: defaultA11y,
  alertPrefs: defaultAlertPrefs,
  creditMonitoring: false,
  subs: {
    netflix: { status: 'active', card: 'TD Double Up Visa ••4821' },
    spotify: { status: 'active', card: 'TD Double Up Visa ••4821' },
    peloton: { status: 'active', card: 'TD Double Up Visa ••4821' },
    nyt: { status: 'active', card: 'TD Debit ••7710' },
  },
}

type BankContextValue = State & {
  dispatch: React.Dispatch<Action>
  notify: (message: string) => void
  snapshot: () => Record<string, unknown>
}

const BankContext = createContext<BankContextValue | null>(null)

export function BankProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const notify = useCallback((message: string) => {
    dispatch({ type: 'toast', message })
    window.setTimeout(() => dispatch({ type: 'toast', message: null }), 2600)
  }, [])

  const snapshot = useCallback(
    () => ({
      accounts: state.accounts.map(({ name, kind, balance, limit }) => ({ name, kind, balance, limit })),
      recentTransactions: state.transactions.slice(0, 8),
      wallets: state.wallets.map(({ code, balance, perUsd }) => ({ code, balance, perUsd })),
      vaults: state.vaults.map(({ id, name, balance, goal, apy }) => ({ id, name, balance, goal, apy })),
      cardFrozen: state.cardFrozen,
      streetSafe: state.streetSafe,
      streetSafeTransferCapUsd: STREET_SAFE_CAP,
      monthlyCardLimit: state.monthlyLimit,
      appointments: state.appointments,
    }),
    [state],
  )

  const value = useMemo(() => ({ ...state, dispatch, notify, snapshot }), [state, notify, snapshot])

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>
}

export function useBank() {
  const ctx = useContext(BankContext)
  if (!ctx) throw new Error('useBank must be used within BankProvider')
  return ctx
}
