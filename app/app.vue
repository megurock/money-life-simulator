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

const title = '老後資金シミュレーター'
const description = '老後に向けた資金計画を可視化するシミュレーターです。NISA・iDeCo・年金・支出を考慮した資産推移を確認できます。'

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
