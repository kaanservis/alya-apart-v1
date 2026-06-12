import type { ReactNode } from 'react'

interface SlideOverPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  wide?: boolean
}

export function SlideOverPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
}: SlideOverPanelProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Paneli kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45"
      />

      <aside
        className={`relative flex h-full w-full flex-col bg-white shadow-2xl ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </aside>
    </div>
  )
}
