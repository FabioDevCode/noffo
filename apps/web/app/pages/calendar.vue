<script setup lang="ts">
import type { Task } from '~/types/task'

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'noffo | Calendrier',
})

const { data: tasks, status: loadStatus, error: loadError, refresh } = useFetch<Task[]>('/api/tasks', {
  default: () => [],
})

const tasksWithDueDate = computed(() => tasks.value.filter(task => task.dueDate !== null))
</script>

<template>
  <PageContainer>
    <PageHeader>
      <template #title>
        Calendrier
      </template>
      <template #description>
        Visualisez les échéances de vos tâches.
      </template>
    </PageHeader>

    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      title="Impossible de charger vos tâches"
      description="Vérifiez votre connexion puis réessayez."
      icon="i-lucide-circle-alert"
    >
      <template #actions>
        <UButton
          color="error"
          variant="outline"
          icon="i-lucide-refresh-cw"
          label="Réessayer"
          @click="refresh()"
        />
      </template>
    </UAlert>

    <UEmpty
      v-else-if="loadStatus === 'pending'"
      title="Chargement des tâches"
      description="Nous récupérons vos échéances."
      icon="i-lucide-calendar-days"
      :loading="true"
    />

    <template v-else>
      <UAlert
        v-if="tasksWithDueDate.length === 0"
        color="neutral"
        variant="subtle"
        title="Aucune échéance à afficher"
        description="Les tâches avec une date d’échéance apparaîtront dans ce calendrier."
        icon="i-lucide-calendar-check"
      />

      <ClientOnly>

        <TaskCalendar :tasks="tasks" />

        <template #fallback>
          <div class="flex min-h-80 items-center justify-center rounded-lg border border-default text-sm text-muted">
            Chargement du calendrier…
          </div>
        </template>
      </ClientOnly>
    </template>
  </PageContainer>
</template>
