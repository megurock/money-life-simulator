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
        <UFormField label="年齢" size="sm">
          <UInput
            v-model.number="income.age"
            type="number"
            size="sm"
          >
            <template #trailing>
              <span class="text-xs text-gray-500">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-4">
        <UFormField label="金額" size="sm">
          <InputMoneyInput
            v-model="income.amount"
            size="sm"
          />
        </UFormField>
      </div>
      <div class="col-span-4">
        <UFormField label="内容" size="sm">
          <UInput
            v-model="income.description"
            size="sm"
            placeholder="退職金、相続、保険金など"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          @click="removeIncome(income.id)"
        />
      </div>
    </div>

    <UButton
      icon="i-lucide-plus"
      label="特別収入追加"
      variant="soft"
      size="sm"
      @click="addIncome"
    />
  </div>
</template>
