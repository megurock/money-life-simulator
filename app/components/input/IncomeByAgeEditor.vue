<script setup lang="ts">
const params = useSimulationParams()

function recalcToAges() {
  const entries = params.incomesByAge
  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i]
    const next = entries[i + 1]
    if (current && next) {
      current.toAge = next.fromAge - 1
    }
  }
}

function addEntry() {
  const lastEntry = params.incomesByAge[params.incomesByAge.length - 1]
  const fromAge = lastEntry ? lastEntry.toAge + 1 : params.basicInfo.currentAge
  params.incomesByAge.push({
    fromAge,
    toAge: Math.max(fromAge, params.basicInfo.retirementAge - 1),
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

function onToAgeChange(index: number) {
  // 最後のエントリの toAge が変更されたら、次の期間追加時の fromAge に影響する
  // 中間エントリの toAge は自動計算されるため変更不要
  if (index === params.incomesByAge.length - 1) return
  recalcToAges()
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(entry, index) in params.incomesByAge"
      :key="index"
      class="grid grid-cols-12 gap-2 items-end"
    >
      <div class="col-span-2">
        <UFormField :label="index === 0 ? '開始' : ''">
          <UInput
            v-model.number="entry.fromAge"
            type="number"
            :min="params.basicInfo.currentAge"
            @update:model-value="onFromAgeChange"
          >
            <template #trailing>
              <span class="text-xs text-gray-600">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-2">
        <UFormField :label="index === 0 ? '終了' : ''">
          <UInput
            v-model.number="entry.toAge"
            type="number"
            :min="entry.fromAge"
            :disabled="index < params.incomesByAge.length - 1"
            @update:model-value="onToAgeChange(index)"
          >
            <template #trailing>
              <span class="text-xs text-gray-600">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-6">
        <UFormField :label="index === 0 ? '年間手取り' : ''">
          <InputMoneyInput
            v-model="entry.annualIncome"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          @click="removeEntry(index)"
        />
      </div>
    </div>

    <p
      v-if="params.incomesByAge.length > 0"
      class="text-xs text-gray-600"
    >
      ※ 設定された期間外は収入0として計算されます
    </p>

    <UButton
      icon="i-lucide-plus"
      label="期間追加"
      variant="soft"
      @click="addEntry"
    />
  </div>
</template>
