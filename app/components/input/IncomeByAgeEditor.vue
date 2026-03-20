<script setup lang="ts">
const params = useSimulationParams()

function recalcToAges() {
  const entries = params.incomesByAge
  for (let i = 0; i < entries.length; i++) {
    if (i < entries.length - 1) {
      entries[i].toAge = entries[i + 1].fromAge - 1
    } else {
      // 引退年齢以降のエントリは想定寿命まで、それ以前は引退年齢まで
      entries[i].toAge = entries[i].fromAge >= params.basicInfo.retirementAge
        ? params.basicInfo.lifeExpectancy
        : params.basicInfo.retirementAge - 1
    }
  }
}

function addEntry() {
  const lastEntry = params.incomesByAge[params.incomesByAge.length - 1]
  const fromAge = lastEntry ? lastEntry.toAge + 1 : params.basicInfo.currentAge
  const isPostRetirement = fromAge >= params.basicInfo.retirementAge
  params.incomesByAge.push({
    fromAge,
    toAge: isPostRetirement ? params.basicInfo.lifeExpectancy : params.basicInfo.retirementAge - 1,
    annualIncome: 0
  })
  recalcToAges()
}

function removeEntry(index: number) {
  params.incomesByAge.splice(index, 1)
  recalcToAges()
}

function onFromAgeChange() {
  recalcToAges()
}

watch([() => params.basicInfo.retirementAge, () => params.basicInfo.lifeExpectancy], () => {
  recalcToAges()
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(entry, index) in params.incomesByAge"
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

    <p v-if="params.incomesByAge.length > 0" class="text-xs text-gray-400">
      ※ 引退（{{ params.basicInfo.retirementAge }}歳）以降は収入0として計算されます。引退後に収入がある場合は期間を追加してください
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
