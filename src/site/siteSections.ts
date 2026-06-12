export const SITE_SECTIONS = [
  { id: 'experience', label: 'Avşa Bilgisi' },
  { id: 'about', label: 'Hakkımızda' },
  { id: 'gallery', label: 'Galeri' },
  { id: 'location', label: 'Konum' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'contact', label: 'İletişim' },
] as const

export type SiteSectionId = (typeof SITE_SECTIONS)[number]['id']
