<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { authClient } from '~/lib/auth-client'

const { data: session } = await authClient.useSession(useFetch)
const open = ref(true)
const isMobileSidebar = useMediaQuery('(max-width: 1023px)')
const errorMessage = ref('')
const isSigningOut = ref(false)

function closeSidebarOnMobile() {
  if (isMobileSidebar.value) {
    open.value = false
  }
}

const navItems: NavigationMenuItem[] = [
  {
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    onSelect: closeSidebarOnMobile,
  },
  {
    label: 'Mes tâches',
    icon: 'i-lucide-list-todo',
    to: '/tasks',
    onSelect: closeSidebarOnMobile,
  },
  {
    label: 'Calendrier',
    icon: 'i-lucide-calendar',
    to: '/calendar',
    onSelect: closeSidebarOnMobile,
  },
  {
    label: 'Paramètres',
    icon: 'i-lucide-settings',
    to: '/settings',
    onSelect: closeSidebarOnMobile,
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
      :style="{ '--sidebar-width': '200px' }"
      :ui="{ container: 'h-full' }"
      :menu="{ ui: { content: 'w-60 max-w-[85vw]' } }"
    >
      <template #header="{ close }">
        <img src="/img/noffo_logo.svg" alt="Noffo" class="size-7.5" />
        <p class="ml-2.5 font-bold text-2xl">
          noffo
        </p>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          aria-label="Fermer le menu"
          class="ml-auto lg:hidden"
          @click="close"
        />
      </template>

      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        :ui="{
          link: 'p-1.5 overflow-hidden gap-2',
          linkLeadingIcon: 'size-5 shrink-0',
        }"
      />

      <template #footer="{ state }">
        <UButton
          icon="i-lucide-power"
          label="Se déconnecter"
          color="error"
          variant="ghost"
          :block="state !== 'collapsed'"
          :class="state === 'collapsed'
            ? 'size-8 justify-center p-1.5'
            : 'w-full justify-start px-1.5'"
          :loading="isSigningOut"
          :ui="{ label: state === 'collapsed' ? 'hidden' : undefined }"
          aria-label="Se déconnecter"
          @click="signOut"
        />
      </template>
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
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
        class="m-4"
      />

      <UMain class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <slot />
      </UMain>
    </div>
  </div>
</template>
