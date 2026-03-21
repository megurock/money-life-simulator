<script setup lang="ts">
const params = useSimulationParams()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-user" />
        <h3 class="font-semibold">基本情報</h3>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">シミュレーションの基準となる年齢を設定します</p>
    </template>

    <div class="grid grid-cols-3 gap-4">
      <UFormField label="現在の年齢">
        <UInput
          v-model.number="params.basicInfo.currentAge"
          type="number"
          :min="18"
          :max="80"
        />
      </UFormField>

      <UFormField>
        <template #label>
          <span class="flex items-center gap-1">
            引退年齢
            <InputHelpTip text="日本企業の定年年齢（2024年度）\n60歳: 64.4% / 65歳: 25.2%\n\n2025年4月より65歳までの雇用確保が完全義務化。\n70歳までの就業確保措置の実施企業は34.8%。\n\n出典: [厚生労働省 高年齢者雇用状況等報告](https://www.mhlw.go.jp/stf/newpage_66853.html)" />
          </span>
        </template>
        <UInput
          v-model.number="params.basicInfo.retirementAge"
          type="number"
          :min="params.basicInfo.currentAge + 1"
          :max="80"
        />
      </UFormField>

      <UFormField>
        <template #label>
          <span class="flex items-center gap-1">
            想定寿命
            <InputHelpTip text="日本人の平均寿命（2024年）\n男性: 81.09歳 / 女性: 87.13歳\n\n将来推計（2070年）\n男性 85.89歳 / 女性 91.94歳\n\n出典: [厚生労働省 令和6年簡易生命表](https://www.mhlw.go.jp/toukei/saikin/hw/life/life24/index.html)\n[国立社会保障・人口問題研究所 将来推計人口](https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp)" />
          </span>
        </template>
        <UInput
          v-model.number="params.basicInfo.lifeExpectancy"
          type="number"
          :min="params.basicInfo.retirementAge"
          :max="120"
        />
      </UFormField>
    </div>
  </UCard>
</template>
