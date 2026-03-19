<script setup lang="ts">
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-receipt" />
        <h3 class="font-semibold">支出設定</h3>
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
