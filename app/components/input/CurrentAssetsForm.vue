<script setup lang="ts">
import { NISA_LIMITS } from '~/utils/constants'

const params = useSimulationParams()

const nisaTotalContribution = computed(() =>
  params.currentAssets.nisaTsumitateContribution + params.currentAssets.nisaGrowthContribution
)

const nisaRemainingLifetime = computed(() =>
  Math.max(0, NISA_LIMITS.lifetime - nisaTotalContribution.value)
)

function calcGainRate(balance: number, cost: number): string | null {
  if (!cost || cost <= 0) return null
  if (!balance && balance !== 0) return null
  const rate = ((balance - cost) / cost) * 100
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
}

function hasGainInfo(contribution: number, balance: number): boolean {
  return contribution > 0 && balance >= 0
}

const nisaTsumitateGain = computed(() =>
  params.currentAssets.nisaTsumitateBalance - params.currentAssets.nisaTsumitateContribution
)
const nisaGrowthGain = computed(() =>
  params.currentAssets.nisaGrowthBalance - params.currentAssets.nisaGrowthContribution
)
const idecoGain = computed(() =>
  params.currentAssets.idecoBalance - params.currentAssets.idecoContribution
)
const tokuteiGain = computed(() =>
  params.currentAssets.tokuteiBalance - params.currentAssets.tokuteiCost
)

// 円グラフ
const totalAssets = computed(() => {
  const a = params.currentAssets
  return a.savings + a.nisaTsumitateBalance + a.nisaGrowthBalance + a.idecoBalance + a.tokuteiBalance
})

interface PieItem {
  value: number
  name: string
  itemStyle: { color: string }
  cost: number       // 元本
  gain: number       // 損益額
  gainRate: string   // 損益率
  returnRate: number // 期待利回り
}

const pieData = computed<PieItem[]>(() => {
  const a = params.currentAssets
  const items: PieItem[] = [
    {
      value: a.savings, name: '預貯金', itemStyle: { color: '#94a3b8' },
      cost: a.savings, gain: 0, gainRate: '-', returnRate: 0
    },
    {
      value: a.nisaTsumitateBalance, name: 'NISA つみたて', itemStyle: { color: '#3b82f6' },
      cost: a.nisaTsumitateContribution, gain: nisaTsumitateGain.value,
      gainRate: calcGainRate(a.nisaTsumitateBalance, a.nisaTsumitateContribution) ?? '-',
      returnRate: a.nisaTsumitateExpectedReturn
    },
    {
      value: a.nisaGrowthBalance, name: 'NISA 成長', itemStyle: { color: '#6366f1' },
      cost: a.nisaGrowthContribution, gain: nisaGrowthGain.value,
      gainRate: calcGainRate(a.nisaGrowthBalance, a.nisaGrowthContribution) ?? '-',
      returnRate: a.nisaGrowthExpectedReturn
    },
    {
      value: a.idecoBalance, name: 'iDeCo', itemStyle: { color: '#22c55e' },
      cost: a.idecoContribution, gain: idecoGain.value,
      gainRate: calcGainRate(a.idecoBalance, a.idecoContribution) ?? '-',
      returnRate: a.idecoExpectedReturn
    },
    {
      value: a.tokuteiBalance, name: '特定口座', itemStyle: { color: '#f59e0b' },
      cost: a.tokuteiCost, gain: tokuteiGain.value,
      gainRate: calcGainRate(a.tokuteiBalance, a.tokuteiCost) ?? '-',
      returnRate: a.tokuteiExpectedReturn
    }
  ]
  return items.filter(d => d.value > 0)
})

