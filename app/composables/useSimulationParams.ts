import { reactive, provide, inject, type InjectionKey } from 'vue'
import type { SimulationParams } from '~/types/simulation'
import { DEFAULT_PARAMS } from '~/utils/constants'

const PARAMS_KEY: InjectionKey<SimulationParams> = Symbol('simulation-params')

function createDefaultParams(): SimulationParams {
  return {
    basicInfo: { ...DEFAULT_PARAMS.basicInfo },
    savings: 0,
    accounts: [
      {
        id: crypto.randomUUID(),
        type: 'nisa',
        label: 'NISA',
        currentBalance: 0,
        currentContribution: 0,
        existingReturnRate: 5.0,
        nisaTsumitateBalance: 0,
        nisaTsumitateContribution: 0,
        nisaTsumitateReturnRate: 5.0,
        nisaGrowthBalance: 0,
        nisaGrowthContribution: 0,
        nisaGrowthReturnRate: 5.0,
        legacyTsumitateBalance: 0,
        legacyTsumitateContribution: 0,
        legacyTsumitateReturnRate: 5.0,
        funds: []
      },
      {
        id: crypto.randomUUID(),
        type: 'ideco',
        label: 'iDeCo',
        currentBalance: 0,
        currentContribution: 0,
        existingReturnRate: 5.0,
        funds: []
      }
    ],
    pension: { ...DEFAULT_PARAMS.pension },
    incomesByAge: [],
    expensesByAge: [],
    specialExpenses: [],
    specialIncomes: [],
    loans: [],
    inflationRate: DEFAULT_PARAMS.inflationRate,
    withdrawalStrategy: 'savings-first'
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
