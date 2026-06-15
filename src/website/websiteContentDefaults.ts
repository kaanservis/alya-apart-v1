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
  site_title: '',
  site_subtitle: '',
  welcome_text: '',
  about_short: '',
  hero_image_path: null,
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  email: '',
  address: '',
  maps_embed: '',
  maps_link: '',
  about_content: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}
