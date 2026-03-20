<script setup lang="ts">
const params = useSimulationParams()

function addLoan() {
  params.loans.push({
    id: crypto.randomUUID(),
    name: '',
    remainingBalance: 0,
    annualRate: 1.0,
    monthlyPayment: 0,
    startAge: params.basicInfo.currentAge,
    endAge: params.basicInfo.retirementAge
  })
}

function removeLoan(id: string) {
  const index = params.loans.findIndex(l => l.id === id)
  if (index >= 0) params.loans.splice(index, 1)
}

function calcTotalInterest(remainingBalance: number, annualRate: number, monthlyPayment: number, startAge: number, endAge: number): number {
  if (monthlyPayment <= 0 || annualRate <= 0) return 0
  const totalPayment = monthlyPayment * 12 * (endAge - startAge + 1)
  return Math.max(0, totalPayment - remainingBalance)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-house" />
          <h3 class="font-semibold">ローン</h3>
          <InputHelpTip text="住宅ローン、車のローン、教育ローンなどを設定します。月額返済額が支出として自動的に計算に反映されます。" />
        </div>
        <UButton
          icon="i-lucide-plus"
          label="ローン追加"
          size="sm"
          variant="soft"
          @click="addLoan"
        />
      </div>
    </template>

    <div class="space-y-4">
      <div v-if="params.loans.length === 0" class="text-center py-6 text-gray-400">
        <UIcon name="i-lucide-house" class="text-3xl mb-2" />
        <p class="text-sm">ローンがない場合はスキップできます</p>
      </div>

      <UCard v-for="loan in params.loans" :key="loan.id">
        <template #header>
          <div class="flex items-center justify-between">
            <UInput
              v-model="loan.name"
              placeholder="住宅ローン、車など"
              size="sm"
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

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  残債
                  <InputHelpTip text="現在のローン残高です。" />
                </span>
              </template>
              <InputMoneyInput v-model="loan.remainingBalance" size="sm" />
            </UFormField>
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  年利
                  <InputHelpTip text="ローンの年利率です。" />
                </span>
              </template>
              <UInput
                v-model.number="loan.annualRate"
                type="number"
                size="sm"
                :min="0"
                :max="30"
                :step="0.1"
              >
                <template #trailing>
                  <span class="text-xs text-gray-500">%</span>
                </template>
              </UInput>
            </UFormField>
          </div>

          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                月額返済額
                <InputHelpTip text="毎月の返済額です。元利均等・元金均等に関わらず、現在の月額を入力してください。" />
              </span>
            </template>
            <InputMoneyInput v-model="loan.monthlyPayment" size="sm" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="返済開始年齢" size="sm">
              <UInput
                v-model.number="loan.startAge"
                type="number"
                size="sm"
                :min="params.basicInfo.currentAge"
              >
                <template #trailing>
                  <span class="text-xs text-gray-500">歳</span>
                </template>
              </UInput>
            </UFormField>
            <UFormField label="返済終了年齢" size="sm">
              <UInput
                v-model.number="loan.endAge"
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

          <!-- サマリ -->
          <div v-if="loan.monthlyPayment > 0" class="text-xs text-gray-500 space-y-0.5 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div>年間返済額: {{ (loan.monthlyPayment * 12 / 10000).toLocaleString() }}万円</div>
            <div>返済期間: {{ Math.max(0, loan.endAge - loan.startAge + 1) }}年</div>
            <div>総返済額: {{ (loan.monthlyPayment * 12 * Math.max(0, loan.endAge - loan.startAge + 1) / 10000).toLocaleString() }}万円</div>
            <div v-if="loan.remainingBalance > 0">
              うち利息: 約{{ (calcTotalInterest(loan.remainingBalance, loan.annualRate, loan.monthlyPayment, loan.startAge, loan.endAge) / 10000).toLocaleString() }}万円
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UCard>
</template>
