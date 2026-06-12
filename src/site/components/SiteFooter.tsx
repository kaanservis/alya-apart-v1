import { scrollToSection } from '../siteConfig'
import { getSiteHomePath } from '../siteRouter'
import { useSiteContent } from '../SiteContentContext'

interface SiteFooterProps {
  privatePage?: boolean
}

export function SiteFooter({ privatePage = false }: SiteFooterProps) {
  const { settings } = useSiteContent()

  function goToSection(sectionId: string) {
    if (privatePage) {
      window.location.href = `${getSiteHomePath()}#${sectionId}`
      return
    }
    scrollToSection(sectionId)
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-lg font-bold text-white">{settings.site_title}</p>
          <p className="mt-1 text-sm text-slate-400">{settings.site_subtitle}</p>
          <p className="mt-1 text-xs text-slate-500">{settings.meta_keywords}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => goToSection('gallery')}
            className="text-sm font-medium hover:text-white"
          >
            Galeri
          </button>
          <button
            type="button"
            onClick={() => goToSection('contact')}
            className="text-sm font-medium hover:text-white"
          >
            İletişim
          </button>
          <a href="/admin" className="text-sm font-medium hover:text-white">
            Yönetim
          </a>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {settings.site_title}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
