<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'ja'
  }
})

const title = 'お金と暮らしのシミュレーター'
const description = 'お金の使いどきを見つけて、豊かな人生を描こう。収入・支出・資産の流れを可視化し、NISA・iDeCo・年金を考慮した資産推移を確認できます。'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
