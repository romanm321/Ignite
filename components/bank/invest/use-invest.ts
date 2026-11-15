'use client'

import { CHECKING_CUSHION, WEALTH_THRESHOLD, securityBySymbol } from '@/lib/invest-data'
import { useBank } from '../bank-provider'

export function useInvestPicture() {
  const bank = useBank()
  const { accounts, vaults, invest, owned } = bank

  const positions = Object.entries(invest.holdings).map(([symbol, h]) => {
    const sec = securityBySymbol[symbol]
    const value = h.shares * sec.price
    const gain = value - h.cost
    return { symbol, sec, ...h, value, gain: Math.abs(gain) < 0.005 ? 0 : gain }
  })
  const investedValue = positions.reduce((s, p) => s + p.value, 0)
  const investedCost = positions.reduce((s, p) => s + p.cost, 0)
  const bondValue = positions.filter((p) => p.sec.risk <= 2).reduce((s, p) => s + p.value, 0)
  const stockValue = investedValue - bondValue

  const balance = (id: string) => accounts.find((a) => a.id === id)?.balance ?? 0
  const checking = balance('chk')
  const savings = balance('sav')
  const cd = balance('cd')
  const vaultTotal = vaults.reduce((s, v) => s + v.balance, 0)
  const cash = checking + savings + cd + vaultTotal

  const emergency = vaults.find((v) => v.id === 'emergency')
  const emergencyGap = emergency ? Math.max(0, emergency.goal - emergency.balance) : 0
  const spareChecking = Math.max(0, checking - CHECKING_CUSHION)
  const readyToInvest = Math.max(0, spareChecking + savings - emergencyGap)

  const autoWealth = owned.includes('complete') || cash + investedValue >= WEALTH_THRESHOLD
  const lens = invest.lens === 'auto' ? (autoWealth ? 'wealth' : 'starter') : invest.lens

  return {
    ...bank,
    positions,
    investedValue,
    investedCost,
    bondValue,
    stockValue,
    checking,
    savings,
    cd,
    vaultTotal,
    cash,
    emergency,
    emergencyGap,
    spareChecking,
    readyToInvest,
    autoWealth,
    lens: lens as 'starter' | 'wealth',
  }
}
