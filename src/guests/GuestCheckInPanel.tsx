import { useEffect, useState } from 'react'
import { SlideOverPanel } from '../components/SlideOverPanel'
import type { Reservation } from '../types/database'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { GuestRegistrationBadge } from './GuestRegistrationBadge'
import { completeOdaKabul } from '../workflow/workflowService'
import { isOdaKabulYapildi } from '../workflow/roomDisplayStatus'
import { getGuestRegistrationStatus } from './guestRegistrationStatus'
import type { GuestEntryWithPhotos } from './guestTypes'
import { ReservationGuestsPanel } from './ReservationGuestsPanel'
import { ReservationCariHesapSection } from '../reservations/ReservationCariHesapSection'

interface GuestCheckInPanelProps {
  open: boolean
  onClose: () => void
  reservation: Reservation
  unitName: string
  onUpdated: () => void
  onOdaKabulComplete?: () => void
  guestRefreshToken?: number
}

export function GuestCheckInPanel({
  open,
  onClose,
  reservation,
  unitName,
  onUpdated,
  onOdaKabulComplete,
  guestRefreshToken = 0,
}: GuestCheckInPanelProps) {
  const [guests, setGuests] = useState<GuestEntryWithPhotos[]>([])
  const [error, setError] = useState<string | null>(null)
  const [completingOdaKabul, setCompletingOdaKabul] = useState(false)
  const [paymentRefreshToken, setPaymentRefreshToken] = useState(0)

  const registrationStatus = getGuestRegistrationStatus(reservation, guests)

  useEffect(() => {
    if (!open) {
      return
    }

    setError(null)
  }, [open, reservation.id, guestRefreshToken])

  async function handleCompleteOdaKabul() {
    if (isOdaKabulYapildi(reservation)) {
      return
    }

    setCompletingOdaKabul(true)
    setError(null)

    try {
      await completeOdaKabul(reservation.id)
      onUpdated()
      onClose()
      onOdaKabulComplete?.()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'ODA KABUL tamamlanamadı.')
    } finally {
      setCompletingOdaKabul(false)
    }
  }

  function handlePaymentUpdated() {
    setPaymentRefreshToken((current) => current + 1)
    onUpdated()
  }

  if (!open) {
    return null
  }

  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      wide
      title="ODA KABUL"
      subtitle={`Misafir Kabul • ${unitName} • ${reservation.ad_soyad}`}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 max-md:p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <GuestRegistrationBadge status={registrationStatus} />
            <span className="text-xs font-medium text-slate-600">
              {guests.length} / {reservation.kisi_sayisi} misafir kayıtlı
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-sm max-md:gap-1.5 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Giriş
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatReservationDate(reservation.giris_tarihi)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Çıkış
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatReservationDate(reservation.cikis_tarihi)}
              </dd>
            </div>
          </dl>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <ReservationGuestsPanel
          reservation={reservation}
          onUpdated={onUpdated}
          onGuestsChange={setGuests}
          refreshToken={guestRefreshToken}
        />

        <ReservationCariHesapSection
          reservation={reservation}
          refreshToken={paymentRefreshToken}
          showTopSummary
          onUpdated={handlePaymentUpdated}
        />

        {!isOdaKabulYapildi(reservation) && (
          <button
            type="button"
            disabled={completingOdaKabul}
            onClick={() => void handleCompleteOdaKabul()}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-red-600/30 transition hover:from-red-700 hover:to-red-800 disabled:opacity-60 sm:py-5 sm:text-lg"
          >
            {completingOdaKabul ? 'Tamamlanıyor...' : 'ODA KABULÜ TAMAMLA'}
          </button>
        )}

        {isOdaKabulYapildi(reservation) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
            ✓ ODA KABUL tamamlandı — oda DOLU durumunda.
          </div>
        )}
      </div>
    </SlideOverPanel>
  )
}
