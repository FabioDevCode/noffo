// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'light',
  },
  app: {
    head: {
      script: [
        {
          key: 'force-light-mode',
          innerHTML: "localStorage.setItem('nuxt-color-mode','light')",
          tagPriority: 'critical',
        },
      ],
    },
  },
})
