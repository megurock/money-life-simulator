<script setup lang="ts">
const params = useSimulationParams()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-trending-up" />
        <h3 class="font-semibold">インフレ率</h3>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">物価上昇による生活費への影響を考慮します</p>
    </template>

    <UFormField>
      <template #label>
        <span class="flex items-center gap-1">
          年間インフレ率
          <InputHelpTip text="物価が毎年何%上昇するかの想定です。生活費に対してインフレ補正がかかります。日本の長期平均は約1〜2%程度です。" />
        </span>
      </template>
      <UInput
        v-model.number="params.inflationRate"
        type="number"
        :min="0"
        :max="10"
        :step="0.1"
      >
        <template #trailing>
          <span class="text-sm text-gray-500">%</span>
        </template>
      </UInput>
      <template #hint>
        生活費が毎年この率で上昇すると想定します
      </template>
    </UFormField>
  </UCard>
</template>
