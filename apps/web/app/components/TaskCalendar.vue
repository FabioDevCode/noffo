<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import frenchLocale from '@fullcalendar/core/locales/fr'
import type { CalendarApi, CalendarOptions, DatesSetArg, EventInput } from '@fullcalendar/core'
import { CalendarDate, type DateValue } from '@internationalized/date'
import { useResizeObserver } from '@vueuse/core'
import type { Task, TaskStatus } from '~/types/task'

const props = defineProps<{ tasks: Task[] }>()

type CalendarView = 'month' | 'week'

const calendarViewTabs = [
  { label: 'Mois', value: 'month' },
  { label: 'Semaine', value: 'week' },
]

const statusPresentation: Record<TaskStatus, { label: string, background: string, border: string, text: string }> = {
  pending: {
    label: 'À faire',
    background: '#fef3c7',
    border: '#f59e0b',
    text: '#78350f'
  },
  in_progress: {
    label: 'En cours',
    background: '#dbeafe',
    border: '#60a5fa',
    text: '#1e3a8a'
  },
  completed: {
    label: 'Terminé',
    background:
    '#dcfce7',
    border: '#4ade80',
    text: '#14532d'
  },
}

const fullCalendar = ref<{ getApi: () => CalendarApi } | null>(null)
const calendarContainer = ref<HTMLElement | null>(null)
const periodTitle = ref('')
const currentView = ref<CalendarView>('month')
const selectedMonthDate = shallowRef<DateValue>()
const selectedWeekDate = shallowRef<DateValue>()
const periodPickerOpen = ref(false)
let observedCalendarWidth: number | undefined
let resizeFrame: number | undefined

useResizeObserver(calendarContainer, (entries) => {
  const width = entries[0]?.contentRect.width

  if (width === undefined) {
    return
  }

  const roundedWidth = Math.round(width)

  if (roundedWidth === observedCalendarWidth) {
    return
  }

  observedCalendarWidth = roundedWidth

  if (resizeFrame !== undefined) {
    return
  }

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = undefined
    calendarApi()?.updateSize()
  })
})

onBeforeUnmount(() => {
  if (resizeFrame !== undefined) {
    cancelAnimationFrame(resizeFrame)
  }
})

const periodPickerLabel = computed(() => {
  if (currentView.value === 'month' && selectedMonthDate.value) {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
      .format(new Date(selectedMonthDate.value.year, selectedMonthDate.value.month - 1, 1))
  }

  if (selectedWeekDate.value) {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })
      .format(new Date(selectedWeekDate.value.year, selectedWeekDate.value.month - 1, selectedWeekDate.value.day))
  }

  return 'Choisir une période'
})

const calendarEvents = computed<EventInput[]>(() => props.tasks.flatMap((task) => {
  if (!task.dueDate) {
    return []
  }

  const status = statusPresentation[task.status]

  return [{
    id: task.id,
    title: task.shortDescription?.trim() || task.title,
    start: task.dueDate,
    allDay: true,
    backgroundColor: status.background,
    borderColor: status.border,
    textColor: status.text,
    extendedProps: { task },
  }]
}))

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locales: [frenchLocale],
  locale: frenchLocale,
  firstDay: 1,
  weekends: true,
  headerToolbar: false,
  height: 'auto',
  contentHeight: 'auto',
  fixedWeekCount: false,
  dayMaxEvents: 3,
  moreLinkClick: 'popover',
  editable: false,
  eventInteractive: false,
  eventStartEditable: false,
  eventDurationEditable: false,
  selectable: false,
  events: calendarEvents.value,
  datesSet: handleDatesSet,
  eventClick: handleEventClick,
}))

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function handleDatesSet(info: DatesSetArg) {
  periodTitle.value = info.view.title
  currentView.value = info.view.type === 'dayGridWeek' ? 'week' : 'month'

  // getDate() is FullCalendar's current date reference, in the browser's local timezone.
  // Formatting its local parts keeps the selected civil date from shifting across timezones.
  const referenceDate = info.view.calendar.getDate()
  const date = formatLocalDate(referenceDate)
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  selectedMonthDate.value = new CalendarDate(year, month, 1)
  selectedWeekDate.value = new CalendarDate(year, month, day)
}

function handleEventClick(info: { jsEvent: MouseEvent }) {
  info.jsEvent.preventDefault()
}

function taskStatusLabel(status: TaskStatus): string {
  return statusPresentation[status].label
}

function calendarApi(): CalendarApi | null {
  return fullCalendar.value?.getApi() ?? null
}

function navigatePreviousYear() {
  calendarApi()?.prevYear()
}

function navigatePreviousPeriod() {
  calendarApi()?.prev()
}

function navigateToToday() {
  calendarApi()?.today()
}

function navigateNextPeriod() {
  calendarApi()?.next()
}

function navigateNextYear() {
  calendarApi()?.nextYear()
}

function changeView(view: CalendarView) {
  const viewName = view === 'month' ? 'dayGridMonth' : 'dayGridWeek'
  calendarApi()?.changeView(viewName)
}

