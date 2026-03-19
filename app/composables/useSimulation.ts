import { computed } from 'vue'
import type { SimulationParams, SimulationResult } from '~/types/simulation'
import { runSimulation } from '~/utils/calculation'

export function useSimulation(params: SimulationParams) {
  const result = computed<SimulationResult>(() => {
    return runSimulation(params)
  })

  const yearlyResults = computed(() => result.value.yearlyResults)
  const depletionAge = computed(() => result.value.depletionAge)
  const isDepleted = computed(() => result.value.depletionAge !== null)

  const finalBalance = computed(() => {
    const results = result.value.yearlyResults
    return results.length > 0 ? results[results.length - 1]!.totalBalance : 0
  })

  return {
    result,
    yearlyResults,
    depletionAge,
    isDepleted,
    finalBalance
  }
}
