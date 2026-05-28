<script setup lang="ts">
import type { WithdrawalStrategy } from '~/types/simulation'

const params = useSimulationParams()

const strategies: { value: WithdrawalStrategy, label: string, description: string }[] = [
  {
    value: 'savings-first',
    label: '預貯金優先',
    description: '預貯金を先に使い、投資資産を長く運用する'
  },
  {
    value: 'nisa-first',
    label: 'NISA 優先',
    description: 'NISA から先に取り崩し、預貯金を温存する'
  },
  {
    value: 'tax-efficient',
    label: '税金最小化',
    description: '課税口座から先に崩し、非課税の NISA を最後まで残す'
  }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-down-circle" />
        <h3 class="font-semibold">
          取り崩し戦略
        </h3>
        <InputHelpTip text="支出が収入を上回った場合に、どの資産から先に取り崩すかを選択します。\niDeCo は60歳未満では取り崩しできません。" />
      </div>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
        支出が収入を上回ったとき、どの資産から取り崩すかを選択します
      </p>
    </template>

    <div class="space-y-2">
      <label
        v-for="s in strategies"
        :key="s.value"
        class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
        :class="params.withdrawalStrategy === s.value
          ? 'bg-primary-50 dark:bg-primary-950 ring-1 ring-primary-200 dark:ring-primary-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
      >
        <input
          v-model="params.withdrawalStrategy"
          type="radio"
          :value="s.value"
          class="mt-0.5 accent-primary"
        >
        <div>
          <div class="text-sm font-medium">{{ s.label }}</div>
          <div class="text-xs text-gray-600">{{ s.description }}</div>
        </div>
      </label>
    </div>
  </UCard>
</template>
