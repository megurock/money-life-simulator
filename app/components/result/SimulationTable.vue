<script setup lang="ts">
import type { YearlyResult } from '~/types/simulation'

const props = defineProps<{
  yearlyResults: YearlyResult[]
}>()

function formatMoney(value: number): string {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}億`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString()}万`
  }
  return value.toLocaleString()
}

// 5歳刻みでフィルタ + 引退年齢 + 枯渇年齢を含む
const filteredResults = computed(() => {
  return props.yearlyResults.filter((r, index) => {
    if (index === 0) return true
    if (r.age % 5 === 0) return true
    if (r.isDepleted && !props.yearlyResults[index - 1]?.isDepleted) return true
    return index === props.yearlyResults.length - 1
  })
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-table" />
        <h3 class="font-semibold">年齢別収支テーブル</h3>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 px-3 text-left">年齢</th>
            <th class="py-2 px-3 text-right">給与</th>
            <th class="py-2 px-3 text-right">年間収入</th>
            <th class="py-2 px-3 text-right">年間支出</th>
            <th class="py-2 px-3 text-right">税金</th>
            <th class="py-2 px-3 text-right">総資産</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="result in filteredResults"
            :key="result.age"
            class="border-b border-gray-100 dark:border-gray-800"
            :class="{ 'bg-red-50 dark:bg-red-900/20': result.isDepleted }"
          >
            <td class="py-2 px-3 font-medium">
              {{ result.age }}歳
              <span class="text-xs text-gray-400">({{ result.year }})</span>
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
