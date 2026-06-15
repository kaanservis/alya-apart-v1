import { APARTMENT_FEATURES } from '../../website/apartmentDefaults'
import { SiteImage } from '../components/SiteImage'
import { useSiteContent } from '../SiteContentContext'

export function ApartmentsSection() {
  const { settings, displayApartments, loading } = useSiteContent()

  if (loading) {
    return (
      <section id="apartments" className="scroll-mt-20 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid gap-8 lg:grid-cols-2">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200"
              >
                <div className="aspect-[16/10] animate-pulse bg-slate-200" />
                <div className="space-y-3 p-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (displayApartments.length === 0) {
    return null
  }

  return (
    <section id="apartments" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
            {settings.site_title}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {settings.site_subtitle}
          </h2>
          {settings.about_short && (
            <p className="mt-4 text-base leading-relaxed text-slate-600">{settings.about_short}</p>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {displayApartments.map((profile) => {
            const activeFeatures = APARTMENT_FEATURES.filter(
              (feature) => profile.apartment[feature.key],
            )

            return (
              <article
                key={profile.apartment.id}
                className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100"
              >
                <SiteImage
                  src={profile.coverUrl}
                  alt={profile.apartment.name}
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />

                <div className="space-y-5 p-6 sm:p-8">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{profile.apartment.name}</h3>
                    {profile.apartment.description && (
                      <p className="mt-3 text-base leading-relaxed text-slate-600">
                        {profile.apartment.description}
                      </p>
                    )}
                  </div>

                  {activeFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFeatures.map((feature) => (
                        <span
                          key={feature.key}
                          className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-100"
                        >
                          {feature.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {profile.photos.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Galeri
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {profile.photos.map((photo) => (
                          <SiteImage
                            key={String(photo.id)}
                            src={photo.photoUrl}
                            alt={`${profile.apartment.name} galeri`}
                            className="aspect-square w-full rounded-xl object-cover ring-1 ring-slate-200"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
