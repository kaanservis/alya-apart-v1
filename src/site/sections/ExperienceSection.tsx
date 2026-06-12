import { GALLERY_CATEGORY_LABELS } from '../../website/websiteContentDefaults'
import type { WebsiteGalleryCategory } from '../../types/database'
import { useSiteContent } from '../SiteContentContext'

const EXPERIENCE_CATEGORIES: WebsiteGalleryCategory[] = ['deniz', 'plaj', 'apart', 'cevre']

export function ExperienceSection() {
  const { settings, getGalleryPhotos } = useSiteContent()
  const bannerPhoto = getGalleryPhotos('homepage')[0] ?? getGalleryPhotos('deniz')[0]

  return (
    <section id="experience" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {bannerPhoto && (
          <div className="relative mb-12 overflow-hidden rounded-3xl shadow-xl">
            <img
              src={bannerPhoto.url}
              alt={settings.site_title}
              className="aspect-[21/9] w-full object-cover sm:aspect-[24/9]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-200">
                {settings.site_title}
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                {settings.site_subtitle}
              </h2>
            </div>
          </div>
        )}

        {settings.about_short && (
          <p className="mb-10 max-w-3xl text-base leading-relaxed text-slate-600">{settings.about_short}</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCE_CATEGORIES.map((category) => {
            const photo = getGalleryPhotos(category)[0]
            if (!photo) {
              return null
            }

            return (
              <article
                key={category}
                className="group overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="overflow-hidden">
                  <img
                    src={photo.url}
                    alt={GALLERY_CATEGORY_LABELS[category]}
                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900">{GALLERY_CATEGORY_LABELS[category]}</h3>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
