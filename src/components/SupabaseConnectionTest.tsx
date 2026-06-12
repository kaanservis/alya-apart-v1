import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  runSupabaseConnectionTest,
  type SupabaseConnectionReport,
} from '../lib/supabaseConnectionTest'

interface SupabaseConnectionTestProps {
  collapsible?: boolean
  defaultCollapsed?: boolean
  title?: string
}

export function SupabaseConnectionTest({
  collapsible = false,
  defaultCollapsed = false,
  title = 'Supabase Bağlantı Testi',
}: SupabaseConnectionTestProps) {
  const [report, setReport] = useState<SupabaseConnectionReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(!defaultCollapsed)

  useEffect(() => {
    async function verifyConnection() {
      setLoading(true)
      const result = await runSupabaseConnectionTest()
      setReport(result)
      setLoading(false)
    }

    void verifyConnection()
  }, [])

  const statusClass = report?.allPassed
    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
    : report
      ? 'border-red-200 bg-red-50/80 text-red-900'
      : 'border-blue-100 bg-white text-slate-600'

  if (collapsible) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Altyapı
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {!loading && report && (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  report.allPassed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {report.allPassed ? 'OK' : 'Hata'}
              </span>
            )}
            <span className="text-sm font-semibold text-slate-400">{isOpen ? '▲' : '▼'}</span>
          </div>
        </button>

        {isOpen && (
          <div className={`border-t px-5 py-4 text-sm sm:px-6 ${statusClass}`}>
            {loading ? (
              <p>Supabase bağlantısı test ediliyor...</p>
            ) : report ? (
              <>
                <ul className="space-y-1">
                  <li>
                    Ortam değişkenleri: {report.configured ? 'Yapılandırıldı' : 'Eksik'}
                  </li>
                  <li>İstemci: {report.clientInitialized ? 'Başlatıldı' : 'Başlatılamadı'}</li>
                  {report.results.map((result) => (
                    <li key={result.table}>
                      {result.name} ({result.table}):{' '}
                      {result.status === 'success'
                        ? 'OK'
                        : result.status === 'skipped'
                          ? 'Atlandı'
                          : `Hata — ${result.message}`}
                    </li>
                  ))}
                </ul>
                {!isSupabaseConfigured && (
                  <p className="mt-2 text-xs opacity-80">
                    `.env` dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini
                    kontrol edin.
                  </p>
                )}
              </>
            ) : null}
          </div>
        )}
      </section>
    )
  }

  if (loading) {
    return (
      <div className="mb-5 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Supabase bağlantısı test ediliyor...
      </div>
    )
  }

  if (!report) {
    return null
  }

  return (
    <div className={`mb-5 rounded-xl border px-4 py-3 text-sm shadow-sm ${statusClass}`}>
      <p className="font-bold">{title}</p>
      <ul className="mt-2 space-y-1">
        <li>Ortam değişkenleri: {report.configured ? 'Yapılandırıldı' : 'Eksik'}</li>
        <li>İstemci: {report.clientInitialized ? 'Başlatıldı' : 'Başlatılamadı'}</li>
        {report.results.map((result) => (
          <li key={result.table}>
            {result.name} ({result.table}):{' '}
            {result.status === 'success'
              ? 'OK'
              : result.status === 'skipped'
                ? 'Atlandı'
                : `Hata — ${result.message}`}
          </li>
        ))}
      </ul>
      {!isSupabaseConfigured && (
        <p className="mt-2 text-xs opacity-80">
          `.env` dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini kontrol edin.
        </p>
      )}
    </div>
  )
}
