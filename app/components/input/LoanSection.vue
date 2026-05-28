<script setup lang="ts">
const params = useSimulationParams()

function addLoan() {
  params.loans.push({
    id: crypto.randomUUID(),
    name: '',
    annualPayment: 0,
    endAge: params.basicInfo.retirementAge
  })
}

function removeLoan(id: string) {
  const index = params.loans.findIndex(l => l.id === id)
  if (index >= 0) params.loans.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-house" />
            <h3 class="font-semibold">
              ローン
            </h3>
            <InputHelpTip text="住宅ローン、車のローン、教育ローンなどを設定します。\nボーナス払いを含む年間の返済総額を入力してください。" />
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            住宅・車・教育ローンなどの年間返済額を設定します
          </p>
        </div>
        <UButton
          icon="i-lucide-plus"
          label="ローン追加"
          variant="soft"
          @click="addLoan"
        />
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-if="params.loans.length === 0"
        class="text-center py-6 text-gray-600"
      >
        <UIcon
          name="i-lucide-house"
          class="text-3xl mb-2"
        />
        <p class="text-sm">
          ローンがない場合はスキップできます
        </p>
      </div>

      <UCard
        v-for="loan in params.loans"
        :key="loan.id"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <UInput
              v-model="loan.name"
              placeholder="住宅ローン、車など"
              variant="ghost"
              class="font-medium"
            />
            <UButton
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              size="xs"
              @click="removeLoan(loan.id)"
            />
          </div>
        </template>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="年間返済額">
            <InputMoneyInput v-model="loan.annualPayment" />
          </UFormField>
          <UFormField label="返済終了年齢">
            <UInput
              v-model.number="loan.endAge"
              type="number"
              :min="params.basicInfo.currentAge"
              :max="params.basicInfo.lifeExpectancy"
            >
              <template #trailing>
                <span class="text-xs text-gray-600">歳</span>
              </template>
            </UInput>
          </UFormField>
        </div>

        <!-- サマリ -->
        <div
          v-if="loan.annualPayment > 0"
          class="text-xs text-gray-600 space-y-0.5 pt-2"
        >
          <div>返済期間: {{ Math.max(0, loan.endAge - params.basicInfo.currentAge + 1) }}年</div>
          <div>総返済額: {{ (loan.annualPayment * Math.max(0, loan.endAge - params.basicInfo.currentAge + 1) / 10000).toLocaleString() }}万円</div>
        </div>
      </UCard>
    </div>
  </UCard>
</template>
