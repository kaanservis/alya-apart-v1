import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { WebsiteGalleryCategory, WebsiteGalleryPhoto, WebsiteSettingsRow } from '../types/database'
import {
  getDefaultGalleryUrls,
  DEFAULT_WEBSITE_SETTINGS,
} from '../website/websiteContentDefaults'
import {
  buildPhoneHref,
  buildWhatsAppHref,
  fetchWebsiteGallery,
  fetchWebsiteSettings,
  getSitePhotoPublicUrl,
  normalizeMapsEmbedValue,
  resolveHeroBackgroundUrl,
  resolveHeroImageUrl,
} from '../website/websiteContentService'

export interface SiteContentValue {
  settings: WebsiteSettingsRow
  gallery: Record<WebsiteGalleryCategory, WebsiteGalleryPhoto[]>
  heroBackgroundUrl: string
  promotionalImageUrl: string | null
  /** @deprecated Use heroBackgroundUrl */
  heroImageUrl: string
  phoneHref: string
  mapsEmbedUrl: string
  mapsLink: string
  loading: boolean
  error: string | null
  getWhatsAppHref: (message?: string) => string
  getGalleryPhotos: (category: WebsiteGalleryCategory) => WebsiteGalleryPhoto[]
  getGalleryImageUrls: (category: WebsiteGalleryCategory) => string[]
  refetch: () => void
}

const DEFAULT_INQUIRY_MESSAGE = 'Merhaba, ALYA APART Avşa konaklama hakkında bilgi almak istiyorum.'

const SiteContentContext = createContext<SiteContentValue | null>(null)

function buildFallbackGallery(): Record<WebsiteGalleryCategory, WebsiteGalleryPhoto[]> {
  const defaults = getDefaultGalleryUrls()
  const now = new Date(0).toISOString()

  return {
    homepage: [],
    deniz: [
      {
        id: 'fallback-deniz',
        category: 'deniz',
        storagePath: '',
        sortOrder: 0,
        url: defaults.deniz,
        createdAt: now,
      },
    ],
    plaj: [
      {
        id: 'fallback-plaj',
        category: 'plaj',
        storagePath: '',
        sortOrder: 0,
        url: defaults.plaj,
        createdAt: now,
      },
    ],
    apart: [
      {
        id: 'fallback-apart',
        category: 'apart',
        storagePath: '',
        sortOrder: 0,
        url: defaults.apart,
        createdAt: now,
      },
    ],
    cevre: [
      {
        id: 'fallback-cevre',
        category: 'cevre',
        storagePath: '',
        sortOrder: 0,
        url: defaults.cevre,
        createdAt: now,
      },
    ],
  }
}

function groupGalleryPhotos(photos: WebsiteGalleryPhoto[]) {
  const grouped: Record<WebsiteGalleryCategory, WebsiteGalleryPhoto[]> = {
    homepage: [],
    deniz: [],
    plaj: [],
    apart: [],
    cevre: [],
  }

  photos.forEach((photo) => {
    grouped[photo.category].push(photo)
  })

  return grouped
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettingsRow>(DEFAULT_WEBSITE_SETTINGS)
  const [gallery, setGallery] = useState<Record<WebsiteGalleryCategory, WebsiteGalleryPhoto[]>>(
    buildFallbackGallery(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1)
  }, [])

  useEffect(() => {
    async function loadContent() {
      setLoading(true)

      try {
        const [settingsResult, galleryResult] = await Promise.all([
          fetchWebsiteSettings(),
          fetchWebsiteGallery(),
        ])

        setSettings(settingsResult)

        if (galleryResult.length > 0) {
          setGallery(groupGalleryPhotos(galleryResult))
        } else {
          setGallery(buildFallbackGallery())
        }

        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Site içeriği yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    void loadContent()
  }, [refreshToken])

  const value = useMemo<SiteContentValue>(() => {
    const heroBackgroundUrl = resolveHeroBackgroundUrl(settings)
    const promotionalImageUrl = resolveHeroImageUrl(settings)
    const mapsEmbedUrl = normalizeMapsEmbedValue(settings.maps_embed) || DEFAULT_WEBSITE_SETTINGS.maps_embed
    const mapsLink = settings.maps_link || DEFAULT_WEBSITE_SETTINGS.maps_link

    return {
      settings,
      gallery,
      heroBackgroundUrl,
      promotionalImageUrl,
      heroImageUrl: heroBackgroundUrl,
      phoneHref: buildPhoneHref(settings.phone),
      mapsEmbedUrl,
      mapsLink,
      loading,
      error,
      getWhatsAppHref: (message = DEFAULT_INQUIRY_MESSAGE) =>
        buildWhatsAppHref(settings.whatsapp || DEFAULT_WEBSITE_SETTINGS.whatsapp, message),
      getGalleryPhotos: (category) => gallery[category],
      getGalleryImageUrls: (category) => gallery[category].map((photo) => photo.url),
      refetch,
    }
  }, [settings, gallery, loading, error, refetch])

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

export function getPromotionalImageFromSettings(settings: WebsiteSettingsRow) {
  return resolveHeroImageUrl(settings)
}

export function getHeroImageFromSettings(settings: WebsiteSettingsRow) {
  return resolveHeroImageUrl(settings)
}

export function getGalleryPreviewUrl(storagePath: string | null | undefined) {
  if (!storagePath) {
    return null
  }

  return getSitePhotoPublicUrl(storagePath)
}
