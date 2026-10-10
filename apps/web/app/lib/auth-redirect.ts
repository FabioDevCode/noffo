const fallbackPath = '/dashboard'
const baseUrl = 'https://noffo.invalid'

export function getSafeRedirect(value: unknown): string {
  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || /[\u0000-\u001f]/.test(value)
  ) {
    return fallbackPath
  }

  const target = new URL(value, baseUrl)

  if (target.origin !== baseUrl || /^\/(login|register)(\/|$)/.test(target.pathname)) {
    return fallbackPath
  }

  return `${target.pathname}${target.search}${target.hash}`
}
