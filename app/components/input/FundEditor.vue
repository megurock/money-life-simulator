<script setup lang="ts">
import { NISA_LIMITS, IDECO_MONTHLY_LIMIT } from '~/utils/constants'

const params = useSimulationParams()

const props = defineProps<{
  accountId: string
  fundId: string
  isNisa?: boolean
  accountType?: string
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

const fund = computed(() => {
  const acc = params.accounts.find(a => a.id === props.accountId)
  const found = acc?.funds.find(f => f.id === props.fundId)
  if (!found) throw new Error(`Fund not found: ${props.fundId}`)
  return found
})

const slotLabel = computed(() => {
  if (!props.isNisa || !fund.value.nisaSlot) return null
  return fund.value.nisaSlot === 'tsumitate' ? 'つみたて' : '成長'
})

const slotColor = computed(() => {
  if (!fund.value.nisaSlot) return 'neutral'
  return fund.value.nisaSlot === 'tsumitate' ? 'info' : 'success'
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
  if (fund.value.nisaSlot === 'tsumitate') return NISA_LIMITS.tsumitate / 12
  if (fund.value.nisaSlot === 'growth') return NISA_LIMITS.growth / 12
  if (props.accountType === 'ideco') return IDECO_MONTHLY_LIMIT
  return undefined
})
</script>

<template>
  <div class="space-y-1">
    <div
      v-if="slotLabel"
      class="flex items-center justify-between mb-1"
    >
      <UBadge
        :color="(slotColor as any)"
        variant="subtle"
        size="xs"
      >
        {{ slotLabel }}
      </UBadge>
      <UButton
        v-if="isNisa"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="xs"
        @click="emit('remove', fund.id)"
      />
    </div>

    <!-- NISA: 3列均等（現在までのレイアウトに合わせる） -->
    <div
      v-if="isNisa"
      class="grid grid-cols-3 gap-3"
    >
      <UFormField label="ファンド名">
        <UInput
          v-model="fund.name"
          placeholder="例: S&P500"
        />
      </UFormField>
      <UFormField label="月額積立">
        <InputMoneyInput
          v-model="fund.monthlyContribution"
          :max="monthlyMax"
        />
      </UFormField>
      <UFormField label="利回り">
        <UInput
          v-model.number="fund.expectedReturn"
          type="number"
          :min="0"
          :max="30"
          :step="0.1"
        >
          <template #trailing>
            <span class="text-xs text-gray-600">%</span>
          </template>
        </UInput>
      </UFormField>
    </div>

    <!-- iDeCo / 特定口座: 4列（ファンド名・月額・利回り・終了） + 削除 -->
    <div
      v-else
      class="grid grid-cols-12 gap-2 items-end"
    >
      <div class="col-span-4">
        <UFormField label="ファンド名">
          <UInput
            v-model="fund.name"
            placeholder="例: S&P500"
          />
        </UFormField>
      </div>
      <div class="col-span-3">
        <UFormField label="月額積立">
          <InputMoneyInput
            v-model="fund.monthlyContribution"
            :max="monthlyMax"
          />
        </UFormField>
      </div>
      <div class="col-span-2">
        <UFormField label="利回り">
          <UInput
            v-model.number="fund.expectedReturn"
            type="number"
            :min="0"
            :max="30"
            :step="0.1"
          >
            <template #trailing>
              <span class="text-xs text-gray-600">%</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-2">
        <UFormField label="終了">
          <UInput
            v-model.number="fund.endAge"
            type="number"
            :placeholder="String(defaultEndAge)"
            :min="params.basicInfo.currentAge"
            :max="endAgeMax"
          >
            <template #trailing>
              <span class="text-xs text-gray-600">歳</span>
            </template>
          </UInput>
        </UFormField>
      </div>
      <div class="col-span-1">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          @click="emit('remove', fund.id)"
        />
      </div>
    </div>
  </div>
</template>
