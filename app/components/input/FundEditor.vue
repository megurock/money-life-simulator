<script setup lang="ts">
import type { Fund } from '~/types/simulation'

const props = defineProps<{
  fund: Fund
  isNisa?: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const slotLabel = computed(() => {
  if (!props.isNisa || !props.fund.nisaSlot) return null
  return props.fund.nisaSlot === 'tsumitate' ? 'つみたて' : '成長'
})

const slotColor = computed(() => {
  if (!props.fund.nisaSlot) return 'neutral'
  return props.fund.nisaSlot === 'tsumitate' ? 'info' : 'success'
})
</script>

<template>
  <div class="space-y-1">
    <div v-if="slotLabel" class="mb-1">
      <UBadge :color="(slotColor as any)" variant="subtle" size="xs">
        {{ slotLabel }}
      </UBadge>
    </div>
    <div class="grid grid-cols-12 gap-2 items-end">
      <div class="col-span-4">
        <UFormField label="ファンド名" size="sm">
          <UInput
            v-model="props.fund.name"
            size="sm"
            placeholder="インデックスファンド"
          />
        </UFormField>
      </div>
      <div class="col-span-3">
        <UFormField label="月額積立" size="sm">
          <InputMoneyInput
            v-model="props.fund.monthlyContribution"
            size="sm"
          />
        </UFormField>
      </div>
      <div class="col-span-3">
        <UFormField label="期待利回り" size="sm">
          <UInput
            v-model.number="props.fund.expectedReturn"
            type="number"
            size="sm"
            :min="0"
            :max="30"
            :step="0.1"
          >
            <template #trailing>
              <span class="text-xs text-gray-500">%</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-2">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          @click="emit('remove', props.fund.id)"
        />
      </div>
    </div>
  </div>
</template>
