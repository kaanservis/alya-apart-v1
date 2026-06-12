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
    <section className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm ring-1 ring-violet-100">
      <div className="border-b border-violet-200/70 bg-white/50 px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
          Operasyon
        </p>
        <h2 className="mt-1 text-xl font-bold text-violet-950 sm:text-2xl">
          Temizlik Bekleyenler
        </h2>
        <p className="mt-1 text-sm text-violet-900/75">
          Çıkış sonrası temizlik gerektiren odalar.
        </p>
      </div>

      <div className="p-5 sm:p-6">
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
          <div className="space-y-4">
            {cleaningUnits.map((unit) => {
              const lastGuest = findLastGuestForUnit(unit.id, reservations)

              return (
                <div
                  key={unit.id}
                  className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Oda
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-blue-900">{unit.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Son Misafir
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-slate-900">
                        {lastGuest?.ad_soyad ?? '—'}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    disabled={processingId === unit.id}
                    onClick={() => handleCompleteCleaning(unit.id)}
                    className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 sm:text-lg"
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
