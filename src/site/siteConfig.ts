const DEFAULT_DESCRIPTION =
  'ALYA APART — Avşa Adası\'nda denize yakın konforlu apart konaklama. Avşa apart, Avşa konaklama ve Avşa tatil için 14 oda, plaja yakın merkezi konum. WhatsApp ile hemen bilgi alın.'

export const SITE_SEO_KEYWORDS =
  'Avşa Apart, Avşa Konaklama, Avşa Apart Otel, Avşa Tatil, ALYA APART, Avşa Adası konaklama, Avşa denize yakın apart'

export const SITE_CONFIG = {
  name: 'ALYA APART',
  tagline: "Avşa Adası'nda denize yakın konforlu konaklama",
  description: import.meta.env.VITE_SITE_DESCRIPTION ?? DEFAULT_DESCRIPTION,
  seoKeywords: import.meta.env.VITE_SITE_KEYWORDS ?? SITE_SEO_KEYWORDS,
  address:
    import.meta.env.VITE_SITE_ADDRESS ?? 'Avşa Merkezi, Avşa Adası, Balıkesir',
  aboutText:
    import.meta.env.VITE_SITE_ABOUT ??
    'ALYA APART, Avşa Adası\'nın sakin atmosferinde misafirlerine denize yakın, temiz ve konforlu bir konaklama deneyimi sunar.',
  locationText:
    import.meta.env.VITE_SITE_LOCATION ??
    'Avşa Merkezi\'nde, plajlara ve adanın sosyal alanlarına yürüme mesafesinde konumlanmış apartımız ile tatilinizi kolayca planlayın.',
  apartmentText:
    import.meta.env.VITE_SITE_APARTMENT ??
    '14 farklı oda seçeneğiyle aileler, çiftler ve küçük gruplar için uygun konaklama imkânı sunuyoruz.',
  locationName: import.meta.env.VITE_SITE_LOCATION_NAME ?? 'Avşa Adası',
  locationArea: 'Avşa Merkezi',
  phone: import.meta.env.VITE_SITE_PHONE ?? '+90 532 000 00 00',
  phoneHref: import.meta.env.VITE_SITE_PHONE_HREF ?? 'tel:+905320000000',
  instagramUrl: import.meta.env.VITE_SITE_INSTAGRAM ?? 'https://instagram.com/alyaapart',
  instagramHandle: import.meta.env.VITE_SITE_INSTAGRAM_HANDLE ?? '@alyaapart',
  mapsEmbedUrl:
    import.meta.env.VITE_SITE_MAPS_EMBED ??
    'https://maps.google.com/maps?q=Avsa+Merkezi+Avsa+Adasi+Balikesir&output=embed',
  mapsLink:
    import.meta.env.VITE_SITE_MAPS_LINK ??
    'https://maps.google.com/?q=Avsa+Merkezi+Avsa+Adasi+Balikesir',
  heroImage:
    import.meta.env.VITE_SITE_HERO_IMAGE ??
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  heroBackgroundImage:
    import.meta.env.VITE_SITE_HERO_BACKGROUND ??
    'https://images.unsplash.com/photo-1519046904414-08896d75da63?auto=format&fit=crop&w=1920&q=85&auto=format&fm=jpg',
  siteUrl: import.meta.env.VITE_SITE_URL ?? '',
  defaultOgImage:
    import.meta.env.VITE_SITE_OG_IMAGE ??
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  tourismImages: {
    sea:
      import.meta.env.VITE_SITE_IMG_SEA ??
      'https://images.unsplash.com/photo-1439402358104-d669041bc556?auto=format&fit=crop&w=900&q=80',
    beach:
      import.meta.env.VITE_SITE_IMG_BEACH ??
      'https://images.unsplash.com/photo-1473496162514-89a7e597ee37?auto=format&fit=crop&w=900&q=80',
    sunset:
      import.meta.env.VITE_SITE_IMG_SUNSET ??
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
    family:
      import.meta.env.VITE_SITE_IMG_FAMILY ??
      'https://images.unsplash.com/photo-1519451241324-20b4ea2a8ffe?auto=format&fit=crop&w=900&q=80',
    experienceBanner:
      import.meta.env.VITE_SITE_IMG_BANNER ??
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80',
  },
} as const

export function getSiteOrigin() {
  if (SITE_CONFIG.siteUrl) {
    return SITE_CONFIG.siteUrl.replace(/\/$/, '')
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
