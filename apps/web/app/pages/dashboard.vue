<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

definePageMeta({ middleware: 'auth' })

const { data: session } = await authClient.useSession(useFetch)
const open = ref(true)
const errorMessage = ref('')
const isSigningOut = ref(false)

const navItems: NavigationMenuItem[] = [{
  label: 'Home',
  icon: 'i-lucide-house',
  active: true,
}]

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
        :ui="{ link: 'p-1.5 overflow-hidden' }"
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

      <main class="flex-1 overflow-auto p-6">
        <h1 class="text-2xl font-semibold mb-2">Home</h1>
        <p class="text-sm text-muted">Dashboard en cours de construction.</p>
      </main>
    </div>
  </div>
</template>
