<script setup lang="ts">
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-briefcase" />
        <h3 class="font-semibold">
          収入
        </h3>
        <InputHelpTip text="給与・パート・家賃収入など、年齢帯ごとの年間手取り額を設定します。\n年金・投資運用益は別途自動計算されるため含めません。\n引退後の収入も設定可能です。" />
      </div>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
        給与などの手取り収入を年齢帯ごとに設定します
      </p>
    </template>

    <div class="space-y-6">
      <div>
        <h4 class="text-sm font-medium mb-3">
          年齢別の年間収入
        </h4>
        <InputIncomeByAgeEditor />
      </div>

      <USeparator />

      <div>
        <h4 class="text-sm font-medium mb-3">
          特別収入（一時的な大きな入金）
        </h4>
        <InputSpecialIncomeEditor />
      </div>
    </div>
  </UCard>
</template>
