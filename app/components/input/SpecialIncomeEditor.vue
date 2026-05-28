<script setup lang="ts">
const params = useSimulationParams()

function addIncome() {
  params.specialIncomes.push({
    id: crypto.randomUUID(),
    age: params.basicInfo.retirementAge,
    amount: 10_000_000,
    description: ''
  })
}

function removeIncome(id: string) {
  const index = params.specialIncomes.findIndex(e => e.id === id)
  if (index >= 0) params.specialIncomes.splice(index, 1)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="income in params.specialIncomes"
      :key="income.id"
      class="grid grid-cols-12 gap-2 items-end"
    >
      <div class="col-span-2">
        <UFormField label="年齢">
          <UInput
            v-model.number="income.age"
            type="number"
          >
            <template #trailing>
              <span class="text-xs text-gray-600">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-4">
        <UFormField label="金額">
          <InputMoneyInput
            v-model="income.amount"
          />
        </UFormField>
      </div>
      <div class="col-span-4">
        <UFormField label="内容">
          <UInput
            v-model="income.description"
            placeholder="退職金、相続、保険金など"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          @click="removeIncome(income.id)"
        />
      </div>
    </div>

    <UButton
      icon="i-lucide-plus"
      label="特別収入追加"
      variant="soft"
      @click="addIncome"
    />
  </div>
</template>
