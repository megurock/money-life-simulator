<script setup lang="ts">
const params = useSimulationParams()

function addExpense() {
  params.specialExpenses.push({
    id: crypto.randomUUID(),
    age: params.basicInfo.currentAge + 5,
    amount: 1_000_000,
    description: ''
  })
}

function removeExpense(id: string) {
  const index = params.specialExpenses.findIndex(e => e.id === id)
  if (index >= 0) params.specialExpenses.splice(index, 1)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="expense in params.specialExpenses"
      :key="expense.id"
      class="grid grid-cols-12 gap-2 items-end"
    >
      <div class="col-span-2">
        <UFormField label="年齢" size="sm">
          <UInput
            v-model.number="expense.age"
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
            v-model="expense.amount"
            size="sm"
          />
        </UFormField>
      </div>
      <div class="col-span-4">
        <UFormField label="内容" size="sm">
          <UInput
            v-model="expense.description"
            size="sm"
            placeholder="住宅修繕、車購入など"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          @click="removeExpense(expense.id)"
        />
      </div>
    </div>

    <UButton
      icon="i-lucide-plus"
      label="特別支出追加"
      variant="soft"
      size="sm"
      @click="addExpense"
    />
  </div>
</template>
