<script setup lang="ts">
const params = useSimulationParams()

function addEntry() {
  const lastEntry = params.incomesByAge[params.incomesByAge.length - 1]
  const fromAge = lastEntry ? lastEntry.toAge + 1 : params.basicInfo.currentAge
  params.incomesByAge.push({
    fromAge,
    toAge: Math.min(fromAge + 10, params.basicInfo.lifeExpectancy),
    annualIncome: lastEntry?.annualIncome ?? 5_000_000
  })
}

function removeEntry(index: number) {
  params.incomesByAge.splice(index, 1)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(entry, index) in params.incomesByAge"
      :key="index"
      class="grid grid-cols-12 gap-2 items-end"
    >
      <div class="col-span-3">
        <UFormField :label="index === 0 ? '開始年齢' : ''" size="sm">
          <UInput
            v-model.number="entry.fromAge"
            type="number"
            size="sm"
            :min="params.basicInfo.currentAge"
          >
            <template #trailing>
              <span class="text-xs text-gray-500">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-3">
        <UFormField :label="index === 0 ? '終了年齢' : ''" size="sm">
          <UInput
            v-model.number="entry.toAge"
            type="number"
            size="sm"
            :max="params.basicInfo.lifeExpectancy"
          >
            <template #trailing>
              <span class="text-xs text-gray-500">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-4">
        <UFormField :label="index === 0 ? '年間手取り' : ''" size="sm">
          <InputMoneyInput
            v-model="entry.annualIncome"
            size="sm"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          @click="removeEntry(index)"
        />
      </div>
    </div>

    <UButton
      icon="i-lucide-plus"
      label="期間追加"
      variant="soft"
      size="sm"
      @click="addEntry"
    />
  </div>
</template>
