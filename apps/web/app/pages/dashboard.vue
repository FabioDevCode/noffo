<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({ middleware: 'auth' })

const { data: session } = await authClient.useSession(useFetch)
const errorMessage = ref('')
const isSigningOut = ref(false)

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
  } catch {
    errorMessage.value = 'La déconnexion a échoué. Réessayez.'
  } finally {
    isSigningOut.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-6 py-12">
    <h1 class="mb-4 text-2xl font-semibold">Mon espace</h1>
    <p v-if="session">Connecté en tant que {{ session.user.name }} ({{ session.user.email }})</p>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      class="my-4"
    />

    <UButton class="mt-6" :loading="isSigningOut" @click="signOut">
      Se déconnecter
    </UButton>
  </main>
</template>
