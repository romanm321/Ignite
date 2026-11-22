import type { Account } from '@/lib/bank-data'
import { groupKeyOf, isCd } from './account-groups'

export type AccountTheme = {
  /** Surface and text colour of the account card. */
  card: string
  /** Button and chip fill that reads on top of the card. */
  pill: string
  /** Secondary text on the card. */
  muted: string
  /** Empty part of a progress bar on the card. */
  track: string
}

/** One look per product, shared by the Home card stack and each account's landing page. */
export const accountThemes: Record<string, AccountTheme> = {
  checking: { card: 'bg-forest text-forest-foreground', pill: 'bg-white/15 active:bg-white/25', muted: 'text-forest-foreground/70', track: 'bg-white/15' },
  savings: { card: 'bg-primary text-primary-foreground', pill: 'bg-black/20 active:bg-black/30', muted: 'text-primary-foreground/80', track: 'bg-black/20' },
  cd: { card: 'bg-gold text-brand-foreground', pill: 'bg-black/10 active:bg-black/20', muted: 'text-brand-foreground/70', track: 'bg-black/10' },
  credit: { card: 'bg-surface text-foreground', pill: 'bg-foreground/10 active:bg-foreground/15', muted: 'text-muted-foreground', track: 'bg-foreground/10' },
  investing: { card: 'bg-brand text-brand-foreground', pill: 'bg-black/15 active:bg-black/25', muted: 'text-brand-foreground/75', track: 'bg-black/15' },
  family: { card: 'bg-[#c6f26b] text-[#0b2617]', pill: 'bg-black/10 active:bg-black/20', muted: 'text-[#0b2617]/70', track: 'bg-black/10' },
}

export function themeForKey(key: string): AccountTheme {
  return accountThemes[key] ?? accountThemes.checking
}

export function themeForAccount(account: Account): AccountTheme {
  return themeForKey(isCd(account) ? 'cd' : groupKeyOf(account))
}
