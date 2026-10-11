<script setup lang="ts">
import { authClient } from '~/lib/auth-client'
import { getSafeRedirect } from '~/lib/auth-redirect'

definePageMeta({ middleware: 'guest', layout: false })

const route = useRoute()
const state = reactive({ name: '', email: '', password: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)

async function signUp() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const { error } = await authClient.signUp.email(state)

    if (error) {
      errorMessage.value = error.message || 'Les informations saisies sont invalides.'
      return
    }

    await navigateTo(getSafeRedirect(route.query.redirect))
  } catch {
    errorMessage.value = 'La création du compte a échoué. Réessayez.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
    <h1 class="mb-6 text-2xl font-semibold">Créer un compte</h1>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      class="mb-4"
    />

    <UForm :state="state" class="space-y-4" @submit="signUp">
      <UFormField label="Nom" name="name" required>
        <UInput v-model="state.name" autocomplete="name" required class="w-full" />
      </UFormField>

      <UFormField label="Adresse e-mail" name="email" required>
        <UInput v-model="state.email" type="email" autocomplete="email" required class="w-full" />
      </UFormField>

      <UFormField label="Mot de passe" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="new-password"
          required
          class="w-full"
        />
      </UFormField>

      <UButton type="submit" :loading="isSubmitting" class="w-full">
        Créer mon compte
      </UButton>
    </UForm>

    <p class="mt-6 text-sm">
      Déjà inscrit ?
      <NuxtLink :to="{ path: '/login', query: route.query }" class="underline">
        Se connecter
      </NuxtLink>
    </p>
  </main>
</template>
