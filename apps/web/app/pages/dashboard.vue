<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
useHead({
  title: "noffo | Tableau de bord"
})
</script>

<template>
  <PageContainer>
    <PageHeader>
      <template #title>
        Tableau de bord
      </template>
      <template #description>
        Dashboard en cours de construction.
      </template>
    </PageHeader>


  </PageContainer>
</template>
