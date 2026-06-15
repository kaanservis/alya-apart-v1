import { CallButton, InstagramButton, WhatsAppButton } from '../components/SiteActions'
import { useSiteContent } from '../SiteContentContext'

export function ContactSection() {
  const { settings, phoneHref, loading } = useSiteContent()

  if (loading) {
    return (
      <section id="contact" className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-200" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">İletişim</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {settings.welcome_text || settings.site_subtitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            {settings.about_short}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</p>
            <a
              href={phoneHref}
              className="mt-3 block text-xl font-bold text-slate-900 hover:text-blue-700 sm:text-2xl"
            >
              {settings.phone}
            </a>
            <div className="mt-5">
              <CallButton large className="w-full justify-center" />
            </div>
          </article>

          <article className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp</p>
            <p className="mt-3 text-sm text-slate-600">{settings.whatsapp}</p>
            <div className="mt-5">
              <WhatsAppButton className="w-full justify-center" />
            </div>
          </article>

          <article className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instagram</p>
            <p className="mt-3 text-lg font-bold text-slate-900">{settings.instagram}</p>
            <div className="mt-5">
              <InstagramButton className="w-full justify-center px-6 py-3.5 text-sm" label="Takip Et" />
            </div>
          </article>

          <article className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adres</p>
            <p className="mt-3 text-base font-bold leading-relaxed text-slate-900">{settings.site_title}</p>
            <p className="mt-2 text-sm text-slate-600">{settings.address}</p>
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="mt-3 block text-sm font-semibold text-blue-700 hover:underline"
              >
                {settings.email}
              </a>
            )}
            {settings.facebook && (
              <p className="mt-2 text-sm text-slate-600">{settings.facebook}</p>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
