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
  max: 9_999_999_999,
  size: 'md',
  unit: '円'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const editing = ref(false)
const rawInput = ref('')

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.toLocaleString('ja-JP')
})

const effectivePlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  if (props.max < 9_999_999_999) return `上限 ${props.max.toLocaleString('ja-JP')}`
  return ''
})

function onFocus() {
  editing.value = true
  rawInput.value = (!props.modelValue || props.modelValue === 0) ? '' : String(props.modelValue)
}

function onInput(val: string) {
  rawInput.value = val.replace(/[^0-9]/g, '')
}

function onBlur() {
  editing.value = false
  const num = Number(rawInput.value)
  if (!isNaN(num)) {
    const clamped = Math.min(Math.max(num, props.min), props.max)
    emit('update:modelValue', clamped)
  }
}
</script>

<template>
  <UInput
    :model-value="editing ? rawInput : displayValue"
    @update:model-value="onInput"
    @focus="onFocus"
    @blur="onBlur"
    inputmode="numeric"
    :size="size"
    :placeholder="effectivePlaceholder"
  >
    <template #trailing>
      <span :class="size === 'sm' ? 'text-xs' : 'text-sm'" class="text-gray-500">{{ unit }}</span>
    </template>
  </UInput>
</template>
