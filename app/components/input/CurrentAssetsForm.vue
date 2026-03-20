<script setup lang="ts">
const params = useSimulationParams()

function calcGainRate(balance: number, cost: number): string | null {
  if (!cost || cost <= 0) return null
  const rate = ((balance - cost) / cost) * 100
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
}

function getAccountTotalBalance(a: typeof params.accounts[number]): number {
  if (a.type === 'nisa') {
    return (a.nisaTsumitateBalance ?? 0) + (a.nisaGrowthBalance ?? 0) + (a.legacyTsumitateBalance ?? 0)
  }
  return a.currentBalance
}

function getAccountTotalContribution(a: typeof params.accounts[number]): number {
  if (a.type === 'nisa') {
    return (a.nisaTsumitateContribution ?? 0) + (a.nisaGrowthContribution ?? 0) + (a.legacyTsumitateContribution ?? 0)
  }
  return a.currentContribution
}

const accountSummaries = computed(() => {
  return params.accounts.map(a => {
    const balance = getAccountTotalBalance(a)
    const contribution = getAccountTotalContribution(a)
    return {
      id: a.id,
      label: a.label,
      type: a.type,
      balance,
      contribution,
      gain: balance - contribution,
      gainRate: calcGainRate(balance, contribution)
    }
  })
})

const totalAssets = computed(() => {
  const investmentTotal = params.accounts.reduce((sum, a) => sum + getAccountTotalBalance(a), 0)
  return params.savings + investmentTotal
})

// 円グラフ用
const typeColors: Record<string, string> = {
  savings: '#94a3b8',
  nisa: '#3b82f6',
  ideco: '#22c55e',
  tokutei: '#f59e0b'
}

const pieData = computed(() => {
  const items: { value: number, name: string, itemStyle: { color: string }, gain: number, gainRate: string | null, contribution: number }[] = []

  if (params.savings > 0) {
    items.push({
      value: params.savings, name: '預貯金',
      itemStyle: { color: typeColors.savings },
      gain: 0, gainRate: null, contribution: params.savings
    })
  }

  for (const s of accountSummaries.value) {
    if (s.balance > 0) {
      items.push({
        value: s.balance, name: s.label,
        itemStyle: { color: typeColors[s.type] ?? '#6366f1' },
        gain: s.gain, gainRate: s.gainRate, contribution: s.contribution
      })
    }
  }

  return items
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
        if (item.contribution > 0 && item.name !== '預貯金') {
          const costMan = Math.round(item.contribution / 10000).toLocaleString()
          const gainMan = Math.round(item.gain / 10000).toLocaleString()
          const gainSign = item.gain >= 0 ? '+' : ''
          const gainColor = item.gain >= 0 ? '#22c55e' : '#ef4444'
          html += `元本: ${costMan}万円<br/>`
          html += `損益: <span style="color:${gainColor}">${gainSign}${gainMan}万円（${item.gainRate}）</span>`
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

const totalGain = computed(() =>
  accountSummaries.value.reduce((sum, a) => sum + a.gain, 0)
)

const totalContribution = computed(() =>
  accountSummaries.value.reduce((sum, a) => sum + a.contribution, 0)
)

const totalGainRate = computed(() =>
  calcGainRate(
    accountSummaries.value.reduce((sum, a) => sum + a.balance, 0),
    totalContribution.value
  )
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-wallet" />
          <h3 class="font-semibold">現在の資産</h3>
        </div>
        <span v-if="totalAssets > 0" class="text-sm font-semibold text-primary">
          合計: {{ Math.round(totalAssets / 10000).toLocaleString() }}万円
        </span>
      </div>
    </template>

    <div v-if="totalAssets > 0" class="space-y-4">
      <!-- 円グラフ -->
      <div v-if="pieOptions" class="h-[200px]">
        <VChart :option="pieOptions" autoresize class="w-full h-full" />
      </div>

      <!-- 投資サマリ -->
      <div v-if="totalContribution > 0" class="flex items-center justify-between text-xs border-t border-gray-100 dark:border-gray-800 pt-3">
        <span class="text-gray-500">投資合計損益</span>
        <span :class="totalGain >= 0 ? 'text-green-500' : 'text-red-500'" class="font-medium">
          {{ totalGainRate }}
          ({{ totalGain >= 0 ? '+' : '' }}{{ Math.round(totalGain / 10000).toLocaleString() }}万円)
        </span>
      </div>
    </div>

    <div v-else class="text-center py-6 text-gray-400">
      <UIcon name="i-lucide-wallet" class="text-3xl mb-2" />
      <p class="text-sm">預貯金や投資口座を設定すると資産状況が表示されます</p>
    </div>
  </UCard>
</template>
