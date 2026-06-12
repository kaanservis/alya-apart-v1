import { SITE_CONFIG } from '../site/siteConfig'
import type { WebsiteGalleryCategory, WebsiteSettingsRow } from '../types/database'

export const WEBSITE_GALLERY_CATEGORIES: {
  id: WebsiteGalleryCategory
  label: string
  description: string
}[] = [
  { id: 'homepage', label: 'Ana Sayfa', description: 'Ana sayfa galeri görselleri' },
  { id: 'deniz', label: 'Deniz', description: 'Deniz fotoğrafları' },
  { id: 'plaj', label: 'Plaj', description: 'Plaj fotoğrafları' },
  { id: 'apart', label: 'Apart', description: 'Apart fotoğrafları' },
  { id: 'cevre', label: 'Çevre', description: 'Çevre fotoğrafları' },
]

export const GALLERY_CATEGORY_LABELS: Record<WebsiteGalleryCategory, string> = {
  homepage: 'Ana Sayfa',
  deniz: 'Deniz',
  plaj: 'Plaj',
  apart: 'Apart',
  cevre: 'Çevre',
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettingsRow = {
  id: 'default',
  site_title: SITE_CONFIG.name,
  site_subtitle: 'Avşa Adası Yiğitler Köyü',
  welcome_text: 'Denize Sıfır Konforlu Konaklama',
  about_short: SITE_CONFIG.aboutText,
  hero_image_path: null,
  phone: SITE_CONFIG.phone,
  whatsapp: '905320000000',
  instagram: SITE_CONFIG.instagramHandle,
  facebook: '',
  email: 'info@alyaapart.com',
  address: SITE_CONFIG.address,
  maps_embed: SITE_CONFIG.mapsEmbedUrl,
  maps_link: SITE_CONFIG.mapsLink,
  about_content:
    '<p><strong>ALYA APART</strong>, Avşa Adası\'nda 14 odalı apart konaklama imkânı sunar. Denize ve plajlara yürüme mesafesinde, aileler ve çiftler için sakin ve konforlu bir tatil ortamı sağlar.</p>',
  meta_title: `${SITE_CONFIG.name} | Avşa Apart Konaklama & Tatil`,
  meta_description: SITE_CONFIG.description,
  meta_keywords: SITE_CONFIG.seoKeywords,
  instagram_url: SITE_CONFIG.instagramUrl,
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}

export { getDefaultHeroBackgroundUrl } from '../site/heroBackground'

/** Uploaded promotional poster (shown in gallery). */
export function getDefaultPromotionalImageUrl() {
  return SITE_CONFIG.heroImage
}

export function getDefaultGalleryUrls(): Record<Exclude<WebsiteGalleryCategory, 'homepage'>, string> {
  return {
    deniz: SITE_CONFIG.tourismImages.sea,
    plaj: SITE_CONFIG.tourismImages.beach,
    apart: SITE_CONFIG.tourismImages.family,
    cevre: SITE_CONFIG.tourismImages.sunset,
  }
}
