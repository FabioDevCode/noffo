<script setup lang="ts">
definePageMeta({
  layout: false
})
await navigateTo('/dashboard', { redirectCode: 302 })
</script>

<template>
  <main class="flex min-h-screen items-center justify-center">
    <p>Redirection…</p>
  </main>
</template>
