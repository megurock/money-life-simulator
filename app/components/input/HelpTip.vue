<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <UTooltip :text="text" :content="{ side: 'top', sideOffset: 8 }">
    <UIcon name="i-lucide-circle-help" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help text-sm" />
  </UTooltip>
</template>
