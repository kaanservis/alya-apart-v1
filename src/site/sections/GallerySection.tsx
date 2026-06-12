import { useMemo, useState } from 'react'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { GALLERY_CATEGORY_LABELS } from '../../website/websiteContentDefaults'
import type { WebsiteGalleryCategory } from '../../types/database'
import { useSiteContent } from '../SiteContentContext'

interface GalleryItem {
  id: string
  url: string
  label: string
  featured?: boolean
}

const GALLERY_CATEGORIES: WebsiteGalleryCategory[] = ['deniz', 'plaj', 'apart', 'cevre']

export function GallerySection() {
  const { settings, gallery, promotionalImageUrl } = useSiteContent()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const galleryItems = useMemo(() => {
    const items: GalleryItem[] = []

    if (promotionalImageUrl) {
      items.push({
        id: 'promotional-poster',
        url: promotionalImageUrl,
        label: 'Tanıtım',
        featured: true,
      })
    }

    gallery.homepage.forEach((photo) => {
      items.push({
        id: photo.id,
        url: photo.url,
        label: GALLERY_CATEGORY_LABELS.homepage,
      })
    })

    GALLERY_CATEGORIES.forEach((category) => {
      gallery[category].forEach((photo) => {
        items.push({
          id: photo.id,
          url: photo.url,
          label: GALLERY_CATEGORY_LABELS[category],
        })
      })
    })

    return items
  }, [gallery, promotionalImageUrl])

  const lightboxPhotos = galleryItems.map((item) => ({ id: item.id, url: item.url }))
  const featuredPoster = galleryItems.find((item) => item.featured)

  if (galleryItems.length === 0) {
    return null
  }

  return (
    <section id="gallery" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Galeri</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {settings.site_title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{settings.about_short}</p>
        </div>

        {featuredPoster && (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="group mt-10 block w-full overflow-hidden rounded-3xl bg-slate-100 shadow-lg ring-1 ring-slate-200 transition hover:shadow-xl"
          >
            <img
              src={featuredPoster.url}
              alt={`${settings.site_title} tanıtım afişi`}
              className="max-h-[520px] w-full object-contain bg-slate-50 transition duration-500 group-hover:scale-[1.01] sm:object-cover sm:object-center"
              loading="lazy"
            />
            <span className="block bg-slate-900/90 px-4 py-3 text-left text-sm font-semibold text-white">
              Tanıtım Afişi
            </span>
          </button>
        )}

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {galleryItems
            .filter((item) => !item.featured)
            .map((item, index) => {
              const lightboxItemIndex = galleryItems.findIndex((entry) => entry.id === item.id)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(lightboxItemIndex)}
                  className={`group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-100 transition hover:shadow-xl ${
                    index % 5 === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.label}
                    className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                      index % 5 === 0 ? 'aspect-square sm:aspect-[4/3]' : 'aspect-square'
                    }`}
                    loading="lazy"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur sm:text-xs">
                    {item.label}
                  </span>
                </button>
              )
            })}
        </div>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          activeIndex={lightboxIndex}
          roomName={`${settings.site_title} Galeri`}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </section>
  )
}
