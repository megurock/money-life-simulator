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

// 損益
const gain = computed(() =>
  props.account.currentBalance - props.account.currentContribution
)

const gainRate = computed(() => {
  const cost = props.account.currentContribution
  if (!cost || cost <= 0) return null
  const rate = ((props.account.currentBalance - cost) / cost) * 100
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
})

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

const totalAnnualContribution = computed(() =>
  tsumitateTotalAnnual.value + growthTotalAnnual.value
)

// 生涯投資枠の残り（全 NISA 口座の合計）
const nisaUsedAll = computed(() =>
  params.accounts
    .filter(a => a.type === 'nisa')
    .reduce((sum, a) => sum + a.currentContribution, 0)
)
const remainingLifetime = computed(() =>
  Math.max(0, NISA_LIMITS.lifetime - nisaUsedAll.value)
)

const yearsToReachLifetimeLimit = computed(() => {
  if (!isNisa.value || totalAnnualContribution.value <= 0) return null
  if (remainingLifetime.value <= 0) return 0
  return Math.ceil(remainingLifetime.value / totalAnnualContribution.value)
})

const yearsUntilRetirement = computed(() =>
  Math.max(0, params.basicInfo.retirementAge - params.basicInfo.currentAge)
)

const willExhaustBeforeRetirement = computed(() => {
  if (yearsToReachLifetimeLimit.value === null) return false
  return yearsToReachLifetimeLimit.value < yearsUntilRetirement.value
})

const alreadyExhausted = computed(() =>
  isNisa.value && nisaUsedAll.value >= NISA_LIMITS.lifetime
)

const nisaFundAddItems = [
  { label: 'つみたて投資枠', onSelect: () => addFund('tsumitate') },
  { label: '成長投資枠', onSelect: () => addFund('growth') }
]

const contributionLabel = computed(() => {
  if (isNisa.value) return '累計投資額（元本）'
  if (props.account.type === 'ideco') return '累計掛金（元本）'
  return '取得原価（元本）'
})

const contributionHint = computed(() => {
  if (isNisa.value) return 'これまでに投資した合計額です。生涯投資枠の消費量になります。'
  if (props.account.type === 'ideco') return 'これまでに拠出した掛金の合計額です。退職所得控除の計算に使用します。'
  return '購入した金融商品の取得原価の合計です。売却時の譲渡益計算に使用します。'
})
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
        </div>
        <div class="flex items-center gap-2">
          <!-- 損益表示 -->
          <span v-if="account.currentContribution > 0 && gainRate" class="text-xs" :class="gain >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ gainRate }}
            ({{ gain >= 0 ? '+' : '' }}{{ (gain / 10000).toLocaleString() }}万円)
          </span>
          <UButton
            icon="i-lucide-x"
            color="error"
            variant="ghost"
            size="xs"
            @click="emit('remove', account.id)"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 現在の残高 -->
      <div class="grid grid-cols-2 gap-3">
        <UFormField size="sm">
          <template #label>
            <span class="flex items-center gap-1">
              {{ contributionLabel }}
              <InputHelpTip :text="contributionHint" />
            </span>
          </template>
          <InputMoneyInput v-model="account.currentContribution" size="sm" />
          <template v-if="isNisa" #hint>
            生涯投資枠の残り: {{ (remainingLifetime / 10000).toLocaleString() }}万円
          </template>
        </UFormField>
        <UFormField size="sm">
          <template #label>
            <span class="flex items-center gap-1">
              現在の評価額（時価）
              <InputHelpTip text="証券口座で確認できる現在の評価額です。" />
            </span>
          </template>
          <InputMoneyInput v-model="account.currentBalance" size="sm" />
        </UFormField>
      </div>

      <USeparator />

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

      <!-- ファンド一覧 -->
      <div>
        <h4 class="text-xs font-medium text-gray-500 mb-2">
          積立設定
          <span class="text-gray-400">（月額合計: {{ totalMonthly.toLocaleString() }}円）</span>
        </h4>

        <div class="space-y-3">
          <InputFundEditor
            v-for="fund in account.funds"
            :key="fund.id"
            :fund="fund"
            :is-nisa="isNisa"
            @remove="removeFund"
          />

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
      </div>
    </div>
  </UCard>
</template>
