<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
useHead({
  title: "noffo | Tableau de bord"
})
</script>

<template>
  <main class="flex-1 overflow-auto p-6">
    <h1 class="text-2xl font-semibold mb-2">Home</h1>
    <p class="text-sm text-muted">Dashboard en cours de construction.</p>
  </main>
</template>
