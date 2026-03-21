<script setup lang="ts">
import { provideSimulationParams, createDefaultParams } from '~/composables/useSimulationParams'
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

function exportJson() {
  const data = JSON.stringify(params, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `retirement-simulator-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)

function importJson() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      const defaults = createDefaultParams()
      Object.assign(params, { ...defaults, ...data })
    } catch {
      alert('ファイルの読み込みに失敗しました。正しい JSON ファイルを選択してください。')
    }
  }
  reader.readAsText(file)

  // 同じファイルを再選択できるようリセット
  ;(event.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-calculator" class="text-2xl text-primary" />
          <h1 class="text-xl font-bold">老後資金シミュレーター</h1>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-download"
            label="書き出し"
            variant="soft"
            size="sm"
            @click="exportJson"
          />
          <UButton
            icon="i-lucide-upload"
            label="読み込み"
            variant="soft"
            size="sm"
            @click="importJson"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            label="リセット"
            variant="soft"
            color="error"
            size="sm"
            @click="resetAll"
          />
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="onFileSelected"
          />
        </div>
      </div>
    </header>

    <main class="max-w-screen-2xl mx-auto px-4 py-6">
      <LayoutDashboardLayout>
        <template #input>
          <!-- 基本情報 -->
          <InputBasicInfoForm />

          <!-- 資産 -->
          <div class="space-y-4 mt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-wallet" />
              資産
            </h2>
            <InputCurrentAssetsForm />
            <InputSavingsForm />
            <InputAccountSection />
          </div>

          <!-- 収入 -->
          <div class="space-y-4 mt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-trending-up" />
              収入
            </h2>
            <InputIncomeSection />
            <InputPensionForm />
          </div>

          <!-- 支出 -->
          <div class="space-y-4 mt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-trending-down" />
              支出
            </h2>
            <InputLoanSection />
            <InputExpenseSection />
            <InputInflationForm />
          </div>

          <!-- 思い出づくりプラン -->
          <div class="space-y-4 mt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-sparkles" />
              思い出づくりプラン
            </h2>
            <InputTimeBucketSection />
          </div>

          <!-- シミュレーション設定 -->
          <div class="space-y-4 mt-8">
            <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-lucide-settings" />
              シミュレーション設定
            </h2>
            <InputWithdrawalStrategyForm />
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
