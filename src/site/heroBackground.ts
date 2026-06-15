import { FALLBACK_COVER_IMAGE } from './siteFallbackImage'

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
  return FALLBACK_COVER_IMAGE
}

export function getNextHeroFallbackUrl(_currentUrl: string) {
  return FALLBACK_COVER_IMAGE
}
