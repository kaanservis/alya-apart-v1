import { LocationButton } from '../components/SiteActions'
import { useSiteContent } from '../SiteContentContext'

export function LocationSection() {
  const { settings, mapsEmbedSrc, loading } = useSiteContent()

  if (loading) {
    return (
      <section id="location" className="scroll-mt-20 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-200" />
            </div>
            <div className="h-[360px] animate-pulse rounded-3xl bg-slate-200 sm:h-[480px]" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="location" className="scroll-mt-20 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Konum</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {settings.site_subtitle}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{settings.about_short}</p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">
                  AA
                </span>
                <div>
                  <p className="font-bold text-slate-900">{settings.site_title}</p>
                  <p className="text-sm text-slate-600">{settings.address}</p>
                </div>
              </li>
            </ul>

            <div className="mt-8">
              <LocationButton label="Haritada Aç" />
            </div>
          </div>

          {mapsEmbedSrc && (
            <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-200">
              <iframe
                title={`${settings.site_title} Google Maps konumu`}
                src={mapsEmbedSrc}
                className="h-[360px] w-full border-0 sm:h-[480px] lg:h-[520px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
