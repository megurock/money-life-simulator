<script setup lang="ts">
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- 入力パネル（1カラム時は2番目、2カラム時は左） -->
    <div class="order-2 md:order-1 space-y-4 md:overflow-y-auto md:max-h-[calc(100vh-8rem)] md:pr-2">
      <slot name="input" />
    </div>

    <!-- 結果パネル（1カラム時は1番目、2カラム時は右） -->
    <div class="order-1 md:order-2 space-y-4 md:overflow-y-auto md:max-h-[calc(100vh-8rem)] md:pr-2">
      <slot name="result" />
    </div>
  </div>
</template>
