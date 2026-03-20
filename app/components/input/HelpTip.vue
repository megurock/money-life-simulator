<script setup lang="ts">
const props = defineProps<{
  text: string
}>()

const formattedHtml = computed(() => {
  const escaped = props.text
    .replace(/\\n/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const withLinks = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
  )

  return withLinks.replace(/\n/g, '<br>')
})
</script>

<template>
  <UTooltip
    :delay-duration="100"
    :content="{ side: 'top', sideOffset: 8 }"
    :ui="{ content: '!h-auto px-3 py-2' }"
  >
    <UIcon name="i-lucide-circle-help" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-default text-sm" />

    <template #content>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="max-w-xs text-xs" v-html="formattedHtml" />
    </template>
  </UTooltip>
</template>
