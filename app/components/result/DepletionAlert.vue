<script setup lang="ts">
const props = defineProps<{
  depletionAge: number | null
  lifeExpectancy: number
  finalBalance: number
  isEmpty: boolean
}>()

const yearsShort = computed(() => {
  if (props.depletionAge === null) return 0
  return props.lifeExpectancy - props.depletionAge
})
</script>

<template>
  <!-- 未入力状態: ウェルカムメッセージ -->
  <div
    v-if="isEmpty"
    class="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-4"
  >
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-hand-helping"
        class="text-gray-600 dark:text-gray-400 text-xl flex-shrink-0 mt-0.5"
      />
      <div>
        <h4 class="font-semibold text-gray-700 dark:text-gray-300">
          はじめましょう
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          収入や資産の情報を入力すると、将来のお金の流れをシミュレーションできます。
        </p>
      </div>
    </div>
  </div>

  <!-- 資産枯渇 -->
  <div
    v-else-if="depletionAge !== null"
    class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4"
  >
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-alert-triangle"
        class="text-red-500 text-xl flex-shrink-0 mt-0.5"
      />
      <div>
        <h4 class="font-semibold text-red-700 dark:text-red-400">
          資産枯渇の警告
        </h4>
        <p class="text-sm text-red-600 dark:text-red-300 mt-1">
          <strong>{{ depletionAge }}歳</strong>で資産が枯渇する見込みです。
          想定寿命の{{ lifeExpectancy }}歳まで<strong>{{ yearsShort }}年</strong>不足します。
        </p>
        <ul class="text-xs text-red-500 dark:text-red-400 mt-2 space-y-1">
          <li>・積立額の増額や支出の削減を検討してください</li>
          <li>・引退年齢の延長も有効です</li>
          <li>・年金の繰下げ受給で受給額を増やせます</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- 資産枯渇なし -->
  <div
    v-else
    class="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4"
  >
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-check-circle"
        class="text-green-500 text-xl flex-shrink-0 mt-0.5"
      />
      <div>
        <h4 class="font-semibold text-green-700 dark:text-green-400">
          資産は枯渇しません
        </h4>
        <p class="text-sm text-green-600 dark:text-green-300 mt-1">
          {{ lifeExpectancy }}歳時点の残高: <strong>{{ Math.round(finalBalance / 10000).toLocaleString() }}万円</strong>
        </p>
      </div>
    </div>
  </div>
</template>
