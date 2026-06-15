import { useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { getRemainingBalance } from '../reservations/depositCalculations'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { getCheckoutPendingGuests } from './unitStatusLogic'
import { completeCheckout } from './workflowService'

interface CheckoutAlertSectionProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  onUpdated: () => void
}

export function CheckoutAlertSection({
  units,
  reservations,
  onUpdated,
}: CheckoutAlertSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const pendingGuests = getCheckoutPendingGuests(units, reservations)

  async function handleCompleteCheckout(reservationId: string, unitId: string) {
    setProcessingId(reservationId)
    setActionError(null)

    try {
      await completeCheckout(reservationId, unitId)
      onUpdated()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Çıkış tamamlanamadı.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm ring-1 ring-orange-100 max-md:rounded-xl sm:rounded-2xl">
      <div className="border-b border-orange-200/70 bg-white/50 px-3 py-3 max-md:py-2.5 sm:px-6 sm:py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 max-md:text-[9px] sm:text-xs">
          Operasyon
        </p>
        <h2 className="mt-0.5 text-base font-bold text-orange-950 max-md:text-sm sm:mt-1 sm:text-xl lg:text-2xl">
          Çıkış Bekleyenler
        </h2>
        <p className="mt-0.5 text-xs text-orange-900/75 max-md:text-[11px] sm:mt-1 sm:text-sm">
          Bugün çıkış tarihi olan aktif rezervasyonlar.
        </p>
      </div>

      <div className="p-3 max-md:p-2.5 sm:p-6">
        {actionError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {pendingGuests.length === 0 ? (
          <p className="rounded-xl border border-white/80 bg-white/90 px-4 py-5 text-sm font-medium text-slate-600">
            Çıkış bekleyen oda bulunmuyor.
          </p>
        ) : (
          <div className="space-y-2.5 max-md:space-y-2 sm:space-y-4">
            {pendingGuests.map(({ reservation, unit }) => (
              <div
                key={reservation.id}
                className="rounded-xl border border-orange-200 bg-white p-3 shadow-sm max-md:p-2.5 sm:rounded-2xl sm:p-5"
              >
                <dl className="grid gap-2 max-md:gap-1.5 sm:grid-cols-3 sm:gap-3">
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
                      Misafir
                    </dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-slate-900 max-md:text-xs sm:mt-1 sm:text-lg">
                      {reservation.ad_soyad}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 max-md:text-[9px] sm:text-xs">
                      Çıkış Tarihi
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-orange-800 max-md:text-xs sm:mt-1 sm:text-lg">
                      {formatReservationDate(reservation.cikis_tarihi)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-2.5 border-t border-orange-100 pt-2.5 max-md:mt-2 max-md:pt-2 sm:mt-4 sm:pt-4">
                  <WhatsAppGuestActions
                    phone={reservation.telefon}
                    adSoyad={reservation.ad_soyad}
                    kalanBakiye={getRemainingBalance(reservation)}
                  />
                </div>

                <button
                  type="button"
                  disabled={processingId === reservation.id}
                  onClick={() => handleCompleteCheckout(reservation.id, unit.id)}
                  className="mt-2.5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 max-md:mt-2 max-md:py-2 max-md:text-xs sm:mt-4 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base lg:text-lg"
                >
                  {processingId === reservation.id ? 'İşleniyor...' : 'Çıkışı Tamamla'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
