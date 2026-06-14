export const PUBLIC_NAV_LINKS = [
  { id: 'hero', label: 'Ana Sayfa' },
  { id: 'about', label: 'Hakkımızda' },
  { id: 'gallery', label: 'Galeri' },
  { id: 'location', label: 'Konum' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'contact', label: 'İletişim' },
] as const

export type SiteSectionId = (typeof PUBLIC_NAV_LINKS)[number]['id']

/** @deprecated Use PUBLIC_NAV_LINKS for navigation. Section ids for page anchors. */
export const SITE_SECTIONS = PUBLIC_NAV_LINKS.filter((link) => link.id !== 'hero')
