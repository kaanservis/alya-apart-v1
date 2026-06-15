import { useMemo, useState } from 'react'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { SiteImage } from '../components/SiteImage'
import { useSiteContent } from '../SiteContentContext'

interface GalleryItem {
  id: string
  url: string
  label: string
}

export function GallerySection() {
  const { settings, displayApartments, loading } = useSiteContent()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const galleryItems = useMemo(() => {
    const items: GalleryItem[] = []

    displayApartments.forEach((profile) => {
      profile.photos.forEach((photo) => {
        items.push({
          id: `${profile.apartment.id}-${photo.id}`,
          url: photo.photoUrl,
          label: profile.apartment.name,
        })
      })
    })

    return items
  }, [displayApartments])

  const lightboxPhotos = galleryItems.map((item) => ({ id: item.id, url: item.url }))

  if (loading) {
    return (
      <section id="gallery" className="scroll-mt-20 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </section>
    )
  }

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
          {settings.about_short && (
            <p className="mt-4 text-base leading-relaxed text-slate-600">{settings.about_short}</p>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {galleryItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={`group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-100 transition hover:shadow-xl ${
                index % 5 === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <SiteImage
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
          ))}
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
