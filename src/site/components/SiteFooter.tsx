import { ADMIN_ENTRY_PATH } from '../../app/appSection'
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
            onClick={() => goToSection('apartments')}
            className="text-sm font-medium hover:text-white"
          >
            Apartlar
          </button>
          <button
            type="button"
            onClick={() => goToSection('contact')}
            className="text-sm font-medium hover:text-white"
          >
            İletişim
          </button>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {settings.site_title}. Tüm hakları saklıdır.</p>
        <a
          href={ADMIN_ENTRY_PATH}
          className="mt-2 inline-block text-[11px] text-slate-600 transition hover:text-slate-400"
        >
          Yönetim Girişi
        </a>
      </div>
    </footer>
  )
}
