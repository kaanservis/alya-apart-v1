import { type ReactNode } from 'react'
import { FloatingActionButtons } from './SiteActions'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

interface SiteLayoutProps {
  children: ReactNode
  privatePage?: boolean
}

export function SiteLayout({ children, privatePage = false }: SiteLayoutProps) {
  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900 antialiased">
      <SiteHeader privatePage={privatePage} />
      <main>{children}</main>
      <SiteFooter privatePage={privatePage} />
      <FloatingActionButtons />
    </div>
  )
}
