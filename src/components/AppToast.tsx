import { useEffect } from 'react'

interface AppToastProps {
  message: string
  onDismiss: () => void
  durationMs?: number
}

export function AppToast({ message, onDismiss, durationMs = 3500 }: AppToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss, durationMs])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 max-md:bottom-4 max-md:px-4 max-md:py-2.5 max-md:text-xs"
    >
      {message}
    </div>
  )
}
