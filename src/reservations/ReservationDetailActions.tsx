import { useState } from 'react'
import type { Reservation } from '../types/database'
import {
  adminActionBtnDanger,
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import {
  cancelReservation,
  markReservationNoShow,
} from '../workflow/workflowService'
import { isOdaKabulYapildi } from '../workflow/roomDisplayStatus'
import type { AccommodationUnit } from '../types/database'

type ConfirmAction = 'cancel' | 'noShow' | null

interface ReservationDetailActionsProps {
  reservation: Reservation
  unit: Pick<AccommodationUnit, 'id' | 'name' | 'status'>
  onUpdated: () => void
  onOpenCheckIn?: () => void
  onExportPdf?: () => void
  exportingPdf?: boolean
  compact?: boolean
}

export function ReservationDetailActions({
  reservation,
  unit: _unit,
  onUpdated,
  onOpenCheckIn,
  onExportPdf,
  exportingPdf = false,
  compact = false,
}: ReservationDetailActionsProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  async function handleConfirm() {
    if (!confirmAction) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      if (confirmAction === 'cancel') {
        await cancelReservation(reservation.id)
      } else if (confirmAction === 'noShow') {
        await markReservationNoShow(reservation.id)
      }

      setConfirmAction(null)
      onUpdated()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'İşlem tamamlanamadı.')
    } finally {
      setProcessing(false)
    }
  }

  const btnClass = compact
    ? `${adminActionBtnSecondary} text-xs`
    : adminActionBtnSecondary

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {reservation.durum === 'Aktif' && !isOdaKabulYapildi(reservation) && onOpenCheckIn && (
          <button type="button" onClick={onOpenCheckIn} className={adminActionBtnPrimary}>
            ODA KABUL
          </button>
        )}

        {reservation.durum === 'Aktif' && (
          <>
            <button
              type="button"
              disabled={processing}
              onClick={() => setConfirmAction('cancel')}
              className={adminActionBtnDanger}
            >
              REZERVASYON İPTAL
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => setConfirmAction('noShow')}
              className={btnClass}
            >
              GELMEDİ (NO SHOW)
            </button>
          </>
        )}

        {onExportPdf && (
          <button
            type="button"
            disabled={exportingPdf}
            onClick={onExportPdf}
            className={btnClass}
          >
            {exportingPdf ? 'PDF...' : 'PDF OLUŞTUR'}
          </button>
        )}
      </div>

      {confirmAction && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-950">
            {confirmAction === 'cancel' &&
              'Rezervasyonu iptal etmek istediğinize emin misiniz? Oda boşalacak.'}
            {confirmAction === 'noShow' &&
              'Misafiri GELMEDİ (NO SHOW) olarak işaretlemek istediğinize emin misiniz? Oda anında boşalacak.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={processing}
              onClick={() => void handleConfirm()}
              className={adminActionBtnPrimary}
            >
              {processing ? 'İşleniyor...' : 'Onayla'}
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => setConfirmAction(null)}
              className={adminActionBtnSecondary}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
