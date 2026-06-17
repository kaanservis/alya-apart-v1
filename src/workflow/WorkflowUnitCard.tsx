import { useEffect, useMemo, useState } from 'react'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import { getGuestWhatsAppUrl } from '../lib/whatsapp'
import type { AccommodationUnit, Reservation } from '../types/database'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { buildPaymentSummary } from '../reservations/paymentCalculations'
import { fetchReservationPaymentState } from '../reservations/tahsilatService'
import { completeCheckout, completeCleaning } from './workflowService'
import {
  canShowOdaKabulButton,
  computeRoomDisplayStatus,
  isOdaKabulYapildi,
} from './roomDisplayStatus'
import { getTodayKey } from './unitStatusLogic'
import { ROOM_DISPLAY_ROOM_CLASS } from './roomDisplayColors'
import { RoomCardIconBar } from './RoomCardIconBar'
import { CheckInCompleteBadge, WorkflowStatusBadge } from './WorkflowStatusBadge'

interface WorkflowUnitCardProps {
  unit: AccommodationUnit
  activeReservation?: Reservation
  nextReservation?: Reservation
  checkoutReservationId?: string
  onUpdated: () => void
  onSelect?: () => void
  onOpenCheckIn?: (reservation: Reservation) => void
  onOpenPayment?: (reservation: Reservation) => void
  onOpenPdf?: (reservation: Reservation) => void
}

