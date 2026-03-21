<script setup lang="ts">
import type { BucketEvent } from '~/types/simulation'

defineProps<{
  event: BucketEvent
  fromAge: number
  toAge: number
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const recurrenceOptions = [
  { label: '一回きり', value: 'once' },
  { label: '毎年', value: 'yearly' },
  { label: '隔年', value: 'biennial' }
]
</script>

<template>
  <div class="grid grid-cols-12 gap-2 items-end">
    <div class="col-span-3">
      <UFormField label="内容" size="sm">
        <UInput
          v-model="event.description"
          size="sm"
          placeholder="家族でハワイ旅行"
        />
      </UFormField>
    </div>
    <div class="col-span-3">
      <UFormField label="金額" size="sm">
        <InputMoneyInput
          v-model="event.amount"
          size="sm"
        />
      </UFormField>
    </div>
    <div class="col-span-2">
      <UFormField label="年齢" size="sm">
        <UInput
          v-model.number="event.age"
          type="number"
          size="sm"
          :min="fromAge"
          :max="toAge"
        >
          <template #trailing>
            <span class="text-xs text-gray-500">歳</span>
          </template>
        </UInput>
      </UFormField>
    </div>
    <div class="col-span-3">
      <UFormField label="繰り返し" size="sm">
        <USelect
          v-model="event.recurrence"
          :items="recurrenceOptions"
          size="sm"
        />
      </UFormField>
    </div>
    <div class="col-span-1">
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="sm"
        @click="emit('remove', event.id)"
      />
    </div>
  </div>
</template>
