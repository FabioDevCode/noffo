<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

type TaskStatus = 'pending' | 'in_progress'
type TaskFilter = 'all' | TaskStatus

interface Task {
  id: string
  title: string
  shortDescription: string | null
  status: TaskStatus
  dueDate: string | null
  remindAt: string | null
}

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'noffo | Mes tâches',
})

const { data: tasks, status: loadStatus, error: loadError, refresh } = useFetch<Task[]>('/api/tasks', {
  default: () => [],
})

const toast = useToast()
const statusFilter = ref<TaskFilter>('all')
const currentPage = ref(1)
const pageSize = ref(10)
const actionTaskId = ref<string | null>(null)
const taskToDelete = ref<Task | null>(null)
const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)

const pageSizeOptions = [
  { label: '10 par page', value: 10 },
  { label: '25 par page', value: 25 },
  { label: '50 par page', value: 50 },
]

const filters: { label: string, value: TaskFilter }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'À faire', value: 'pending' },
  { label: 'En cours', value: 'in_progress' },
]

const columns: TableColumn<Task>[] = [
  { accessorKey: 'status', header: 'Statut' },
  { accessorKey: 'title', header: 'Tâche' },
  { accessorKey: 'dueDate', header: 'Échéance' },
  { accessorKey: 'remindAt', header: 'Rappel' },
  { id: 'actions', header: '' },
]

const filteredTasks = computed(() => {
  if (statusFilter.value === 'all') {
    return tasks.value
  }

  return tasks.value.filter(task => task.status === statusFilter.value)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredTasks.value.length / pageSize.value)))
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})
const firstVisibleTask = computed(() => filteredTasks.value.length === 0
  ? 0
  : (currentPage.value - 1) * pageSize.value + 1)
const lastVisibleTask = computed(() => Math.min(currentPage.value * pageSize.value, filteredTasks.value.length))

watch([statusFilter, pageSize], () => {
  currentPage.value = 1
})

watch(pageCount, (count) => {
  if (currentPage.value > count) {
    currentPage.value = count
  }
})

function countForFilter(filter: TaskFilter): number {
  if (filter === 'all') {
    return tasks.value.length
  }

  return tasks.value.filter(task => task.status === filter).length
}

function parseDate(value: string): Date | null {
  const parts = value.split('-')

  if (parts.length !== 3 || parts.some(part => !/^\d+$/.test(part))) {
    return null
  }

  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null
  }

  return date
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-'
  }

  const date = parseDate(value)

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate) {
    return false
  }

  const dueDate = parseDate(task.dueDate)

  if (!dueDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return dueDate < today
}

function actionItems(task: Task): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [
    {
      label: 'Voir le détail',
      icon: 'i-lucide-eye',
      to: `/tasks/${task.id}`,
    },
    {
      label: 'Modifier',
      icon: 'i-lucide-pencil',
      to: `/tasks/${task.id}/edit`,
    },
    { type: 'separator' },
  ]

  if (task.status === 'pending') {
    items.push({
      label: 'Passer en cours',
      icon: 'i-lucide-play',
      onSelect: () => updateStatus(task, 'in_progress'),
    })
  }

  items.push(
    {
      label: 'Terminer',
      icon: 'i-lucide-check',
      onSelect: () => updateStatus(task, 'completed'),
    },
    { type: 'separator' },
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => askToDelete(task),
    },
  )

  return items
}

