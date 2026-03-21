import { watch, type WatchSource } from 'vue'
import type { SimulationParams } from '~/types/simulation'
import { createDefaultParams } from './useSimulationParams'

const STORAGE_KEY = 'money-life-simulator-params'
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function saveToLocalStorage(params: SimulationParams): void {
  try {
    const json = JSON.stringify(params)
    localStorage.setItem(STORAGE_KEY, json)
  } catch {
    console.warn('localStorage への保存に失敗しました')
  }
}

export function loadFromLocalStorage(): SimulationParams | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return null
    return JSON.parse(json) as SimulationParams
  } catch {
    console.warn('localStorage からの読み込みに失敗しました')
    return null
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function useAutoSave(params: WatchSource<SimulationParams>): void {
  watch(
    params,
    (newParams) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        saveToLocalStorage(newParams)
      }, 500)
    },
    { deep: true }
  )
}

export function restoreParams(params: SimulationParams): void {
  const saved = loadFromLocalStorage()
  if (!saved) return

  const defaults = createDefaultParams()

  params.basicInfo = { ...defaults.basicInfo, ...saved.basicInfo }
  params.savings = saved.savings ?? defaults.savings
  params.accounts = saved.accounts?.length
    ? saved.accounts.map(a => ({
        ...a,
        currentBalance: a.currentBalance ?? 0,
        currentContribution: a.currentContribution ?? 0,
        existingReturnRate: a.existingReturnRate ?? 5.0
      }))
    : defaults.accounts
  const savedPension = saved.pension as any
  params.pension = {
    ...defaults.pension,
    ...saved.pension,
    annualAmount: savedPension?.annualAmount ?? (savedPension?.monthlyAmount ? savedPension.monthlyAmount * 12 : defaults.pension.annualAmount)
  }
  params.incomesByAge = saved.incomesByAge?.length ? saved.incomesByAge : defaults.incomesByAge
  params.expensesByAge = saved.expensesByAge?.length ? saved.expensesByAge : defaults.expensesByAge
  params.specialExpenses = saved.specialExpenses ?? defaults.specialExpenses
  params.specialIncomes = saved.specialIncomes ?? defaults.specialIncomes
  params.loans = (saved.loans ?? defaults.loans).map((l: any) => ({
    id: l.id,
    name: l.name ?? '',
    annualPayment: l.annualPayment ?? (l.monthlyPayment ? l.monthlyPayment * 12 : 0),
    endAge: l.endAge ?? defaults.loans[0]?.endAge ?? 65
  }))
  params.inflationRate = saved.inflationRate ?? defaults.inflationRate
  params.withdrawalStrategy = saved.withdrawalStrategy ?? defaults.withdrawalStrategy
  params.timeBuckets = saved.timeBuckets ?? defaults.timeBuckets
}
