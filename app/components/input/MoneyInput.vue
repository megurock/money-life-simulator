<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  placeholder?: string
  unit?: string
}>(), {
  min: 0,
  size: 'md',
  unit: '円'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const displayValue = computed({
  get: () => {
    if (props.modelValue === 0 || props.modelValue === undefined) return ''
    return props.modelValue.toLocaleString('ja-JP')
  },
  set: (val: string) => {
    const num = Number(val.replace(/,/g, ''))
    if (!isNaN(num)) {
      const clamped = props.max !== undefined ? Math.min(num, props.max) : num
      emit('update:modelValue', Math.max(props.min, clamped))
    }
  }
})
</script>

<template>
  <UInput
    :model-value="displayValue"
    @update:model-value="displayValue = $event"
    inputmode="numeric"
    :size="size"
    :placeholder="placeholder"
  >
    <template #trailing>
      <span :class="size === 'sm' ? 'text-xs' : 'text-sm'" class="text-gray-500">{{ unit }}</span>
    </template>
  </UInput>
</template>