async function updateStatus(task: Task, nextStatus: TaskStatus | 'completed') {
  if (actionTaskId.value) {
    return
  }

  actionTaskId.value = task.id

  try {
    await $fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      body: { status: nextStatus },
    })
  }
  catch {
    toast.add({
      title: 'La modification a échoué',
      description: 'Réessayez dans un instant.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    })
    return
  }
  finally {
    actionTaskId.value = null
  }

  toast.add({
    title: nextStatus === 'completed' ? 'Tâche terminée' : 'Tâche passée en cours',
    description: task.title,
    color: 'success',
    icon: 'i-lucide-circle-check',
  })

  await refresh()
}

function askToDelete(task: Task) {
  taskToDelete.value = task
  isDeleteModalOpen.value = true
}

async function deleteTask() {
  if (!taskToDelete.value || isDeleting.value) {
    return
  }

  const task = taskToDelete.value
  isDeleting.value = true

  try {
    await $fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
  }
  catch {
    toast.add({
      title: 'La suppression a échoué',
      description: 'La tâche est peut-être déjà supprimée. Réessayez.',
      color: 'error',
      icon: 'i-lucide-circle-alert',
    })
    return
  }
  finally {
    isDeleting.value = false
  }

  isDeleteModalOpen.value = false
  taskToDelete.value = null

  toast.add({
    title: 'Tâche supprimée',
    description: task.title,
    color: 'success',
    icon: 'i-lucide-circle-check',
  })

  await refresh()
}
</script>

<template>
  <div class="mx-auto w-full max-w-7xl space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Mes tâches
        </h1>
        <p class="mt-1 text-sm text-muted">
          Retrouvez vos tâches actives et leurs prochaines échéances.
        </p>
      </div>

      <UButton
        to="/tasks/new"
        icon="i-lucide-plus"
        label="Nouvelle tâche"
        class="w-fit"
      />
    </div>

    <UEmpty
      v-if="loadStatus === 'pending'"
      title="Chargement des tâches"
      description="Nous récupérons vos tâches actives."
      icon="i-lucide-list-todo"
      :loading="true"
    />

    <UAlert
      v-else-if="loadError"
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
      v-else-if="tasks.length === 0"
      title="Aucune tâche active"
      description="Les tâches que vous créerez apparaîtront ici."
      icon="i-lucide-list-checks"
    >
      <template #actions>
        <UButton
          to="/tasks/new"
          icon="i-lucide-plus"
          label="Créer une tâche"
        />
      </template>
    </UEmpty>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrer les tâches par statut">
          <UButton
            v-for="filter in filters"
            size="sm"
            :key="filter.value"
            :label="`${filter.label} (${countForFilter(filter.value)})`"
            :color="statusFilter === filter.value ? 'primary' : 'neutral'"
            :variant="statusFilter === filter.value ? 'solid' : 'outline'"
            :aria-pressed="statusFilter === filter.value"
            @click="statusFilter = filter.value"
          />
        </div>
      </div>

      <UEmpty
        v-if="filteredTasks.length === 0"
        title="Aucune tâche dans ce statut"
        description="Choisissez un autre filtre pour afficher vos tâches."
        icon="i-lucide-list-filter"
      />

      <div v-else class="max-h-[65vh] max-w-full overflow-auto rounded-lg border border-default">
        <UTable
          :data="paginatedTasks"
          :columns="columns"
          class="min-w-190"
          sticky="header"
          empty="Aucune tâche à afficher."
        >
          <template #status-cell="{ row }">
            <UBadge
              :color="row.original.status === 'pending' ? 'neutral' : 'primary'"
              variant="subtle"
            >
              {{ row.original.status === 'pending' ? 'À faire' : 'En cours' }}
            </UBadge>
          </template>

          <template #title-cell="{ row }">
            <div class="min-w-48 py-1">
              <ULink
                :to="`/tasks/${row.original.id}`"
                class="font-medium text-highlighted hover:underline"
              >
                {{ row.original.title }}
              </ULink>
              <p v-if="row.original.shortDescription" class="mt-1 line-clamp-2 text-sm text-muted">
                {{ row.original.shortDescription }}
              </p>
            </div>
          </template>

          <template #dueDate-cell="{ row }">
            <span
              v-if="row.original.dueDate"
              :class="isOverdue(row.original) ? 'font-medium text-error' : 'text-default'"
            >
              {{ formatDate(row.original.dueDate) }}
              <span v-if="isOverdue(row.original)" class="block text-xs">En retard</span>
            </span>
            <span v-else class="text-sm text-muted">Aucune échéance</span>
          </template>

          <template #remindAt-cell="{ row }">
            <span v-if="row.original.remindAt" class="text-default">
              {{ formatDate(row.original.remindAt) }}
            </span>
            <span v-else class="text-sm text-muted">-</span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end">
              <UDropdownMenu :items="actionItems(row.original)" :content="{ align: 'end' }">
                <UButton
                  icon="i-lucide-ellipsis"
                  color="neutral"
                  variant="ghost"
                  :aria-label="`Actions pour ${row.original.title}`"
                  :disabled="actionTaskId !== null"
                />
              </UDropdownMenu>
            </div>
          </template>
        </UTable>
      </div>

      <div v-if="filteredTasks.length > 0" class="flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted sm:justify-start">
          <span>
            {{ firstVisibleTask }}–{{ lastVisibleTask }} sur {{ filteredTasks.length }} tâche{{ filteredTasks.length > 1 ? 's' : '' }}
          </span>
          <USelect
            v-model="pageSize"
            :items="pageSizeOptions"
            aria-label="Nombre de tâches par page"
            class="w-36"
          />
        </div>

        <div class="max-w-full overflow-x-auto">
          <UPagination
            v-model:page="currentPage"
            :items-per-page="pageSize"
            :total="filteredTasks.length"
            :show-edges="true"
            :sibling-count="1"
            class="min-w-max"
          />
        </div>
      </div>
    </template>

    <UModal
      v-model:open="isDeleteModalOpen"
      title="Supprimer cette tâche ?"
      description="Cette action est définitive et ne peut pas être annulée."
      :dismissible="!isDeleting"
    >
      <template #body>
        <p class="text-sm text-muted">
          {{ taskToDelete?.title }}
        </p>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="outline"
            :disabled="isDeleting"
            @click="close"
          />
          <UButton
            label="Supprimer"
            color="error"
            icon="i-lucide-trash-2"
            :loading="isDeleting"
            @click="deleteTask"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
