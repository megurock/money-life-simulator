<script setup lang="ts">
import type { NisaSlot } from '~/types/simulation'
import { NISA_LIMITS } from '~/utils/constants'

const params = useSimulationParams()

const props = defineProps<{
  accountId: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const account = computed(() => {
  const found = params.accounts.find(a => a.id === props.accountId)
  if (!found) throw new Error(`Account not found: ${props.accountId}`)
  return found
})

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

const isNisa = computed(() => account.value.type === 'nisa')

function addFund(nisaSlot?: NisaSlot) {
  const defaultEndAge = account.value.type === 'nisa'
    ? params.basicInfo.retirementAge
    : account.value.type === 'ideco'
      ? Math.min(params.basicInfo.retirementAge, 65)
      : undefined
  account.value.funds.push({
    id: crypto.randomUUID(),
    name: '',
    monthlyContribution: 0,
    expectedReturn: 5.0,
    endAge: defaultEndAge,
    ...(nisaSlot ? { nisaSlot } : {})
  })
}

function removeFund(fundId: string) {
  const index = account.value.funds.findIndex(f => f.id === fundId)
  if (index >= 0) account.value.funds.splice(index, 1)
}

const totalMonthly = computed(() =>
  account.value.funds.reduce((sum, f) => sum + f.monthlyContribution, 0)
)

// 損益
const totalBalance = computed(() => {
  if (isNisa.value) {
    return (account.value.nisaTsumitateBalance ?? 0)
      + (account.value.nisaGrowthBalance ?? 0)
      + (account.value.legacyTsumitateBalance ?? 0)
  }
  return account.value.currentBalance
})

const totalContribution = computed(() => {
  if (isNisa.value) {
    return (account.value.nisaTsumitateContribution ?? 0)
      + (account.value.nisaGrowthContribution ?? 0)
      + (account.value.legacyTsumitateContribution ?? 0)
  }
  return account.value.currentContribution
})

const gain = computed(() => totalBalance.value - totalContribution.value)

const gainRate = computed(() => {
  const cost = totalContribution.value
  if (!cost || cost <= 0) return null
  const rate = ((totalBalance.value - cost) / cost) * 100
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
})

// NISA 枠別の年間積立額
const tsumitateTotalAnnual = computed(() =>
  account.value.funds
    .filter(f => f.nisaSlot === 'tsumitate')
    .reduce((sum, f) => sum + f.monthlyContribution * 12, 0)
)

const growthTotalAnnual = computed(() =>
  account.value.funds
    .filter(f => f.nisaSlot === 'growth')
    .reduce((sum, f) => sum + f.monthlyContribution * 12, 0)
)

const tsumitateLimitExceeded = computed(() =>
  isNisa.value && tsumitateTotalAnnual.value > NISA_LIMITS.tsumitate
)

const growthLimitExceeded = computed(() =>
  isNisa.value && growthTotalAnnual.value > NISA_LIMITS.growth
)

// 新 NISA の生涯投資枠消費量（旧 NISA は含まない）
const nisaUsedAll = computed(() =>
  params.accounts
    .filter(a => a.type === 'nisa')
    .reduce((sum, a) => sum + (a.nisaTsumitateContribution ?? 0) + (a.nisaGrowthContribution ?? 0), 0)
)

// 積立期間を考慮して、枠を使い切る年齢を計算
const annualContribution = computed(() =>
  account.value.funds.reduce((sum, f) => sum + f.monthlyContribution * 12, 0)
)

const nisaExhaustionAge = computed(() => {
  if (!isNisa.value) return null
  const annual = annualContribution.value
  if (annual <= 0) return null
  let total = nisaUsedAll.value
  if (total >= NISA_LIMITS.lifetime) return params.basicInfo.currentAge

  for (let age = params.basicInfo.currentAge + 1; age <= params.basicInfo.lifeExpectancy; age++) {
    total += annual
    if (total >= NISA_LIMITS.lifetime) return age
  }
  return null
})

const yearsToReachLifetimeLimit = computed(() => {
  if (nisaExhaustionAge.value === null) return null
  return nisaExhaustionAge.value - params.basicInfo.currentAge
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

// 年齢スライダーによる生涯投資枠の推移
const sliderAge = ref(params.basicInfo.currentAge)

const sliderMaxAge = computed(() => {
  if (isNisa.value) return params.basicInfo.lifeExpectancy
  if (account.value.funds.length === 0) return params.basicInfo.lifeExpectancy
  const ages = account.value.funds.map(f => f.endAge ?? params.basicInfo.retirementAge)
  return Math.max(...ages, params.basicInfo.currentAge)
})

const nisaProjectedUsed = computed(() => {
  if (!isNisa.value) return 0
  const annual = annualContribution.value
  let total = nisaUsedAll.value
  for (let age = params.basicInfo.currentAge + 1; age <= sliderAge.value; age++) {
    total += annual
    if (total >= NISA_LIMITS.lifetime) return NISA_LIMITS.lifetime
  }
  return total
})

const nisaProjectedRemaining = computed(() =>
  Math.max(0, NISA_LIMITS.lifetime - nisaProjectedUsed.value)
)

const nisaFundAddItems = [
  { label: 'つみたて投資枠', onSelect: () => addFund('tsumitate') },
  { label: '成長投資枠', onSelect: () => addFund('growth') }
]

const contributionLabel = computed(() => {
  if (isNisa.value) return '累計投資額（元本）'
  if (account.value.type === 'ideco') return '累計掛金（元本）'
  return '取得原価（元本）'
})

const contributionHint = computed(() => {
  if (isNisa.value) return 'これまでに投資した合計額です。生涯投資枠の消費量になります。'
  if (account.value.type === 'ideco') return 'これまでに拠出した掛金の合計額です。退職所得控除の計算に使用します。'
  return '購入した金融商品の取得原価の合計です。売却時の譲渡益計算に使用します。'
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UBadge
            :color="(typeColors[account.type] as any)"
            variant="subtle"
          >
            {{ typeLabels[account.type] }}
          </UBadge>
          <span class="text-sm font-medium">{{ account.label }}</span>
        </div>
        <div class="flex items-center gap-2">
          <!-- 損益表示 -->
          <span
            v-if="account.currentContribution > 0 && gainRate"
            class="text-xs"
            :class="gain >= 0 ? 'text-green-500' : 'text-red-500'"
          >
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
      <!-- NISA 生涯投資枠 -->
      <div
        v-if="isNisa"
        class="space-y-3"
      >
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
          生涯投資枠
        </h4>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs text-gray-600">
            <span>枠の推移</span>
            <span class="font-medium">
              {{ Math.round(nisaProjectedUsed / 10000).toLocaleString() }}万円 / 1,800万円
            </span>
          </div>

          <!-- バー: 現在の投資額（濃い青）+ 将来の積立（薄い青） -->
          <div class="w-full h-6 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
            <div
              class="absolute h-full transition-all duration-300"
              :class="nisaProjectedUsed >= NISA_LIMITS.lifetime ? 'bg-red-400' : 'bg-blue-300'"
              :style="{ width: `${Math.min(100, (nisaProjectedUsed / NISA_LIMITS.lifetime) * 100)}%` }"
            />
            <div
              class="absolute h-full"
              :class="nisaUsedAll >= NISA_LIMITS.lifetime ? 'bg-red-500' : 'bg-blue-500'"
              :style="{ width: `${Math.min(100, (nisaUsedAll / NISA_LIMITS.lifetime) * 100)}%` }"
            />
          </div>

          <!-- スライダー -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-600 shrink-0">{{ params.basicInfo.currentAge }}歳</span>
            <input
              v-model.number="sliderAge"
              type="range"
              :min="params.basicInfo.currentAge"
              :max="sliderMaxAge"
              class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
            >
            <span class="text-xs text-gray-600 shrink-0">{{ sliderMaxAge }}歳</span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-600">
              <strong>{{ sliderAge }}歳</strong>時点
            </span>
            <span :class="nisaProjectedRemaining > 0 ? 'text-gray-600' : 'text-red-500'">
              残り: {{ Math.round(nisaProjectedRemaining / 10000).toLocaleString() }}万円
            </span>
          </div>
        </div>

        <!-- 上限警告 -->
        <div class="space-y-1">
          <div
            v-if="alreadyExhausted"
            class="text-xs text-red-500 flex items-center gap-1"
          >
            <UIcon name="i-lucide-alert-triangle" />
            生涯投資枠（1,800万円）を使い切っています。新規の積立はできません。
          </div>
          <div
            v-if="tsumitateLimitExceeded"
            class="text-xs text-red-500 flex items-center gap-1"
          >
            <UIcon name="i-lucide-alert-triangle" />
            つみたて投資枠の年間上限（120万円）を超過しています（現在: {{ (tsumitateTotalAnnual / 10000).toLocaleString() }}万円）
          </div>
          <div
            v-if="growthLimitExceeded"
            class="text-xs text-red-500 flex items-center gap-1"
          >
            <UIcon name="i-lucide-alert-triangle" />
            成長投資枠の年間上限（240万円）を超過しています（現在: {{ (growthTotalAnnual / 10000).toLocaleString() }}万円）
          </div>
          <div
            v-if="!alreadyExhausted && willExhaustBeforeRetirement"
            class="text-xs text-amber-500 flex items-center gap-1"
          >
            <UIcon name="i-lucide-info" />
            約{{ yearsToReachLifetimeLimit }}年後に生涯投資枠に到達します（引退まで残り{{ yearsUntilRetirement }}年）。到達後は積立が停止されます。
          </div>
          <div
            v-else-if="!alreadyExhausted && yearsToReachLifetimeLimit !== null"
            class="text-xs text-gray-600 flex items-center gap-1"
          >
            <UIcon name="i-lucide-info" />
            現在のペースで約{{ yearsToReachLifetimeLimit }}年後に生涯投資枠に到達します
          </div>
        </div>
      </div>

      <!-- 現在まで（累計投資） -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-3 space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide flex items-center gap-1.5">
          <UIcon
            name="i-lucide-history"
            class="text-base"
          />
          現在まで（累計投資）
        </h4>

        <!-- NISA: 枠別入力 -->
        <template v-if="isNisa">
          <!-- 新 NISA つみたて投資枠 -->
          <div class="space-y-1">
            <span class="text-xs font-medium text-blue-600 dark:text-blue-400">新 NISA つみたて投資枠</span>
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="元本">
                <InputMoneyInput v-model="account.nisaTsumitateContribution" />
              </UFormField>
              <UFormField label="評価額">
                <InputMoneyInput v-model="account.nisaTsumitateBalance" />
              </UFormField>
              <UFormField label="利回り">
                <UInput
                  v-model.number="account.nisaTsumitateReturnRate"
                  type="number"
                  :min="0"
                  :max="30"
                  :step="0.1"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-600">%</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>

          <!-- 新 NISA 成長投資枠 -->
          <div class="space-y-1">
            <span class="text-xs font-medium text-green-600 dark:text-green-400">新 NISA 成長投資枠</span>
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="元本">
                <InputMoneyInput v-model="account.nisaGrowthContribution" />
              </UFormField>
              <UFormField label="評価額">
                <InputMoneyInput v-model="account.nisaGrowthBalance" />
              </UFormField>
              <UFormField label="利回り">
                <UInput
                  v-model.number="account.nisaGrowthReturnRate"
                  type="number"
                  :min="0"
                  :max="30"
                  :step="0.1"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-600">%</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>

          <!-- 旧つみたて NISA -->
          <div class="space-y-1">
            <div class="flex items-center gap-1">
              <span class="text-xs font-medium text-purple-600 dark:text-purple-400">旧つみたて NISA</span>
              <InputHelpTip text="2018〜2023年に旧つみたて NISA で購入した分です。新 NISA とは別枠で、生涯投資枠（1,800万円）には含まれません。\n非課税期間は購入年から20年間。期限切れ後は課税口座に移管され、移管後の含み益に20.315%が課税されます。" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="元本">
                <InputMoneyInput v-model="account.legacyTsumitateContribution" />
              </UFormField>
              <UFormField label="評価額">
                <InputMoneyInput v-model="account.legacyTsumitateBalance" />
              </UFormField>
              <UFormField label="利回り">
                <UInput
                  v-model.number="account.legacyTsumitateReturnRate"
                  type="number"
                  :min="0"
                  :max="30"
                  :step="0.1"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-600">%</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
            <div class="mt-2">
              <UFormField>
                <template #label>
                  <span class="flex items-center gap-1">
                    非課税期限
                    <InputHelpTip text="購入年から20年後が非課税期限です。\n・2018年購入 → 2037年\n・2019年 → 2038年\n・2020年 → 2039年\n・2021年 → 2040年\n・2022年 → 2041年\n・2023年 → 2042年\n複数年にまたがる場合は、残高が大きい年の期限を入力してください。" />
                  </span>
                </template>
                <UInput
                  v-model.number="account.legacyTsumitateEndYear"
                  type="number"
                  placeholder="2042"
                  class="max-w-32"
                >
                  <template #trailing>
                    <span class="text-xs text-gray-600">年</span>
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>
        </template>

        <!-- iDeCo / 特定口座: 従来の入力 -->
        <div
          v-else
          class="grid grid-cols-3 gap-3"
        >
          <UFormField>
            <template #label>
              <span class="flex items-center gap-1">
                {{ contributionLabel }}
                <InputHelpTip :text="contributionHint" />
              </span>
            </template>
            <InputMoneyInput v-model="account.currentContribution" />
          </UFormField>
          <UFormField>
            <template #label>
              <span class="flex items-center gap-1">
                評価額（時価）
                <InputHelpTip text="証券口座で確認できる現在の評価額です。" />
              </span>
            </template>
            <InputMoneyInput v-model="account.currentBalance" />
          </UFormField>
          <UFormField>
            <template #label>
              <span class="flex items-center gap-1">
                既存利回り
                <InputHelpTip text="現在保有している資産に適用される年間の期待利回りです。" />
              </span>
            </template>
            <UInput
              v-model.number="account.existingReturnRate"
              type="number"
              :min="0"
              :max="30"
              :step="0.1"
            >
              <template #trailing>
                <span class="text-xs text-gray-600">%</span>
              </template>
            </UInput>
          </UFormField>
        </div>
      </div>

      <!-- 現在から（積立設定） -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-3 space-y-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide flex items-center gap-1.5">
          <UIcon
            name="i-lucide-arrow-right"
            class="text-base"
          />
          現在から（積立設定）
          <span
            v-if="account.funds.length > 0"
            class="text-gray-600 dark:text-gray-400 normal-case font-normal text-xs"
          >— 月額合計: {{ totalMonthly.toLocaleString() }}円</span>
        </h4>

        <div class="space-y-3">
          <InputFundEditor
            v-for="fund in account.funds"
            :key="fund.id"
            :account-id="account.id"
            :fund-id="fund.id"
            :is-nisa="isNisa"
            :account-type="account.type"
            @remove="removeFund"
          />

          <!-- ファンド未設定時のガイド -->
          <div
            v-if="account.funds.length === 0"
            class="rounded border border-dashed border-gray-300 dark:border-gray-600 p-3 text-center"
          >
            <p class="text-xs text-gray-600 dark:text-gray-400">
              今後の積立設定がありません。ファンドを追加して毎月の積立計画を設定しましょう。
            </p>
          </div>

          <p
            v-if="isNisa && nisaExhaustionAge !== null && !alreadyExhausted"
            class="text-xs text-gray-600"
          >
            ※ 生涯投資枠に {{ nisaExhaustionAge }}歳で到達するため、以降の積立は自動停止します
          </p>

          <UDropdownMenu
            v-if="isNisa"
            :items="nisaFundAddItems"
          >
            <UButton
              icon="i-lucide-plus"
              label="ファンド追加"
              variant="soft"
              block
            />
          </UDropdownMenu>
          <UButton
            v-else
            icon="i-lucide-plus"
            label="ファンド追加"
            variant="soft"
            block
            @click="addFund()"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
