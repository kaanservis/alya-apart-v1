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
    <section className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm ring-1 ring-orange-100">
      <div className="border-b border-orange-200/70 bg-white/50 px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
          Operasyon
        </p>
        <h2 className="mt-1 text-xl font-bold text-orange-950 sm:text-2xl">Çıkış Bekleyenler</h2>
        <p className="mt-1 text-sm text-orange-900/75">
          Bugün çıkış tarihi olan aktif rezervasyonlar.
        </p>
      </div>

      <div className="p-5 sm:p-6">
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
          <div className="space-y-4">
            {pendingGuests.map(({ reservation, unit }) => (
              <div
                key={reservation.id}
                className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Oda
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-blue-900">{unit.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Misafir
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-slate-900">
                      {reservation.ad_soyad}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Çıkış Tarihi
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-orange-800">
                      {formatReservationDate(reservation.cikis_tarihi)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-orange-100 pt-4">
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
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 sm:text-lg"
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
