<script setup lang="ts">
import type { AccountType } from '~/types/simulation'

const params = useSimulationParams()

const accountTypes: { value: AccountType, label: string }[] = [
  { value: 'nisa', label: 'NISA' },
  { value: 'ideco', label: 'iDeCo' },
  { value: 'tokutei', label: '特定口座' }
]

function addAccount(type: AccountType) {
  const labels: Record<AccountType, string> = {
    nisa: 'NISA',
    ideco: 'iDeCo',
    tokutei: '特定口座'
  }
  const base = {
    id: crypto.randomUUID(),
    type,
    label: labels[type],
    currentBalance: 0,
    currentContribution: 0,
    existingReturnRate: 5.0,
    funds: []
  }
  if (type === 'nisa') {
    Object.assign(base, {
      nisaTsumitateBalance: 0,
      nisaTsumitateContribution: 0,
      nisaTsumitateReturnRate: 5.0,
      nisaGrowthBalance: 0,
      nisaGrowthContribution: 0,
      nisaGrowthReturnRate: 5.0,
      legacyTsumitateBalance: 0,
      legacyTsumitateContribution: 0,
      legacyTsumitateReturnRate: 5.0
    })
  }
  params.accounts.push(base)
}

function removeAccount(id: string) {
  const index = params.accounts.findIndex(a => a.id === id)
  if (index >= 0) params.accounts.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-landmark" />
            <h3 class="font-semibold">
              投資口座
            </h3>
            <InputHelpTip text="NISA・iDeCo・特定口座を追加し、現在の資産と今後の積立設定を管理します。" />
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            NISA・iDeCo・特定口座の資産と積立を管理します
          </p>
        </div>
        <UDropdownMenu
          :items="accountTypes.map(t => ({ label: t.label, onSelect: () => addAccount(t.value) }))"
        >
          <UButton
            icon="i-lucide-plus"
            label="口座追加"
            variant="soft"
          />
        </UDropdownMenu>
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-if="params.accounts.length === 0"
        class="text-center py-6 text-gray-600"
      >
        <UIcon
          name="i-lucide-landmark"
          class="text-3xl mb-2"
        />
        <p class="text-sm">
          口座を追加してください
        </p>
      </div>

      <InputAccountCard
        v-for="account in params.accounts"
        :key="account.id"
        :account-id="account.id"
        @remove="removeAccount"
      />
    </div>
  </UCard>
</template>
