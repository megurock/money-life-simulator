<script setup lang="ts">
import type { YearlyResult } from '~/types/simulation'

const params = useSimulationParams()

const props = defineProps<{
  yearlyResults: YearlyResult[]
}>()

const intervalOptions = [
  { label: '1年', value: 1 },
  { label: '5年', value: 5 },
  { label: '10年', value: 10 }
]

const selectedInterval = ref(5)

function formatMoney(value: number): string {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}億`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString()}万`
  }
  return value.toLocaleString()
}

// 特別収入/支出がある年齢のセット
const specialAges = computed(() => {
  const ages = new Set<number>()
  for (const e of params.specialExpenses) ages.add(e.age)
  for (const i of params.specialIncomes) ages.add(i.age)
  return ages
})

// 特別収入/支出の内容を取得
function getSpecialEvents(age: number): string[] {
  const events: string[] = []
  for (const e of params.specialExpenses) {
    if (e.age === age) events.push(`支出: ${e.description || '特別支出'}`)
  }
  for (const i of params.specialIncomes) {
    if (i.age === age) events.push(`収入: ${i.description || '特別収入'}`)
  }
  return events
}

const filteredResults = computed(() => {
  const interval = selectedInterval.value
  return props.yearlyResults.filter((r, index) => {
    if (index === 0) return true
    if (index === props.yearlyResults.length - 1) return true
    if (r.age % interval === 0) return true
    if (r.isDepleted && !props.yearlyResults[index - 1]?.isDepleted) return true
    if (specialAges.value.has(r.age)) return true
    return false
  })
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-table" />
          <h3 class="font-semibold">年齢別収支テーブル</h3>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">表示間隔:</span>
          <div class="flex gap-1">
            <UButton
              v-for="opt in intervalOptions"
              :key="opt.value"
              :label="opt.label"
              size="xs"
              :variant="selectedInterval === opt.value ? 'solid' : 'ghost'"
              :color="selectedInterval === opt.value ? 'primary' : 'neutral'"
              @click="selectedInterval = opt.value"
            />
          </div>
        </div>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 px-3 text-left">年齢</th>
            <th class="py-2 px-3 text-right">収入</th>
            <th class="py-2 px-3 text-right">年間収入</th>
            <th class="py-2 px-3 text-right">年間支出</th>
            <th class="py-2 px-3 text-right">ローン</th>
            <th class="py-2 px-3 text-right">税金</th>
            <th class="py-2 px-3 text-right">総資産</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="result in filteredResults"
            :key="result.age"
            class="border-b border-gray-100 dark:border-gray-800"
            :class="{
              'bg-red-50 dark:bg-red-900/20': result.isDepleted,
              'bg-amber-50 dark:bg-amber-900/10': !result.isDepleted && specialAges.has(result.age)
            }"
          >
            <td class="py-2 px-3 font-medium">
              <div>
                {{ result.age }}歳
                <span class="text-xs text-gray-400">({{ result.year }})</span>
              </div>
              <div v-if="specialAges.has(result.age)" class="flex flex-wrap gap-1 mt-0.5">
                <UBadge
                  v-for="(event, i) in getSpecialEvents(result.age)"
                  :key="i"
                  :color="event.startsWith('収入') ? 'success' : 'warning'"
                  variant="subtle"
                  size="xs"
                >
                  {{ event }}
                </UBadge>
              </div>
            </td>
            <td class="py-2 px-3 text-right" :class="result.salaryIncome > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'">
              {{ result.salaryIncome > 0 ? formatMoney(result.salaryIncome) + '円' : '-' }}
            </td>
            <td class="py-2 px-3 text-right text-green-600 dark:text-green-400">
              {{ formatMoney(result.totalIncome) }}円
            </td>
            <td class="py-2 px-3 text-right text-orange-600 dark:text-orange-400">
              {{ formatMoney(result.livingExpense + result.specialExpense) }}円
            </td>
            <td class="py-2 px-3 text-right" :class="result.loanPayment > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-300 dark:text-gray-600'">
              {{ result.loanPayment > 0 ? formatMoney(result.loanPayment) + '円' : '-' }}
            </td>
            <td class="py-2 px-3 text-right text-gray-500">
              {{ formatMoney(result.taxAmount) }}円
            </td>
            <td class="py-2 px-3 text-right font-semibold" :class="result.isDepleted ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'">
              {{ formatMoney(result.totalBalance) }}円
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
