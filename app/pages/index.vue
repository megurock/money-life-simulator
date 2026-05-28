<script setup lang="ts">
import { provideSimulationParams, createDefaultParams } from '~/composables/useSimulationParams'
import { useSimulation } from '~/composables/useSimulation'
import { useAutoSave, restoreParams, clearLocalStorage, loadFromLocalStorage } from '~/composables/useLocalStorage'

const params = provideSimulationParams()

const showWizard = ref(false)

onMounted(() => {
  const isFirstVisit = loadFromLocalStorage() === null
  restoreParams(params)
  if (isFirstVisit) {
    showWizard.value = true
  }
})

useAutoSave(() => params)

const { yearlyResults, depletionAge, finalBalance } = useSimulation(params)

const isParamsEmpty = computed(() => {
  const hasIncome = params.incomesByAge.length > 0
  const hasSavings = params.savings > 0
  const hasAccountBalance = params.accounts.some(a => a.currentBalance > 0)
  const hasContribution = params.accounts.some(a => a.currentContribution > 0)
  const hasPension = params.pension.annualAmount > 0
  return !hasIncome && !hasSavings && !hasAccountBalance && !hasContribution && !hasPension
})

const resultTabs = [
  { label: '資産推移グラフ', value: 'chart', icon: 'i-lucide-chart-line', slot: 'chart' },
  { label: '年別収支テーブル', value: 'table', icon: 'i-lucide-table', slot: 'table' },
  { label: '取り崩し戦略', value: 'strategy', icon: 'i-lucide-arrow-down-circle', slot: 'strategy' }
]

const inputTabs = [
  { label: '資産', value: 'assets', icon: 'i-lucide-wallet', slot: 'assets' },
  { label: '収入', value: 'income', icon: 'i-lucide-trending-up', slot: 'income' },
  { label: '支出', value: 'expenses', icon: 'i-lucide-trending-down', slot: 'expenses' },
  { label: '思い出づくり', value: 'memories', icon: 'i-lucide-sparkles', slot: 'memories' }
]

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
  a.download = `money-life-simulator-${new Date().toISOString().slice(0, 10)}.json`
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
      <div class="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-calculator"
              class="text-2xl text-primary"
            />
            <h1 class="text-xl font-bold">
              お金と暮らしのシミュレーター
            </h1>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-9">
            お金の使いどきを見つけて、豊かな人生を描こう
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- 基本情報 -->
          <UPopover>
            <button class="flex items-center gap-2.5 px-4 py-2 rounded-lg text-base font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <UIcon
                name="i-lucide-user"
                class="text-lg text-primary"
              />
              <span class="text-gray-800 dark:text-gray-200">
                <span class="font-semibold">{{ params.basicInfo.currentAge }}</span>歳
                <span class="text-gray-400 dark:text-gray-500 mx-1">→</span>
                <span class="font-semibold">{{ params.basicInfo.retirementAge }}</span>歳引退
                <span class="text-gray-400 dark:text-gray-500 mx-1">→</span>
                <span class="font-semibold">{{ params.basicInfo.lifeExpectancy }}</span>歳
              </span>
              <UIcon
                name="i-lucide-pencil"
                class="text-sm text-gray-400 dark:text-gray-500"
              />
            </button>
            <template #content>
              <InputBasicInfoForm />
            </template>
          </UPopover>

          <USeparator
            orientation="vertical"
            class="h-6"
          />

          <!-- アクション -->
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
            >
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      <!-- ステータス -->
      <ResultDepletionAlert
        :depletion-age="isParamsEmpty ? null : depletionAge"
        :life-expectancy="params.basicInfo.lifeExpectancy"
        :final-balance="isParamsEmpty ? 0 : finalBalance"
        :is-empty="isParamsEmpty"
      />

      <!-- 結果タブ: グラフ / テーブル / 取り崩し戦略 -->
      <UTabs
        :items="resultTabs"
        default-value="chart"
        :unmount-on-hide="false"
      >
        <template #chart>
          <div class="pt-4">
            <ResultSimulationChart :yearly-results="yearlyResults" />
          </div>
        </template>
        <template #table>
          <div class="pt-4">
            <ResultSimulationTable :yearly-results="yearlyResults" />
          </div>
        </template>
        <template #strategy>
          <div class="pt-4">
            <InputWithdrawalStrategyForm />
          </div>
        </template>
      </UTabs>

      <!-- 入力タブ: 資産 / 収入 / 支出 / 思い出づくり -->
      <UTabs
        :items="inputTabs"
        default-value="assets"
        :unmount-on-hide="false"
      >
        <template #assets>
          <div class="space-y-4 pt-4">
            <InputCurrentAssetsForm />
            <InputSavingsForm />
            <InputAccountSection />
          </div>
        </template>
        <template #income>
          <div class="space-y-4 pt-4">
            <InputIncomeSection />
            <InputPensionForm />
          </div>
        </template>
        <template #expenses>
          <div class="space-y-4 pt-4">
            <InputLoanSection />
            <InputExpenseSection />
            <InputInflationForm />
          </div>
        </template>
        <template #memories>
          <div class="space-y-4 pt-4">
            <InputTimeBucketSection />
          </div>
        </template>
      </UTabs>
    </main>

    <!-- 初回ウィザード -->
    <UModal v-model:open="showWizard">
      <template #content>
        <div class="p-8 space-y-8">
          <div class="text-center space-y-3">
            <UIcon
              name="i-lucide-calculator"
              class="text-6xl text-primary"
            />
            <h2 class="text-3xl font-bold">
              ようこそ！
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              まず基本情報を教えてください。
            </p>
          </div>

          <InputBasicInfoForm variant="wizard" />

          <UButton
            label="シミュレーションを始める"
            block
            size="xl"
            @click="showWizard = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
