import { reactive, provide, inject, type InjectionKey } from 'vue'
import type { SimulationParams } from '~/types/simulation'
import { DEFAULT_PARAMS } from '~/utils/constants'

const PARAMS_KEY: InjectionKey<SimulationParams> = Symbol('simulation-params')

const EXPENSE_BRACKETS = [
  { maxAge: 44, monthlyExpense: 280_000 },
  { maxAge: 54, monthlyExpense: 300_000 },
  { maxAge: 64, monthlyExpense: 260_000 },
  { maxAge: 74, monthlyExpense: 220_000 },
  { maxAge: 84, monthlyExpense: 180_000 },
  { maxAge: Infinity, monthlyExpense: 150_000 }
]

function generateDefaultExpenses(currentAge: number, lifeExpectancy: number) {
  const expenses: { fromAge: number, toAge: number, monthlyExpense: number }[] = []
  let age = currentAge
  for (const bracket of EXPENSE_BRACKETS) {
    if (age > lifeExpectancy) break
    if (age > bracket.maxAge) continue
    expenses.push({
      fromAge: age,
      toAge: Math.min(bracket.maxAge, lifeExpectancy),
      monthlyExpense: bracket.monthlyExpense
    })
    age = bracket.maxAge + 1
  }
  return expenses
}

function createDefaultParams(): SimulationParams {
  return {
    basicInfo: { ...DEFAULT_PARAMS.basicInfo },
    savings: DEFAULT_PARAMS.currentSavings,
    accounts: [
      {
        id: crypto.randomUUID(),
        type: 'nisa',
        label: 'NISA',
        currentBalance: 0,
        currentContribution: 0,
        existingReturnRate: 5.0,
        funds: [
          {
            id: crypto.randomUUID(),
            name: '全世界株式インデックス',
            monthlyContribution: 100_000,
            expectedReturn: 5.0,
            nisaSlot: 'tsumitate'
          }
        ]
      }
    ],
    pension: { ...DEFAULT_PARAMS.pension },
    incomesByAge: [
      { fromAge: 30, toAge: 34, annualIncome: 4_000_000 },
      { fromAge: 35, toAge: 44, annualIncome: 5_000_000 },
      { fromAge: 45, toAge: 54, annualIncome: 6_500_000 },
      { fromAge: 55, toAge: 64, annualIncome: 5_500_000 }
    ],
    expensesByAge: generateDefaultExpenses(DEFAULT_PARAMS.basicInfo.currentAge, DEFAULT_PARAMS.basicInfo.lifeExpectancy),
    specialExpenses: [],
    specialIncomes: [],
    loans: [],
    inflationRate: DEFAULT_PARAMS.inflationRate
  }
}

export function provideSimulationParams(): SimulationParams {
  const params = reactive(createDefaultParams()) as SimulationParams
  provide(PARAMS_KEY, params)
  return params
}

export function useSimulationParams(): SimulationParams {
  const params = inject(PARAMS_KEY)
  if (!params) {
    throw new Error('SimulationParams not provided. Call provideSimulationParams() in a parent component.')
  }
  return params
}

export { createDefaultParams }