export function WorkflowUnitCard({
  unit,
  activeReservation,
  nextReservation,
  checkoutReservationId,
  onUpdated,
  onSelect,
  onOpenCheckIn,
  onOpenPayment,
  onOpenPdf,
}: WorkflowUnitCardProps) {
  const formatCurrency = useFormatAdminCurrency()
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [remainingBalance, setRemainingBalance] = useState(0)

  useEffect(() => {
    if (!activeReservation) {
      setRemainingBalance(0)
      return
    }

    let cancelled = false

    void fetchReservationPaymentState(activeReservation.id)
      .then((state) => {
        if (!cancelled) {
          setRemainingBalance(state.summary.remainingBalance)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemainingBalance(buildPaymentSummary(activeReservation, []).remainingBalance)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeReservation?.id, activeReservation?.updated_at])

  const displayStatus = useMemo(() => {
    const base = computeRoomDisplayStatus(unit, activeReservation)
    if (base !== 'Boş' || !nextReservation) {
      return base
    }

    if (
      nextReservation.giris_tarihi === getTodayKey() &&
      !isOdaKabulYapildi(nextReservation)
    ) {
      return 'Bugün Giriş'
    }

    return base
  }, [unit, activeReservation, nextReservation])

  const checkInReservation =
    activeReservation ??
    (displayStatus === 'Bugün Giriş' ? nextReservation : undefined)
  const roomStatusClass = ROOM_DISPLAY_ROOM_CLASS[displayStatus]
  const guestReservation = activeReservation ?? nextReservation
  const showOdaKabul = canShowOdaKabulButton(displayStatus, checkInReservation)
  const showCheckInBadge =
    displayStatus === 'Dolu' && activeReservation && isOdaKabulYapildi(activeReservation)

  async function handleCompleteCheckout() {
    if (!checkoutReservationId) {
      return
    }

    setProcessing(true)
    setActionError(null)

    try {
      await completeCheckout(checkoutReservationId, unit.id)
      onUpdated()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Çıkış tamamlanamadı.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleCompleteCleaning() {
    setProcessing(true)
    setActionError(null)

    try {
      await completeCleaning(unit.id)
      onUpdated()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Temizlik tamamlanamadı.')
    } finally {
      setProcessing(false)
    }
  }

  function openCheckIn(reservation: Reservation) {
    onOpenCheckIn?.(reservation)
  }

  return (
    <article
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onSelect()
        }
      }}
      className={`workflow-room-card ${roomStatusClass} group rounded-xl p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg max-md:p-1.5 sm:rounded-2xl sm:p-5 md:p-6 ${
        onSelect ? 'cursor-pointer' : ''
      } ${displayStatus === 'Bugün Giriş' ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 max-md:gap-1 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="workflow-room-text truncate text-lg font-bold tracking-tight max-md:text-base sm:text-2xl">
            {unit.name}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {guestReservation && (
            <RoomCardIconBar
              whatsAppUrl={
                guestReservation.telefon ? getGuestWhatsAppUrl(guestReservation.telefon) : null
              }
              showOdaKabul={showOdaKabul}
              onOdaKabul={() => checkInReservation && openCheckIn(checkInReservation)}
              onKimlikler={() => checkInReservation && openCheckIn(checkInReservation)}
              onPdf={
                activeReservation && onOpenPdf ? () => onOpenPdf(activeReservation) : undefined
              }
              onPayment={
                activeReservation && onOpenPayment
                  ? () => onOpenPayment(activeReservation)
                  : undefined
              }
            />
          )}
          <WorkflowStatusBadge
            status={displayStatus}
            prominent={displayStatus === 'Bugün Giriş'}
          />
        </div>
      </div>

      {activeReservation && (
        <div className="workflow-room-panel mt-2 rounded-lg px-3 py-2 max-md:mt-1.5 max-md:px-2 max-md:py-1.5 sm:mt-4 sm:rounded-xl sm:px-4 sm:py-3">
          <p className="workflow-room-text truncate text-base font-bold max-md:text-sm sm:text-base">
            {activeReservation.ad_soyad}
          </p>
          <p className="workflow-room-text mt-0.5 truncate text-[11px] font-semibold max-md:text-[10px] sm:text-sm">
            👥 {activeReservation.kisi_sayisi} Kişi · Kalan: {formatCurrency(remainingBalance)} ·
            Çıkış: {formatReservationDate(activeReservation.cikis_tarihi)}
          </p>

          {showCheckInBadge && (
            <div className="mt-1.5 max-md:mt-1">
              <CheckInCompleteBadge />
            </div>
          )}
        </div>
      )}

      {!activeReservation && nextReservation && (
        <div className="workflow-room-panel mt-2 rounded-lg px-3 py-2 max-md:mt-1.5 max-md:px-2 max-md:py-1.5 sm:mt-4 sm:rounded-xl sm:px-4 sm:py-3">
          <p className="workflow-room-text text-[10px] font-bold uppercase tracking-wide max-md:text-[9px] sm:text-xs">
            Sonraki Misafir
          </p>
          <p className="workflow-room-text mt-0.5 truncate text-sm font-bold max-md:text-base sm:text-sm">
            {nextReservation.ad_soyad}
          </p>
          <p className="workflow-room-text-muted mt-1 truncate text-[11px] max-md:text-xs sm:text-sm">
            Giriş: {formatReservationDate(nextReservation.giris_tarihi)}
          </p>
        </div>
      )}

      {showOdaKabul && checkInReservation && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            openCheckIn(checkInReservation)
          }}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-red-600/30 transition hover:from-red-700 hover:to-red-800 max-md:py-3.5 max-md:text-sm sm:mt-4 sm:py-5 sm:text-lg"
        >
          ODA KABUL
        </button>
      )}

      {actionError && (
        <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] text-red-700 ring-1 ring-red-100 max-md:mt-1.5 sm:mt-4 sm:px-3 sm:py-2 sm:text-xs">
          {actionError}
        </p>
      )}

      {displayStatus === 'Çıkış Bugün' && checkoutReservationId && (
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation()
            void handleCompleteCheckout()
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 max-md:mt-2.5 max-md:py-2 max-md:text-xs sm:mt-4 sm:px-5 sm:py-3 sm:text-base"
        >
          <span aria-hidden>✓</span>
          {processing ? 'İşleniyor...' : 'Çıkışı Tamamla'}
        </button>
      )}

      {displayStatus === 'Temizlik Bekliyor' && (
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation()
            void handleCompleteCleaning()
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-yellow-600 disabled:opacity-60 max-md:mt-2.5 max-md:py-2 max-md:text-xs sm:mt-4 sm:px-5 sm:py-3 sm:text-base"
        >
          <span aria-hidden>🧹</span>
          {processing ? 'İşleniyor...' : 'Temizlik Tamamlandı'}
        </button>
      )}
    </article>
  )
}
