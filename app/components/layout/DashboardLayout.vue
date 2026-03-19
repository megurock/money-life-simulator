<script setup lang="ts">
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 左: 入力パネル -->
    <div class="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
      <slot name="input" />
    </div>

    <!-- 右: 結果パネル -->
    <div class="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
      <slot name="result" />
    </div>
  </div>
</template>
