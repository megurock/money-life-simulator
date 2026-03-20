<script setup lang="ts">
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-receipt" />
        <h3 class="font-semibold">支出設定</h3>
        <InputHelpTip text="年齢帯ごとの月額生活費を設定します。\n投資の積立額は含めません（資産セクションで別途設定）。\n\n【参考】月間消費支出の平均（2024年・二人以上世帯）\n40歳未満: 約28.0万円\n40〜49歳: 約33.1万円\n50〜59歳: 約35.7万円\n60〜69歳: 約31.1万円\n70歳以上: 約25.3万円\n※単身世帯は平均 約17.0万円\n※家計調査の消費支出にも投資・貯蓄は含まれていません\n\n出典: [総務省 家計調査](https://www.stat.go.jp/data/kakei/sokuhou/tsuki/index.html)" />
      </div>
    </template>

    <div class="space-y-6">
      <div>
        <h4 class="text-sm font-medium mb-3">年齢別の月額生活費</h4>
        <InputExpenseByAgeEditor />
      </div>

      <USeparator />

      <div>
        <h4 class="text-sm font-medium mb-3">特別支出（一時的な大きな出費）</h4>
        <InputSpecialExpenseEditor />
      </div>
    </div>
  </UCard>
</template>
