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
          <!-- 基本情報 -->
          <InputBasicInfoForm />

          <!-- 資産 -->
          <div class="space-y-4 border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-wallet" />
              資産
            </h2>
            <InputCurrentAssetsForm />
            <InputSavingsForm />
            <InputAccountSection />
          </div>

          <!-- 収入 -->
          <div class="space-y-4 border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-trending-up" />
              収入
            </h2>
            <InputIncomeSection />
            <InputPensionForm />
          </div>

          <!-- 支出 -->
          <div class="space-y-4 border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-trending-down" />
              支出
            </h2>
            <InputLoanSection />
            <InputExpenseSection />
            <InputInflationForm />
          </div>
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
