<script setup lang="ts">
import type { TimeBucket } from '~/types/simulation'

const props = defineProps<{
  bucket: TimeBucket
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

function addEvent() {
  props.bucket.events.push({
    id: crypto.randomUUID(),
    description: '',
    amount: 500_000,
    age: props.bucket.fromAge,
    recurrence: 'once'
  })
}

function removeEvent(id: string) {
  const index = props.bucket.events.findIndex(e => e.id === id)
  if (index >= 0) props.bucket.events.splice(index, 1)
}

const totalCost = computed(() => {
  let total = 0
  for (const event of props.bucket.events) {
    if (event.recurrence === 'once') {
      total += event.amount
    } else {
      const years = props.bucket.toAge - event.age + 1
      const count = event.recurrence === 'yearly' ? years : Math.ceil(years / 2)
      total += event.amount * count
    }
  }
  return total
})

function formatMoney(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億`
  if (value >= 10_000) return `${Math.round(value / 10_000).toLocaleString()}万`
  return value.toLocaleString()
}
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UInput
          v-model.number="bucket.fromAge"
          type="number"
          size="xs"
          class="w-20"
        >
          <template #trailing>
            <span class="text-xs text-gray-500">歳</span>
          </template>
        </UInput>
        <span class="text-gray-400">〜</span>
        <UInput
          v-model.number="bucket.toAge"
          type="number"
          size="xs"
          class="w-20"
        >
          <template #trailing>
            <span class="text-xs text-gray-500">歳</span>
          </template>
        </UInput>
        <UInput
          v-model="bucket.title"
          size="sm"
          placeholder="タイトル（例: 自由な時間）"
          variant="none"
          class="font-medium"
        />
      </div>
      <div class="flex items-center gap-2">
        <span v-if="totalCost > 0" class="text-xs text-gray-500">
          合計: {{ formatMoney(totalCost) }}円
        </span>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          @click="emit('remove', bucket.id)"
        />
      </div>
    </div>

    <div class="space-y-2">
      <InputBucketEventEditor
        v-for="event in bucket.events"
        :key="event.id"
        :event="event"
        :from-age="bucket.fromAge"
        :to-age="bucket.toAge"
        @remove="removeEvent"
      />
    </div>

    <UButton
      icon="i-lucide-plus"
      label="イベント追加"
      variant="soft"
      size="xs"
      @click="addEvent"
    />
  </div>
</template>
