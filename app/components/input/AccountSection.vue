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
  params.accounts.push({
    id: crypto.randomUUID(),
    type,
    label: labels[type],
    funds: []
  })
}

function removeAccount(id: string) {
  const index = params.accounts.findIndex(a => a.id === id)
  if (index >= 0) params.accounts.splice(index, 1)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-landmark" />
        <h3 class="font-semibold">投資口座</h3>
      </div>
      <UDropdownMenu
        :items="accountTypes.map(t => ({ label: t.label, onSelect: () => addAccount(t.value) }))"
      >
        <UButton
          icon="i-lucide-plus"
          label="口座追加"
          size="sm"
          variant="soft"
        />
      </UDropdownMenu>
    </div>

    <div v-if="params.accounts.length === 0" class="text-center py-8 text-gray-400">
      <UIcon name="i-lucide-wallet" class="text-3xl mb-2" />
      <p class="text-sm">口座を追加してください</p>
    </div>

    <InputAccountCard
      v-for="account in params.accounts"
      :key="account.id"
      :account="account"
      @remove="removeAccount"
    />
  </div>
</template>
