import { computed } from 'vue'
import type { YearlyResult } from '~/types/simulation'
import type { ComputedRef } from 'vue'

type AxisTooltipParam = {
  axisValue: string | number
  value: number
  marker: string
  seriesName: string
}

export function useChartOptions(yearlyResults: ComputedRef<YearlyResult[]>) {
  const chartOptions = computed(() => {
    const results = yearlyResults.value
    if (results.length === 0) return {}

    const ages = results.map(r => `${r.age}歳`)
    const balances = results.map(r => r.totalBalance)
    const incomes = results.map(r => r.totalIncome)
    const expenses = results.map(r => r.totalExpense)

    // 資産枯渇ポイント
    const depletionIndex = results.findIndex(r => r.isDepleted)

    return {
      tooltip: {
        trigger: 'axis',
        formatter(params: AxisTooltipParam[]) {
          if (!params?.length) return ''
          const age = params[0]!.axisValue
          let html = `<strong>${age}</strong><br/>`
          for (const p of params) {
            const value = (p.value / 10000).toFixed(0)
            html += `${p.marker} ${p.seriesName}: ${Number(value).toLocaleString()}万円<br/>`
          }
          return html
        }
      },
      legend: {
        data: ['総資産', '年間収入', '年間支出'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ages,
        axisLabel: {
          interval(index: number) {
            const age = results[index]?.age ?? 0
            return age % 5 === 0
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter(value: number) {
            return `${(value / 10000).toFixed(0)}万`
          }
        }
      },
      series: [
        {
          name: '総資産',
          type: 'line',
          data: balances,
          smooth: true,
          lineStyle: { width: 3 },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.3)' },
                { offset: 1, color: 'rgba(59,130,246,0.02)' }
              ]
            }
          },
          markLine: depletionIndex >= 0
            ? {
                silent: true,
                data: [{ xAxis: depletionIndex }],
                lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
                label: { formatter: '資産枯渇', color: '#ef4444' }
              }
            : undefined
        },
        {
          name: '年間収入',
          type: 'line',
          data: incomes,
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#22c55e' }
        },
        {
          name: '年間支出',
          type: 'line',
          data: expenses,
          smooth: true,
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#f97316' }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ]
    }
  })

  return { chartOptions }
}
