import { authClient } from '~/lib/auth-client'
import { getSafeRedirect } from '~/lib/auth-redirect'

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  if (session.value) {
    return navigateTo(getSafeRedirect(to.query.redirect))
  }
})
