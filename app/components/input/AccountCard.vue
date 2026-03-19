<script setup lang="ts">
import type { Account, NisaSlot } from '~/types/simulation'
import { NISA_LIMITS } from '~/utils/constants'

const params = useSimulationParams()

const props = defineProps<{
  account: Account
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const typeLabels: Record<string, string> = {
  nisa: 'NISA',
  ideco: 'iDeCo',
  tokutei: '特定口座'
}

const typeColors: Record<string, string> = {
  nisa: 'primary',
  ideco: 'success',
  tokutei: 'warning'
}

const isNisa = computed(() => props.account.type === 'nisa')

function addFund(nisaSlot?: NisaSlot) {
  props.account.funds.push({
    id: crypto.randomUUID(),
    name: '',
    monthlyContribution: 0,
    expectedReturn: 5.0,
    ...(nisaSlot ? { nisaSlot } : {})
  })
}

function removeFund(fundId: string) {
  const index = props.account.funds.findIndex(f => f.id === fundId)
  if (index >= 0) props.account.funds.splice(index, 1)
}

const totalMonthly = computed(() =>
  props.account.funds.reduce((sum, f) => sum + f.monthlyContribution, 0)
)

// NISA 枠別の年間積立額
const tsumitateTotalAnnual = computed(() =>
  props.account.funds
    .filter(f => f.nisaSlot === 'tsumitate')
    .reduce((sum, f) => sum + f.monthlyContribution * 12, 0)
)

const growthTotalAnnual = computed(() =>
  props.account.funds
    .filter(f => f.nisaSlot === 'growth')
    .reduce((sum, f) => sum + f.monthlyContribution * 12, 0)
)

const tsumitateLimitExceeded = computed(() =>
  isNisa.value && tsumitateTotalAnnual.value > NISA_LIMITS.tsumitate
)

const growthLimitExceeded = computed(() =>
  isNisa.value && growthTotalAnnual.value > NISA_LIMITS.growth
)

// 生涯投資枠チェック
const totalAnnualContribution = computed(() =>
  tsumitateTotalAnnual.value + growthTotalAnnual.value
)

// 年間上限（つみたて120万 + 成長240万 = 360万）も考慮
const annualLimitExceeded = computed(() =>
  isNisa.value && totalAnnualContribution.value > NISA_LIMITS.tsumitate + NISA_LIMITS.growth
)

// 生涯投資枠の残り（現在の資産カードの値を参照）
const nisaUsed = computed(() =>
  (params.currentAssets.nisaTsumitateContribution ?? 0) + (params.currentAssets.nisaGrowthContribution ?? 0)
)
const remainingLifetime = computed(() =>
  Math.max(0, NISA_LIMITS.lifetime - nisaUsed.value)
)

// 残枠を使い切るまでの年数
const yearsToReachLifetimeLimit = computed(() => {
  if (!isNisa.value || totalAnnualContribution.value <= 0) return null
  if (remainingLifetime.value <= 0) return 0
  return Math.ceil(remainingLifetime.value / totalAnnualContribution.value)
})

const yearsUntilRetirement = computed(() =>
  Math.max(0, params.basicInfo.retirementAge - params.basicInfo.currentAge)
)

// 引退前に枠を使い切るか
const willExhaustBeforeRetirement = computed(() => {
  if (yearsToReachLifetimeLimit.value === null) return false
  return yearsToReachLifetimeLimit.value < yearsUntilRetirement.value
})

// 既に枠を使い切っているか
const alreadyExhausted = computed(() =>
  isNisa.value && nisaUsed.value >= NISA_LIMITS.lifetime
)

const nisaFundAddItems = [
  { label: 'つみたて投資枠', onSelect: () => addFund('tsumitate') },
  { label: '成長投資枠', onSelect: () => addFund('growth') }
]
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UBadge :color="(typeColors[account.type] as any)" variant="subtle">
            {{ typeLabels[account.type] }}
          </UBadge>
          <span class="text-sm font-medium">{{ account.label }}</span>
          <span class="text-xs text-gray-400">
            月額合計: {{ totalMonthly.toLocaleString() }}円
          </span>
        </div>
        <UButton
          icon="i-lucide-x"
          color="error"
          variant="ghost"
          size="xs"
          @click="emit('remove', account.id)"
        />
      </div>
    </template>

    <div class="space-y-3">
      <!-- NISA 上限警告 -->
      <div v-if="isNisa" class="space-y-1">
        <div v-if="alreadyExhausted" class="text-xs text-red-500 flex items-center gap-1">
          <UIcon name="i-lucide-alert-triangle" />
          生涯投資枠（1,800万円）を使い切っています。新規の積立はできません。
        </div>
        <div v-if="tsumitateLimitExceeded" class="text-xs text-red-500 flex items-center gap-1">
          <UIcon name="i-lucide-alert-triangle" />
          つみたて投資枠の年間上限（120万円）を超過しています（現在: {{ (tsumitateTotalAnnual / 10000).toLocaleString() }}万円）
        </div>
        <div v-if="growthLimitExceeded" class="text-xs text-red-500 flex items-center gap-1">
          <UIcon name="i-lucide-alert-triangle" />
          成長投資枠の年間上限（240万円）を超過しています（現在: {{ (growthTotalAnnual / 10000).toLocaleString() }}万円）
        </div>
        <div v-if="!alreadyExhausted && willExhaustBeforeRetirement" class="text-xs text-amber-500 flex items-center gap-1">
          <UIcon name="i-lucide-info" />
          約{{ yearsToReachLifetimeLimit }}年後に生涯投資枠に到達します（引退まで残り{{ yearsUntilRetirement }}年）。到達後は積立が停止されます。
        </div>
        <div v-else-if="!alreadyExhausted && yearsToReachLifetimeLimit !== null" class="text-xs text-gray-400 flex items-center gap-1">
          <UIcon name="i-lucide-info" />
          現在のペースで約{{ yearsToReachLifetimeLimit }}年後に生涯投資枠に到達します
        </div>
      </div>

      <InputFundEditor
        v-for="fund in account.funds"
        :key="fund.id"
        :fund="fund"
        :is-nisa="isNisa"
        @remove="removeFund"
      />

      <!-- NISA の場合は枠を選んでファンド追加 -->
      <UDropdownMenu v-if="isNisa" :items="nisaFundAddItems">
        <UButton
          icon="i-lucide-plus"
          label="ファンド追加"
          variant="soft"
          size="sm"
          block
        />
      </UDropdownMenu>
      <UButton
        v-else
        icon="i-lucide-plus"
        label="ファンド追加"
        variant="soft"
        size="sm"
        block
        @click="addFund()"
      />
    </div>
  </UCard>
</template>
