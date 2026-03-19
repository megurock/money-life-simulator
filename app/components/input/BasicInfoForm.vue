<script setup lang="ts">
const params = useSimulationParams()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-user" />
        <h3 class="font-semibold">基本情報</h3>
      </div>
    </template>

    <div class="grid grid-cols-3 gap-4">
      <UFormField label="現在の年齢">
        <UInput
          v-model.number="params.basicInfo.currentAge"
          type="number"
          :min="18"
          :max="80"
        />
      </UFormField>

      <UFormField label="引退年齢">
        <UInput
          v-model.number="params.basicInfo.retirementAge"
          type="number"
          :min="params.basicInfo.currentAge + 1"
          :max="80"
        />
      </UFormField>

      <UFormField label="想定寿命">
        <UInput
          v-model.number="params.basicInfo.lifeExpectancy"
          type="number"
          :min="params.basicInfo.retirementAge"
          :max="120"
        />
      </UFormField>
    </div>
  </UCard>
</template>
