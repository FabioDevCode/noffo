<script setup lang="ts">

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'noffo | Nouvelle tâche',
})

</script>

<template>
  <PageContainer>
    <PageHeader>
      <template #title>
        Nouvelle tâche
      </template>
      <template #description>
        Créez une nouvelle tâche.
      </template>

      <template #actions>
        <!-- <UButton
          to="/tasks/new"
          icon="i-lucide-plus"
          label="Nouvelle tâche"
          class="w-fit"
        /> -->
      </template>
    </PageHeader>






  </PageContainer>
</template>