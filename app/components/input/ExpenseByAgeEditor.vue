<script setup lang="ts">
const params = useSimulationParams()

function recalcToAges() {
  const entries = params.expensesByAge
  for (let i = 0; i < entries.length; i++) {
    if (i < entries.length - 1) {
      entries[i].toAge = entries[i + 1].fromAge - 1
    } else {
      entries[i].toAge = params.basicInfo.lifeExpectancy
    }
  }
}

function addEntry() {
  const lastEntry = params.expensesByAge[params.expensesByAge.length - 1]
  const fromAge = lastEntry ? lastEntry.toAge + 1 : params.basicInfo.currentAge
  params.expensesByAge.push({
    fromAge,
    toAge: params.basicInfo.lifeExpectancy,
    monthlyExpense: lastEntry?.monthlyExpense ?? 200_000
  })
  recalcToAges()
}

function removeEntry(index: number) {
  params.expensesByAge.splice(index, 1)
  recalcToAges()
}

function onFromAgeChange() {
  recalcToAges()
}

watch(() => params.basicInfo.lifeExpectancy, () => {
  recalcToAges()
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(entry, index) in params.expensesByAge"
      :key="index"
      class="grid grid-cols-12 gap-2 items-end"
    >
      <div class="col-span-4">
        <UFormField :label="index === 0 ? '年齢' : ''" size="sm">
          <UInput
            v-model.number="entry.fromAge"
            type="number"
            size="sm"
            :min="params.basicInfo.currentAge"
            @update:model-value="onFromAgeChange"
          >
            <template #trailing>
              <span class="text-xs text-gray-500">歳から</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-6">
        <UFormField :label="index === 0 ? '月額支出' : ''" size="sm">
          <InputMoneyInput
            v-model="entry.monthlyExpense"
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

    <p v-if="params.expensesByAge.length > 0" class="text-xs text-gray-400">
      ※ 想定寿命（{{ params.basicInfo.lifeExpectancy }}歳）まで
    </p>

    <UButton
      icon="i-lucide-plus"
      label="期間追加"
      variant="soft"
      size="sm"
      @click="addEntry"
    />
  </div>
</template>
