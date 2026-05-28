<script setup lang="ts">
const params = useSimulationParams()

const props = defineProps<{
  bucketId: string
  eventId: string
  fromAge: number
  toAge: number
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const event = computed(() => {
  const bucket = params.timeBuckets.find(b => b.id === props.bucketId)
  const found = bucket?.events.find(e => e.id === props.eventId)
  if (!found) throw new Error(`Event not found: ${props.eventId}`)
  return found
})

const recurrenceOptions = [
  { label: '一回きり', value: 'once' },
  { label: '毎年', value: 'yearly' },
  { label: '隔年', value: 'biennial' }
]
</script>

<template>
  <div class="grid grid-cols-12 gap-2 items-end">
    <div class="col-span-3">
      <UFormField label="内容">
        <UInput
          v-model="event.description"
          placeholder="家族でハワイ旅行"
        />
      </UFormField>
    </div>
    <div class="col-span-3">
      <UFormField label="金額">
        <InputMoneyInput
          v-model="event.amount"
        />
      </UFormField>
    </div>
    <div class="col-span-2">
      <UFormField label="年齢">
        <UInput
          v-model.number="event.age"
          type="number"
          :min="fromAge"
          :max="toAge"
        >
          <template #trailing>
            <span class="text-xs text-gray-600">歳</span>
          </template>
        </UInput>
      </UFormField>
    </div>
    <div class="col-span-3">
      <UFormField label="繰り返し">
        <USelect
          v-model="event.recurrence"
          :items="recurrenceOptions"
        />
      </UFormField>
    </div>
    <div class="col-span-1">
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        @click="emit('remove', event.id)"
      />
    </div>
  </div>
</template>
