import type { ReactNode } from 'react'

interface SlideOverPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  wide?: boolean
  /** Show fixed full-width KAPAT bar at bottom on mobile */
  mobileStickyClose?: boolean
}

export function SlideOverPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
  mobileStickyClose = false,
}: SlideOverPanelProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <button
        type="button"
        aria-label="Paneli kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45"
      />

      <aside
        className={`relative flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-white shadow-2xl ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200 px-5 py-4 sm:px-6 max-md:px-2 max-md:py-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl max-md:text-[13px]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-slate-600 max-md:text-[11px]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 max-md:hidden ${
              mobileStickyClose ? 'md:inline-flex' : ''
            }`}
          >
            Kapat
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-5 sm:px-6 max-md:px-2 max-md:py-2 ${
            mobileStickyClose ? 'max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : ''
          }`}
        >
          {children}
        </div>

        {mobileStickyClose && (
          <div
            className="fixed bottom-0 left-0 right-0 z-[60] border-t border-slate-200 bg-white px-2 pt-2 md:hidden"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-700 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-800"
            >
              Kapat
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
