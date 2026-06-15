export function getSiteOrigin() {
  const siteUrl = import.meta.env.VITE_SITE_URL ?? ''

  if (siteUrl) {
    return siteUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function getAbsoluteSiteUrl(path: string) {
  const origin = getSiteOrigin()
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