function handleViewTabChange(value: string | number) {
  if (value === 'month' || value === 'week') {
    changeView(value)
  }
}

function navigateToMonth(value: unknown) {
  if (!(value instanceof CalendarDate)) {
    return
  }

  const month = String(value.month).padStart(2, '0')
  calendarApi()?.gotoDate(`${value.year}-${month}-01`)
  periodPickerOpen.value = false
}

function navigateToWeek(value: unknown) {
  if (!(value instanceof CalendarDate)) {
    return
  }

  calendarApi()?.gotoDate(`${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`)
  periodPickerOpen.value = false
}
</script>

<template>
  <section class="space-y-4" aria-label="Calendrier des tâches">
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="order-2 flex flex-wrap items-center justify-center gap-1 sm:order-1 sm:justify-start" role="group" aria-label="Navigation du calendrier">
          <UButton
            icon="i-lucide-chevrons-left"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Année précédente"
            title="Année précédente"
            @click="navigatePreviousYear"
          />
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Période précédente"
            title="Période précédente"
            @click="navigatePreviousPeriod"
          />
          <UButton
            label="Aujourd’hui"
            color="neutral"
            variant="outline"
            size="sm"
            @click="navigateToToday"
          />
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Période suivante"
            title="Période suivante"
            @click="navigateNextPeriod"
          />
          <UButton
            icon="i-lucide-chevrons-right"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Année suivante"
            title="Année suivante"
            @click="navigateNextYear"
          />
        </div>

        <h2 class="order-1 w-full text-center text-lg font-semibold capitalize text-highlighted sm:order-2 sm:w-auto sm:flex-1">
          {{ periodTitle }}
        </h2>

        <div class="order-2 flex justify-center sm:justify-end" role="group" aria-label="Vue du calendrier">
          <UTabs
            :model-value="currentView"
            :items="calendarViewTabs"
            :content="false"
            color="neutral"
            variant="pill"
            size="sm"
            class="w-fit"
            :ui="{ list: 'w-fit' }"
            @update:model-value="handleViewTabChange"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2 text-sm text-muted">
          <span>Aller à</span>
          <UPopover v-model:open="periodPickerOpen">
            <UButton
              icon="i-lucide-calendar-days"
              :label="periodPickerLabel"
              :aria-label="currentView === 'month' ? 'Choisir un mois et une année' : 'Choisir une date pour sa semaine'"
              color="neutral"
              variant="outline"
              size="sm"
            />

            <template #content>
              <UCalendar
                v-if="currentView === 'month'"
                v-model="selectedMonthDate"
                type="month"
                locale="fr-FR"
                class="p-2"
                @update:model-value="navigateToMonth"
              />
              <UCalendar
                v-else
                v-model="selectedWeekDate"
                locale="fr-FR"
                :week-starts-on="1"
                :fixed-weeks="false"
                class="p-2"
                @update:model-value="navigateToWeek"
              />
            </template>
          </UPopover>
        </div>

        <p class="text-xs text-muted sm:text-right">
          Les échéances sont affichées sans horaire.
        </p>
      </div>
    </div>

    <div ref="calendarContainer" class="task-calendar min-w-0 overflow-hidden bg-default">
      <FullCalendar ref="fullCalendar" :options="calendarOptions">
        <template #eventContent="{ event }">
          <div class="flex min-w-0 flex-col px-1 py-0.5 leading-tight">
            <span class="text-[10px] font-semibold opacity-80">
              {{ taskStatusLabel(event.extendedProps.task.status) }}
            </span>
            <span class="truncate text-xs font-medium">{{ event.title }}</span>
          </div>
        </template>
      </FullCalendar>
    </div>
  </section>
</template>

<style scoped>
.task-calendar .fc {
  --fc-border-color: var(--ui-border);
  --fc-page-bg-color: var(--ui-bg);
  --fc-neutral-bg-color: var(--ui-bg-muted);
  --fc-today-bg-color: var(--ui-bg-muted);
  font-family: var(--font-sans);
  font-size: 0.875rem;
}

.task-calendar .fc .fc-col-header-cell-cushion {
  padding: 0.75rem 0.25rem;
  color: var(--ui-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
}

.task-calendar .fc .fc-daygrid-day-number {
  padding: 0.5rem;
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
  text-decoration: none;
}

.task-calendar .fc .fc-daygrid-event {
  overflow: hidden;
  border-radius: 0.25rem;
  cursor: default;
  white-space: normal;
}

.task-calendar .fc .fc-daygrid-event-harness {
  margin-inline: 0.25rem;
}

.task-calendar .fc .fc-more-link {
  color: var(--ui-text);
  font-size: 0.75rem;
  font-weight: 600;
}

@media (max-width: 639px) {
  .task-calendar .fc .fc-col-header-cell-cushion {
    padding-block: 0.625rem;
    font-size: 0.6875rem;
  }

  .task-calendar .fc .fc-daygrid-day-number {
    padding: 0.375rem;
  }

  .task-calendar .fc .fc-daygrid-event-harness {
    margin-inline: 0.125rem;
  }
}
</style>
