<script setup lang="ts">
const props = defineProps<{
  text: string
}>()

const formattedText = computed(() => props.text.replace(/\\n/g, '\n'))
</script>

<template>
  <UTooltip
    :delay-duration="100"
    :content="{ side: 'top', sideOffset: 8 }"
    :ui="{ content: '!h-auto px-3 py-2' }"
  >
    <UIcon name="i-lucide-circle-help" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-default text-sm" />

    <template #content>
      <p class="max-w-xs whitespace-pre-line text-xs">{{ formattedText }}</p>
    </template>
  </UTooltip>
</template>
