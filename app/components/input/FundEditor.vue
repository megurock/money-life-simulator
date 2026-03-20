<script setup lang="ts">
import type { Fund } from '~/types/simulation'
import { NISA_LIMITS, IDECO_MONTHLY_LIMIT } from '~/utils/constants'

const params = useSimulationParams()

const props = defineProps<{
  fund: Fund
  isNisa?: boolean
  accountType?: string
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

const IDECO_MAX_AGE = 65

const defaultEndAge = computed(() =>
  props.accountType === 'ideco'
    ? Math.min(params.basicInfo.retirementAge, IDECO_MAX_AGE)
    : params.basicInfo.retirementAge
)

const endAgeMax = computed(() =>
  props.accountType === 'ideco' ? IDECO_MAX_AGE : params.basicInfo.lifeExpectancy
)

const monthlyMax = computed(() => {
  if (props.fund.nisaSlot === 'tsumitate') return NISA_LIMITS.tsumitate / 12
  if (props.fund.nisaSlot === 'growth') return NISA_LIMITS.growth / 12
  if (props.accountType === 'ideco') return IDECO_MONTHLY_LIMIT
  return undefined
})
</script>

<template>
  <div class="space-y-1">
    <div v-if="slotLabel" class="flex items-center justify-between mb-1">
      <UBadge :color="(slotColor as any)" variant="subtle" size="xs">
        {{ slotLabel }}
      </UBadge>
      <UButton
        v-if="isNisa"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        @click="emit('remove', props.fund.id)"
      />
    </div>

    <!-- NISA: 3列均等（現在までのレイアウトに合わせる） -->
    <div v-if="isNisa" class="grid grid-cols-3 gap-3">
      <UFormField label="ファンド名" size="sm">
        <UInput
          v-model="props.fund.name"
          size="sm"
          placeholder="例: S&P500"
        />
      </UFormField>
      <UFormField label="月額積立" size="sm">
        <InputMoneyInput
          v-model="props.fund.monthlyContribution"
          size="sm"
          :max="monthlyMax"
        />
      </UFormField>
      <UFormField label="利回り" size="sm">
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

    <!-- iDeCo / 特定口座: 4列（ファンド名・月額・利回り・終了） + 削除 -->
    <div v-else class="grid grid-cols-12 gap-2 items-end">
      <div class="col-span-4">
        <UFormField label="ファンド名" size="sm">
          <UInput
            v-model="props.fund.name"
            size="sm"
            placeholder="例: S&P500"
          />
        </UFormField>
      </div>
      <div class="col-span-3">
        <UFormField label="月額積立" size="sm">
          <InputMoneyInput
            v-model="props.fund.monthlyContribution"
            size="sm"
            :max="monthlyMax"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UFormField label="利回り" size="sm">
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
        <UFormField label="終了" size="sm">
          <UInput
            v-model.number="props.fund.endAge"
            type="number"
            size="sm"
            :placeholder="String(defaultEndAge)"
            :min="params.basicInfo.currentAge"
            :max="endAgeMax"
          >
            <template #trailing>
              <span class="text-xs text-gray-500">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-1">
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
