<script setup lang="ts">
import { provideSimulationParams } from '~/composables/useSimulationParams'
import { useSimulation } from '~/composables/useSimulation'
import { useAutoSave, restoreParams, clearLocalStorage } from '~/composables/useLocalStorage'

const params = provideSimulationParams()

onMounted(() => {
  restoreParams(params)
})

useAutoSave(() => params)

const { yearlyResults, depletionAge, finalBalance } = useSimulation(params)

function resetAll() {
  clearLocalStorage()
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-calculator" class="text-2xl text-primary" />
          <h1 class="text-xl font-bold">老後資金シミュレーター</h1>
        </div>
        <UButton
          icon="i-lucide-rotate-ccw"
          label="リセット"
          variant="ghost"
          color="error"
          size="sm"
          @click="resetAll"
        />
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <LayoutDashboardLayout>
        <template #input>
          <InputBasicInfoForm />
          <InputCurrentAssetsForm />
          <InputIncomeSection />
          <InputAccountSection />
          <InputPensionForm />
          <InputLoanSection />
          <InputExpenseSection />
          <InputInflationForm />
        </template>

        <template #result>
          <ResultDepletionAlert
            :depletion-age="depletionAge"
            :life-expectancy="params.basicInfo.lifeExpectancy"
            :final-balance="finalBalance"
          />
          <ResultSimulationChart :yearly-results="yearlyResults" />
          <ResultSimulationTable :yearly-results="yearlyResults" />
        </template>
      </LayoutDashboardLayout>
    </main>
  </div>
</template>
