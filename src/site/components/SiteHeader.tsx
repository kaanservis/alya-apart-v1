import { useEffect, useState } from 'react'
import { scrollToSection } from '../siteConfig'
import { getSiteHomePath } from '../siteRouter'
import { PUBLIC_NAV_LINKS } from '../siteSections'
import { useSiteContent } from '../SiteContentContext'

interface SiteHeaderProps {
  privatePage?: boolean
}

export function SiteHeader({ privatePage = false }: SiteHeaderProps) {
  const { settings } = useSiteContent()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleNavClick(sectionId: string) {
    setMenuOpen(false)
    if (privatePage) {
      window.location.href = `${getSiteHomePath()}#${sectionId}`
      return
    }
    scrollToSection(sectionId)
  }

  function handleHomeClick() {
    setMenuOpen(false)
    if (privatePage) {
      window.location.href = getSiteHomePath()
      return
    }
    scrollToSection('hero')
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <button type="button" onClick={handleHomeClick} className="group text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-600 sm:text-xs">
            {settings.address}
          </p>
          <p className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-800 sm:text-xl">
            {settings.site_title}
          </p>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() =>
                link.id === 'hero' ? handleHomeClick() : handleNavClick(link.id)
              }
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-xl p-2 text-slate-700 ring-1 ring-slate-200 lg:hidden"
          aria-label="Menüyü aç"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-2">
            {PUBLIC_NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() =>
                  link.id === 'hero' ? handleHomeClick() : handleNavClick(link.id)
                }
                className="rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
