import { watch, type WatchSource } from 'vue'
import type { SimulationParams } from '~/types/simulation'
import { createDefaultParams } from './useSimulationParams'

const STORAGE_KEY = 'retirement-simulator-params'
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

/**
 * params を watch して、変更時に debounce 付きで localStorage に保存する
 */
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

/**
 * localStorage から復元し、params にマージする
 */
export function restoreParams(params: SimulationParams): void {
  const saved = loadFromLocalStorage()
  if (!saved) return

  const defaults = createDefaultParams()

  // 保存データをマージ（不足フィールドはデフォルトで補完）
  params.basicInfo = { ...defaults.basicInfo, ...saved.basicInfo }
  params.currentAssets = { ...defaults.currentAssets, ...saved.currentAssets }
  params.accounts = saved.accounts?.length ? saved.accounts : defaults.accounts
  params.pension = { ...defaults.pension, ...saved.pension }
  params.incomesByAge = saved.incomesByAge?.length ? saved.incomesByAge : defaults.incomesByAge
  params.expensesByAge = saved.expensesByAge?.length ? saved.expensesByAge : defaults.expensesByAge
  params.specialExpenses = saved.specialExpenses ?? defaults.specialExpenses
  params.specialIncomes = saved.specialIncomes ?? defaults.specialIncomes
  params.loans = saved.loans ?? defaults.loans
  params.inflationRate = saved.inflationRate ?? defaults.inflationRate
}
