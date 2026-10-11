<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)
const open = ref(true)
const errorMessage = ref('')
const isSigningOut = ref(false)

const navItems: NavigationMenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
  },
  {
    label: 'Mes tâches',
    icon: 'i-lucide-list-todo',
    to: '/tasks'
  },
  {
    label: 'Calendrier',
    icon: 'i-lucide-calendar',
    to: '/calendar'
  },
  {
    label: 'Paramètres',
    icon: 'i-lucide-settings',
    to: '/settings'
  }
]

async function signOut() {
  errorMessage.value = ''
  isSigningOut.value = true

  try {
    const { error } = await authClient.signOut()

    if (error) {
      errorMessage.value = error.message || 'La déconnexion a échoué.'
      return
    }

    await navigateTo('/login')
  }
  catch {
    errorMessage.value = 'La déconnexion a échoué. Réessayez.'
  }
  finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <USidebar
      v-model:open="open"
      collapsible="icon"
      :ui="{ container: 'h-full' }"
    >
      <template #header>
        <img src="/img/noffo_logo.svg" alt="Noffo" class="size-8" />
      </template>

      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        :ui="{
          link: 'p-1.5 overflow-hidden gap-2',
          linkLeadingIcon: 'size-5 shrink-0',
        }"
      />
    </USidebar>

    <div class="flex-1 flex flex-col overflow-hidden bg-default">
      <div class="h-(--ui-header-height) shrink-0 flex items-center justify-between px-4 border-b border-default">
        <UButton
          icon="i-lucide-panel-left"
          color="neutral"
          variant="ghost"
          aria-label="Replier la sidebar"
          @click="open = !open"
        />
        <UButton
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          :loading="isSigningOut"
          aria-label="Se déconnecter"
          @click="signOut"
        />
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
        class="m-4"
      />

      <UMain class="px-6 py-4">
        <slot />
      </UMain>
    </div>
  </div>
</template>
