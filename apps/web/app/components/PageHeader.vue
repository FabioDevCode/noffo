<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-xl font-extrabold text-highlighted">
        <slot name="title" />
      </h1>
      <p class="mt-1 text-sm text-muted">
        <slot name="description" />
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
