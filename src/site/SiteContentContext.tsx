import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ApartmentProfile, WebsiteSettingsRow } from '../types/database'
import { fetchApartmentProfiles } from '../website/apartmentService'
import { DEFAULT_WEBSITE_SETTINGS } from '../website/websiteContentDefaults'
import {
  buildPhoneHref,
  buildWhatsAppHref,
  fetchWebsiteSettings,
  normalizeMapsEmbedValue,
  resolveHeroImageUrl,
  resolveWebsiteSettingsImageUrl,
} from '../website/websiteContentService'
import { selectDisplayApartments } from './publicApartments'
import { siteDebugLog } from './siteDebugLog'
import { FALLBACK_COVER_IMAGE, resolveImageUrl } from './siteFallbackImage'

export interface SiteContentValue {
  settings: WebsiteSettingsRow
  apartments: ApartmentProfile[]
  displayApartments: ApartmentProfile[]
  apartmentPhotoUrls: string[]
  heroBackgroundUrl: string
  mapsEmbedSrc: string
  phoneHref: string
  loading: boolean
  error: string | null
  getWhatsAppHref: (message?: string) => string
  refetch: () => void
}

const SiteContentContext = createContext<SiteContentValue | null>(null)

function resolvePublicHeroUrl(apartments: ApartmentProfile[], settings: WebsiteSettingsRow) {
  const firstApartmentCover = apartments[0]?.coverUrl
  const settingsHero = resolveHeroImageUrl(settings)
  const resolved = resolveImageUrl(firstApartmentCover ?? settingsHero)

  siteDebugLog('Hero URL resolution', {
    firstApartmentCover: firstApartmentCover ?? null,
    hero_image_path: settings.hero_image_path,
    resolvedHeroFromSettings: settingsHero,
    finalHeroBackgroundUrl: resolved,
    usedSource: firstApartmentCover
      ? 'apartments[0].cover_image'
      : settingsHero
        ? 'website_settings.hero_image_path'
        : 'FALLBACK_COVER_IMAGE (SVG placeholder)',
  })

  return resolved
}

function buildInquiryMessage(settings: WebsiteSettingsRow) {
  const siteName = settings.site_title.trim() || 'Apart'
  return `Merhaba, ${siteName} hakkında bilgi almak istiyorum.`
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettingsRow>(DEFAULT_WEBSITE_SETTINGS)
  const [apartments, setApartments] = useState<ApartmentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1)
  }, [])

  useEffect(() => {
    async function loadContent() {
      setLoading(true)

      siteDebugLog('SiteContentProvider → loadContent() started', {
        component: 'SiteContentProvider',
        file: 'src/site/SiteContentContext.tsx',
      })

      try {
        const [settingsResult, apartmentProfiles] = await Promise.all([
          fetchWebsiteSettings(),
          fetchApartmentProfiles(),
        ])

        siteDebugLog('SiteContentProvider → website_settings received', {
          component: 'SiteContentProvider',
          site_title: settingsResult.site_title,
          site_subtitle: settingsResult.site_subtitle,
          hero_image_path: settingsResult.hero_image_path,
          welcome_text: settingsResult.welcome_text,
          about_short: settingsResult.about_short,
          apartmentCount: apartmentProfiles.length,
        })

        setSettings(settingsResult)
        setApartments(apartmentProfiles)
        setError(null)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Site içeriği yüklenemedi.'
        siteDebugLog('SiteContentProvider → loadContent() failed', { error: message })
        setError(message)
      } finally {
        setLoading(false)
        siteDebugLog('SiteContentProvider → loadContent() finished')
      }
    }

    void loadContent()
  }, [refreshToken])

  const value = useMemo<SiteContentValue>(() => {
    const displayApartments = selectDisplayApartments(apartments)
    const apartmentPhotoUrls = displayApartments.flatMap((profile) =>
      profile.photos.map((photo) => photo.photoUrl),
    )
    const heroBackgroundUrl = loading
      ? FALLBACK_COVER_IMAGE
      : resolvePublicHeroUrl(displayApartments.length > 0 ? displayApartments : apartments, settings)
    const mapsEmbedSrc = normalizeMapsEmbedValue(settings.maps_embed)
    const inquiryMessage = buildInquiryMessage(settings)

    return {
      settings,
      apartments,
      displayApartments,
      apartmentPhotoUrls,
      heroBackgroundUrl,
      mapsEmbedSrc,
      phoneHref: buildPhoneHref(settings.phone),
      loading,
      error,
      getWhatsAppHref: (message = inquiryMessage) => buildWhatsAppHref(settings.whatsapp, message),
      refetch,
    }
  }, [settings, apartments, loading, error, refetch])

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const context = useContext(SiteContentContext)

  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }

  return context
}

export function useSiteContentOptional() {
  return useContext(SiteContentContext)
}

export function getGalleryPreviewUrl(storagePath: string | null | undefined) {
  return resolveWebsiteSettingsImageUrl(storagePath)
}

export function getHeroImageFromSettings(settings: WebsiteSettingsRow) {
  return resolveHeroImageUrl(settings)
}