const pieOptions = computed(() => {
  if (pieData.value.length === 0) return null
  const total = totalAssets.value

  return {
    tooltip: {
      trigger: 'item',
      formatter(p: any) {
        const item = pieData.value.find(d => d.name === p.name)
        if (!item) return ''
        const pct = p.percent?.toFixed(1) ?? '0'
        const valMan = Math.round(item.value / 10000).toLocaleString()
        let html = `${p.marker} <strong>${p.name}</strong><br/>`
        html += `評価額: ${valMan}万円（構成比 ${pct}%）<br/>`
        if (item.name !== '預貯金' && item.cost > 0) {
          const costMan = Math.round(item.cost / 10000).toLocaleString()
          const gainMan = Math.round(item.gain / 10000).toLocaleString()
          const gainSign = item.gain >= 0 ? '+' : ''
          const gainColor = item.gain >= 0 ? '#22c55e' : '#ef4444'
          html += `元本: ${costMan}万円<br/>`
          html += `損益: <span style="color:${gainColor}">${gainSign}${gainMan}万円（${item.gainRate}）</span><br/>`
          html += `期待利回り: ${item.returnRate}%`
        }
        return html
      }
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: { fontSize: 11 },
      formatter(name: string) {
        const item = pieData.value.find(d => d.name === name)
        if (!item || total <= 0) return name
        const pct = ((item.value / total) * 100).toFixed(1)
        const man = Math.round(item.value / 10000).toLocaleString()
        return `${name}  ${man}万円 (${pct}%)`
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['30%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: pieData.value
    }]
  }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-piggy-bank" />
          <h3 class="font-semibold">現在の資産</h3>
        </div>
        <span v-if="totalAssets > 0" class="text-sm font-semibold text-primary">
          合計: {{ Math.round(totalAssets / 10000).toLocaleString() }}万円
        </span>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 円グラフ -->
      <div v-if="pieOptions" class="h-[200px]">
        <VChart :option="pieOptions" autoresize class="w-full h-full" />
      </div>

      <!-- 預貯金 -->
      <UFormField label="預貯金">
        <InputMoneyInput
          v-model="params.currentAssets.savings"
          placeholder="5,000,000"
        />
      </UFormField>

      <USeparator />

      <!-- NISA -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">NISA</h4>
          <span class="text-xs text-gray-400">
            生涯投資枠の残り: {{ (nisaRemainingLifetime / 10000).toLocaleString() }}万円 / 1,800万円
          </span>
        </div>

        <!-- つみたて投資枠 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-blue-600 dark:text-blue-400">つみたて投資枠</span>
            <span v-if="hasGainInfo(params.currentAssets.nisaTsumitateContribution, params.currentAssets.nisaTsumitateBalance)" class="text-xs" :class="nisaTsumitateGain >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ calcGainRate(params.currentAssets.nisaTsumitateBalance, params.currentAssets.nisaTsumitateContribution) }}
              ({{ nisaTsumitateGain >= 0 ? '+' : '' }}{{ (nisaTsumitateGain / 10000).toLocaleString() }}万円)
            </span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  累計投資額
                  <InputHelpTip text="つみたて投資枠でこれまでに投資した合計額です。年間上限は120万円です。" />
                </span>
              </template>
              <InputMoneyInput v-model="params.currentAssets.nisaTsumitateContribution" size="sm" />
            </UFormField>
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  評価額
                  <InputHelpTip text="つみたて投資枠の現在の評価額です。" />
                </span>
              </template>
              <InputMoneyInput v-model="params.currentAssets.nisaTsumitateBalance" size="sm" />
            </UFormField>
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  期待利回り
                  <InputHelpTip text="既存のつみたて投資枠の資産に対する年間の期待利回りです。" />
                </span>
              </template>
              <UInput
                v-model.number="params.currentAssets.nisaTsumitateExpectedReturn"
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
        </div>

        <!-- 成長投資枠 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-green-600 dark:text-green-400">成長投資枠</span>
            <span v-if="hasGainInfo(params.currentAssets.nisaGrowthContribution, params.currentAssets.nisaGrowthBalance)" class="text-xs" :class="nisaGrowthGain >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ calcGainRate(params.currentAssets.nisaGrowthBalance, params.currentAssets.nisaGrowthContribution) }}
              ({{ nisaGrowthGain >= 0 ? '+' : '' }}{{ (nisaGrowthGain / 10000).toLocaleString() }}万円)
            </span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  累計投資額
                  <InputHelpTip text="成長投資枠でこれまでに投資した合計額です。年間上限は240万円です。" />
                </span>
              </template>
              <InputMoneyInput v-model="params.currentAssets.nisaGrowthContribution" size="sm" />
            </UFormField>
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  評価額
                  <InputHelpTip text="成長投資枠の現在の評価額です。" />
                </span>
              </template>
              <InputMoneyInput v-model="params.currentAssets.nisaGrowthBalance" size="sm" />
            </UFormField>
            <UFormField size="sm">
              <template #label>
                <span class="flex items-center gap-1">
                  期待利回り
                  <InputHelpTip text="既存の成長投資枠の資産に対する年間の期待利回りです。" />
                </span>
              </template>
              <UInput
                v-model.number="params.currentAssets.nisaGrowthExpectedReturn"
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
        </div>
      </div>

      <USeparator />

      <!-- iDeCo -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">iDeCo</h4>
          <span v-if="hasGainInfo(params.currentAssets.idecoContribution, params.currentAssets.idecoBalance)" class="text-xs" :class="idecoGain >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ calcGainRate(params.currentAssets.idecoBalance, params.currentAssets.idecoContribution) }}
            ({{ idecoGain >= 0 ? '+' : '' }}{{ (idecoGain / 10000).toLocaleString() }}万円)
          </span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                累計掛金
                <InputHelpTip text="iDeCo にこれまでに拠出した掛金の合計額です。受取時の退職所得控除の計算に使用します。" />
              </span>
            </template>
            <InputMoneyInput v-model="params.currentAssets.idecoContribution" size="sm" />
          </UFormField>
          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                評価額
                <InputHelpTip text="iDeCo の現在の資産評価額です。運用損益を含めた時価を入力してください。" />
              </span>
            </template>
            <InputMoneyInput v-model="params.currentAssets.idecoBalance" size="sm" />
          </UFormField>
          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                期待利回り
                <InputHelpTip text="既存の iDeCo 資産に対する年間の期待利回りです。" />
              </span>
            </template>
            <UInput
              v-model.number="params.currentAssets.idecoExpectedReturn"
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
      </div>

      <USeparator />

      <!-- 特定口座 -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">特定口座</h4>
          <span v-if="hasGainInfo(params.currentAssets.tokuteiCost, params.currentAssets.tokuteiBalance)" class="text-xs" :class="tokuteiGain >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ calcGainRate(params.currentAssets.tokuteiBalance, params.currentAssets.tokuteiCost) }}
            ({{ tokuteiGain >= 0 ? '+' : '' }}{{ (tokuteiGain / 10000).toLocaleString() }}万円)
          </span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                取得原価
                <InputHelpTip text="特定口座で購入した金融商品の取得原価の合計です。売却時の譲渡益計算に使用します。" />
              </span>
            </template>
            <InputMoneyInput v-model="params.currentAssets.tokuteiCost" size="sm" />
          </UFormField>
          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                評価額
                <InputHelpTip text="特定口座の現在の資産評価額です。売却時に約20.315%の税金がかかります。" />
              </span>
            </template>
            <InputMoneyInput v-model="params.currentAssets.tokuteiBalance" size="sm" />
          </UFormField>
          <UFormField size="sm">
            <template #label>
              <span class="flex items-center gap-1">
                期待利回り
                <InputHelpTip text="既存の特定口座の資産に対する年間の期待利回りです。" />
              </span>
            </template>
            <UInput
              v-model.number="params.currentAssets.tokuteiExpectedReturn"
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
      </div>
    </div>
  </UCard>
</template>
