import { useSiteContent } from '../SiteContentContext'

export function AboutSection() {
  const { settings, loading } = useSiteContent()

  if (loading) {
    return (
      <section id="about" className="scroll-mt-20 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-10 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </section>
    )
  }

  if (!settings.about_content.trim()) {
    return null
  }

  return (
    <section id="about" className="scroll-mt-20 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Hakkımızda</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {settings.site_title}
        </h2>
        <div
          className="prose prose-slate mt-6 max-w-none text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: settings.about_content }}
        />
      </div>
    </section>
  )
}
