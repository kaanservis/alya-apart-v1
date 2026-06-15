import { useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { findLastGuestForUnit, getCleaningRequiredUnits } from './unitStatusLogic'
import { completeCleaning } from './workflowService'

interface CleaningAlertSectionProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  onUpdated: () => void
}

export function CleaningAlertSection({
  units,
  reservations,
  onUpdated,
}: CleaningAlertSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const cleaningUnits = getCleaningRequiredUnits(units)

  async function handleCompleteCleaning(unitId: string) {
    setProcessingId(unitId)
    setActionError(null)

    try {
      await completeCleaning(unitId)
      onUpdated()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Temizlik tamamlanamadı.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm ring-1 ring-violet-100 max-md:rounded-xl sm:rounded-2xl">
      <div className="border-b border-violet-200/70 bg-white/50 px-3 py-3 max-md:py-2.5 sm:px-6 sm:py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 max-md:text-[9px] sm:text-xs">
          Operasyon
        </p>
        <h2 className="mt-0.5 text-base font-bold text-violet-950 max-md:text-sm sm:mt-1 sm:text-xl lg:text-2xl">
          Temizlik Bekleyenler
        </h2>
        <p className="mt-0.5 text-xs text-violet-900/75 max-md:text-[11px] sm:mt-1 sm:text-sm">
          Çıkış sonrası temizlik gerektiren odalar.
        </p>
      </div>

      <div className="p-3 max-md:p-2.5 sm:p-6">
        {actionError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {cleaningUnits.length === 0 ? (
          <p className="rounded-xl border border-white/80 bg-white/90 px-4 py-5 text-sm font-medium text-slate-600">
            Temizlik bekleyen oda bulunmuyor.
          </p>
        ) : (
          <div className="space-y-2.5 max-md:space-y-2 sm:space-y-4">
            {cleaningUnits.map((unit) => {
              const lastGuest = findLastGuestForUnit(unit.id, reservations)

              return (
                <div
                  key={unit.id}
                  className="rounded-xl border border-violet-200 bg-white p-3 shadow-sm max-md:p-2.5 sm:rounded-2xl sm:p-5"
                >
                  <dl className="grid gap-2 max-md:gap-1.5 sm:grid-cols-2 sm:gap-3">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 max-md:text-[9px] sm:text-xs">
                        Oda
                      </dt>
                      <dd className="mt-0.5 text-sm font-bold text-blue-900 max-md:text-xs sm:mt-1 sm:text-lg">
                        {unit.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 max-md:text-[9px] sm:text-xs">
                        Son Misafir
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-bold text-slate-900 max-md:text-xs sm:mt-1 sm:text-lg">
                        {lastGuest?.ad_soyad ?? '—'}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    disabled={processingId === unit.id}
                    onClick={() => handleCompleteCleaning(unit.id)}
                    className="mt-2.5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 max-md:mt-2 max-md:py-2 max-md:text-xs sm:mt-4 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base lg:text-lg"
                  >
                    {processingId === unit.id ? 'İşleniyor...' : 'Temizlik Tamamlandı'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
