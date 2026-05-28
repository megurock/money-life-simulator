<script setup lang="ts">
import type { YearlyResult } from '~/types/simulation'
import { useChartOptions } from '~/composables/useChartOptions'

const props = defineProps<{
  yearlyResults: YearlyResult[]
}>()

const yearlyResultsRef = computed(() => props.yearlyResults)
const { chartOptions } = useChartOptions(yearlyResultsRef)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-chart-line" />
        <h3 class="font-semibold">
          資産推移グラフ
        </h3>
      </div>
    </template>

    <div class="h-[400px]">
      <VChart
        :option="chartOptions"
        autoresize
        class="w-full h-full"
      />
    </div>
  </UCard>
</template>
