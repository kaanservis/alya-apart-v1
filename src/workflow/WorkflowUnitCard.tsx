import { useState } from 'react'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import type { AccommodationUnit, Reservation } from '../types/database'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { getRemainingBalance } from '../reservations/depositCalculations'
import { getGuestInitials } from '../guests/guestDisplay'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { completeCheckout, completeCleaning } from './workflowService'
import { normalizeUnitStatus } from './unitStatusLogic'
import { UNIT_STATUS_ROOM_CLASS } from './unitStatusColors'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'

interface WorkflowUnitCardProps {
  unit: AccommodationUnit
  activeReservation?: Reservation
  nextReservation?: Reservation
  checkoutReservationId?: string
  onUpdated: () => void
  onSelect?: () => void
}

export function WorkflowUnitCard({
  unit,
  activeReservation,
  nextReservation,
  checkoutReservationId,
  onUpdated,
  onSelect,
}: WorkflowUnitCardProps) {
  const formatCurrency = useFormatAdminCurrency()
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const normalizedStatus = normalizeUnitStatus(unit.status)
  const roomStatusClass = UNIT_STATUS_ROOM_CLASS[normalizedStatus]

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
      className={`workflow-room-card ${roomStatusClass} group rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="workflow-room-text truncate text-2xl font-bold tracking-tight">{unit.name}</h3>
        </div>
        <WorkflowStatusBadge status={normalizedStatus} />
      </div>

      {activeReservation && (
        <div className="workflow-room-panel mt-4 rounded-xl px-4 py-3">
          <p className="workflow-room-text-muted text-xs font-semibold uppercase tracking-wide">Misafir</p>
          <p className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-xs font-bold text-black">
            {getGuestInitials(activeReservation.ad_soyad)}
          </p>
          <p className="workflow-room-text mt-1 text-base font-bold">{activeReservation.ad_soyad}</p>
          <p className="workflow-room-text mt-2 text-sm font-semibold">
            👥 {activeReservation.kisi_sayisi} Kişi
          </p>
          <p className="workflow-room-text mt-1 text-sm font-bold">
            Kalan: {formatCurrency(getRemainingBalance(activeReservation))}
          </p>
          <p className="workflow-room-text-muted mt-1 text-xs">
            Çıkış: {formatReservationDate(activeReservation.cikis_tarihi)}
          </p>
          <div className="mt-3" onClick={(event) => event.stopPropagation()}>
            <WhatsAppGuestActions
              phone={activeReservation.telefon}
              adSoyad={activeReservation.ad_soyad}
              kalanBakiye={getRemainingBalance(activeReservation)}
              compact
            />
          </div>
        </div>
      )}

      {nextReservation && (
        <div className="workflow-room-panel mt-4 rounded-xl px-4 py-3">
          <p className="workflow-room-text text-xs font-bold uppercase tracking-wide">
            Sonraki Misafir
          </p>
          <p className="workflow-room-text mt-1 text-sm font-bold">{nextReservation.ad_soyad}</p>
          <p className="workflow-room-text-muted mt-2 text-sm">
            Giriş: {formatReservationDate(nextReservation.giris_tarihi)}
          </p>
        </div>
      )}

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {actionError}
        </p>
      )}

      {normalizedStatus === 'Çıkış Bekliyor' && checkoutReservationId && (
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation()
            void handleCompleteCheckout()
          }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-60"
        >
          {processing ? 'İşleniyor...' : 'Çıkışı Tamamla'}
        </button>
      )}

      {normalizedStatus === 'Temizlik Bekliyor' && (
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation()
            void handleCompleteCleaning()
          }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-yellow-600 disabled:opacity-60"
        >
          {processing ? 'İşleniyor...' : 'Temizlik Tamamlandı'}
        </button>
      )}
    </article>
  )
}
