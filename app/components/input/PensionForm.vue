<script setup lang="ts">
import { calcPensionAdjustmentRate } from '~/utils/tax'

const params = useSimulationParams()

const adjustmentRate = computed(() => {
  return params.pension.adjustmentRate ?? calcPensionAdjustmentRate(params.pension.startAge)
})

const adjustmentPercent = computed(() => {
  const rate = adjustmentRate.value
  const diff = (rate - 1) * 100
  return diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`
})

const adjustedAnnual = computed(() => {
  return Math.round(params.pension.annualAmount * adjustmentRate.value)
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-shield-check" />
        <h3 class="font-semibold">年金</h3>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">公的年金の受給額と開始年齢を設定します</p>
    </template>

    <div class="space-y-4">
      <UFormField>
        <template #label>
          <span class="flex items-center gap-1">
            受給開始年齢
            <InputHelpTip text="65歳が基準です。60〜64歳で繰上げ受給すると1月あたり0.4%減額、66〜75歳で繰下げ受給すると1月あたり0.7%増額されます。" />
          </span>
        </template>
        <UInput
          v-model.number="params.pension.startAge"
          type="number"
          :min="60"
          :max="75"
        />
        <template #hint>
          <span :class="adjustmentRate >= 1 ? 'text-green-500' : 'text-red-500'">
            調整率: {{ adjustmentPercent }}
          </span>
        </template>
      </UFormField>

      <UFormField>
        <template #label>
          <span class="flex items-center gap-1">
            年間受給額（65歳基準）
            <InputHelpTip text="ねんきん定期便やねんきんネットで確認できる、65歳から受け取れる見込みの年額です。繰上げ/繰下げの調整は自動計算されます。" />
          </span>
        </template>
        <InputMoneyInput v-model="params.pension.annualAmount" />
        <template #hint>
          調整後: 年額 {{ adjustedAnnual.toLocaleString() }}円（月額 {{ Math.round(adjustedAnnual / 12).toLocaleString() }}円）
        </template>
      </UFormField>
    </div>
  </UCard>
</template>
