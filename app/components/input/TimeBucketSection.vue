<script setup lang="ts">
const params = useSimulationParams()

const hasBuckets = computed(() => params.timeBuckets.length > 0)

function generateBuckets() {
  const { currentAge, lifeExpectancy } = params.basicInfo
  const buckets = []

  for (let from = currentAge; from < lifeExpectancy; from += 10) {
    const to = Math.min(from + 9, lifeExpectancy)
    buckets.push({
      id: crypto.randomUUID(),
      fromAge: from,
      toAge: to,
      title: '',
      events: []
    })
  }

  params.timeBuckets = buckets
}

function removeBucket(id: string) {
  const index = params.timeBuckets.findIndex(b => b.id === id)
  if (index >= 0) params.timeBuckets.splice(index, 1)
}

function clearBuckets() {
  params.timeBuckets = []
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-sparkles" />
        <h3 class="font-semibold">思い出づくりプラン</h3>
        <InputHelpTip text="人生を10年ごとのフェーズに分け、各フェーズでやりたいことと費用を登録します。\n登録したイベントは自動的にシミュレーションの特別支出に反映されます。" />
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        年代ごとにやりたいことを計画し、必要な費用をシミュレーションに反映します
      </p>
    </template>

    <div class="space-y-4">
      <div v-if="!hasBuckets" class="text-center py-6">
        <p class="text-sm text-gray-500 mb-3">
          年代ごとのフェーズを作成して、やりたいことを計画しましょう
        </p>
        <UButton
          icon="i-lucide-sparkles"
          label="フェーズを生成"
          variant="soft"
          @click="generateBuckets"
        />
      </div>

      <template v-else>
        <div class="space-y-3">
          <InputTimeBucketCard
            v-for="bucket in params.timeBuckets"
            :key="bucket.id"
            :bucket="bucket"
            @remove="removeBucket"
          />
        </div>

        <div class="flex justify-end">
          <UButton
            icon="i-lucide-rotate-ccw"
            label="すべてクリア"
            variant="ghost"
            color="error"
            size="sm"
            @click="clearBuckets"
          />
        </div>
      </template>
    </div>
  </UCard>
</template>
