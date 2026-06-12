import { useState } from 'react'
import { exportJsonBackup } from './backupService'

export function QuickBackupButton() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleQuickBackup() {
    setBusy(true)
    setMessage(null)
    setError(null)

    try {
      const result = await exportJsonBackup()
      setMessage(`Yedek alındı: ${result.fileName}`)
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : 'Hızlı yedek alınamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3">
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleQuickBackup()}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-6 text-white shadow-xl shadow-slate-800/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-800/40 disabled:opacity-60 sm:px-10 sm:py-7"
      >
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-110" />
        <div className="relative flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/25 backdrop-blur-sm">
            ⬇
          </span>
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold uppercase tracking-wide sm:text-2xl">
              {busy ? 'Yedekleniyor...' : 'Hızlı Yedek Al'}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Tek tıkla JSON yedek — ayar gerekmez
            </p>
          </div>
        </div>
      </button>
    </section>
  )
}
