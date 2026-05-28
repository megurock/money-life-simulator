<script setup lang="ts">
const params = useSimulationParams()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-piggy-bank" />
        <h3 class="font-semibold">
          預貯金
        </h3>
      </div>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
        銀行口座にある現金の合計額です
      </p>
    </template>

    <UFormField>
      <template #label>
        <span class="flex items-center gap-1">
          現在の預貯金額
          <InputHelpTip text="銀行口座にある預貯金の合計額です。投資口座の残高は含めず、別途「投資口座」セクションで設定してください。" />
        </span>
      </template>
      <InputMoneyInput
        v-model="params.savings"
        placeholder="5,000,000"
      />
    </UFormField>
  </UCard>
</template>
