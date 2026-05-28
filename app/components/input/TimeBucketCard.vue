<script setup lang="ts">
const params = useSimulationParams()

const props = defineProps<{
  bucketId: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const bucket = computed(() => {
  const found = params.timeBuckets.find(b => b.id === props.bucketId)
  if (!found) throw new Error(`Bucket not found: ${props.bucketId}`)
  return found
})

function addEvent() {
  bucket.value.events.push({
    id: crypto.randomUUID(),
    description: '',
    amount: 500_000,
    age: bucket.value.fromAge,
    recurrence: 'once'
  })
}

function removeEvent(id: string) {
  const index = bucket.value.events.findIndex(e => e.id === id)
  if (index >= 0) bucket.value.events.splice(index, 1)
}

const totalCost = computed(() => {
  let total = 0
  for (const event of bucket.value.events) {
    if (event.recurrence === 'once') {
      total += event.amount
    } else {
      const years = bucket.value.toAge - event.age + 1
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
            <span class="text-xs text-gray-600">歳</span>
          </template>
        </UInput>
        <span class="text-gray-600">〜</span>
        <UInput
          v-model.number="bucket.toAge"
          type="number"
          size="xs"
          class="w-20"
        >
          <template #trailing>
            <span class="text-xs text-gray-600">歳</span>
          </template>
        </UInput>
        <UInput
          v-model="bucket.title"
          placeholder="タイトル（例: 自由な時間）"
          variant="none"
          class="font-medium"
        />
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="totalCost > 0"
          class="text-xs text-gray-600"
        >
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
        :bucket-id="bucket.id"
        :event-id="event.id"
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
