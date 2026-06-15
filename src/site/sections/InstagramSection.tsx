import { InstagramButton, InstagramIcon } from '../components/SiteActions'
import { SiteImage } from '../components/SiteImage'
import { useSiteContent } from '../SiteContentContext'

export function InstagramSection() {
  const { settings, apartmentPhotoUrls, displayApartments, loading } = useSiteContent()

  const previewImages = [
    ...displayApartments.map((profile) => profile.coverUrl).filter(Boolean),
    ...apartmentPhotoUrls,
  ]
    .filter((url, index, array) => url && array.indexOf(url) === index)
    .slice(0, 6)

  if (!settings.instagram && !settings.instagram_url) {
    return null
  }

  return (
    <section id="instagram" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#fdf497] via-[#fd5949] to-[#285AEB] p-[1px] shadow-xl">
          <div className="rounded-[calc(1.5rem-1px)] bg-white px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-lg">
              <InstagramIcon className="h-10 w-10" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Instagram
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              {settings.instagram}
            </h2>
            {settings.about_short && (
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">{settings.about_short}</p>
            )}

            {loading ? (
              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-square animate-pulse rounded-xl bg-slate-200" />
                ))}
              </div>
            ) : previewImages.length > 0 ? (
              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
                {previewImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
                  >
                    <SiteImage src={src} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-10">
              <InstagramButton label="Instagram'da Takip Et" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
