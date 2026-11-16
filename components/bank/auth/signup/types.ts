export type Fields = {
  name: string
  email: string
  dob: string
  ssn: string
  address: string
  income: string
  job: string
  employer: string
}

export const DEFAULT_PHONE = '201-555-0148'

export const blankFields: Fields = {
  name: 'Ava Morgan',
  email: 'ava.morgan@example.com',
  dob: '',
  ssn: '',
  address: '',
  income: '',
  job: '',
  employer: '',
}

/** What Prove returns after carrier verification. Job, income and employer are never pre-filled. */
export const proveProfile = { dob: '04/18/1994', ssn: '582-41-6120', address: '18 Mercer Street, New York, NY 10013' }

export const jobCategories = ['Professional / office', 'Healthcare', 'Education', 'Trades & construction', 'Service & retail', 'Self-employed', 'Student', 'Retired']

export const ACCOUNT = { number: '5420 3718 1936', mask: '1936', routing: '021000021' }
export const CARD = { last4: '4417', number: '4417 8820 3391 4417', exp: '11/30', cvv: '284' }

export type FundingMethod = 'direct-deposit' | 'ach' | 'wallet'
/** `posted` is what lands in checking immediately; the rest of the summary is shown on the final review. */
export type FundingResult = { method: FundingMethod; label: string; posted: number; summary: string }
export type SetupResult = { card: boolean; wallet: boolean; zelle: boolean }

export const digitsOnly = (v: string) => v.replace(/\D/g, '')

export function formatDob(v: string) {
  const d = digitsOnly(v).slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('/')
}

export function formatSsn(v: string) {
  const d = digitsOnly(v).slice(0, 9)
  return [d.slice(0, 3), d.slice(3, 5), d.slice(5, 9)].filter(Boolean).join('-')
}

export function formatPhone(v: string) {
  const d = digitsOnly(v).slice(0, 10)
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join('-')
}

export function formatIncome(v: string) {
  const d = digitsOnly(v).slice(0, 9)
  return d ? `$${Number(d).toLocaleString('en-US')}` : ''
}
