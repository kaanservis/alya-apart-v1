/** Default full-width hero backgrounds — turquoise sea, beach, summer resort feel. */
export const DEFAULT_TOURISM_HERO_URL =
  'https://images.unsplash.com/photo-1519046904414-08896d75da63?auto=format&fit=crop&w=1920&q=85&auto=format&fm=jpg'

export const FALLBACK_TOURISM_HERO_URLS = [
  DEFAULT_TOURISM_HERO_URL,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85&auto=format&fm=jpg',
  'https://images.unsplash.com/photo-1473496162514-89a7e597ee37?auto=format&fit=crop&w=1920&q=85&auto=format&fm=jpg',
  'https://images.unsplash.com/photo-1439402358104-d669041bc556?auto=format&fit=crop&w=1920&q=85&auto=format&fm=jpg',
] as const

export const HERO_OVERLAY_STYLE = {
  background: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45))',
} as const

export function isPlaceholderHeroUrl(url: string | null | undefined) {
  if (!url) {
    return true
  }

  const trimmed = url.trim()
  return trimmed.length === 0 || trimmed.includes('site-hero.svg') || trimmed.endsWith('.svg')
}

export function getDefaultHeroBackgroundUrl() {
  const envUrl = import.meta.env.VITE_SITE_HERO_BACKGROUND as string | undefined

  if (envUrl && !isPlaceholderHeroUrl(envUrl)) {
    return envUrl
  }

  return DEFAULT_TOURISM_HERO_URL
}

export function getNextHeroFallbackUrl(currentUrl: string) {
  const index = FALLBACK_TOURISM_HERO_URLS.findIndex((url) => url === currentUrl)
  const nextIndex = index + 1

  if (nextIndex >= FALLBACK_TOURISM_HERO_URLS.length) {
    return FALLBACK_TOURISM_HERO_URLS[0]
  }

  return FALLBACK_TOURISM_HERO_URLS[nextIndex]
}
