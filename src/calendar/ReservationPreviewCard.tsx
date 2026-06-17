import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Reservation } from '../types/database'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { buildPaymentSummary } from '../reservations/paymentCalculations'
import { fetchReservationPaymentState } from '../reservations/tahsilatService'

interface ReservationPreviewCardProps {
  reservation: Reservation
  unitName: string
  anchorRect: DOMRect
  onClose?: () => void
  showBackdrop?: boolean
}

function formatDisplayPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }

  return phone.trim()
}

export function ReservationPreviewCard({
  reservation,
  unitName,
  anchorRect,
  onClose,
  showBackdrop = false,
}: ReservationPreviewCardProps) {
  const formatCurrency = useFormatAdminCurrency()
  const [paymentSummary, setPaymentSummary] = useState(() =>
    buildPaymentSummary(reservation, []),
  )

  useEffect(() => {
    let cancelled = false

    void fetchReservationPaymentState(reservation.id)
      .then((state) => {
        if (!cancelled) {
          setPaymentSummary(state.summary)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentSummary(buildPaymentSummary(reservation, []))
        }
      })

    return () => {
      cancelled = true
    }
  }, [reservation])

  const cardWidth = 248
  const estimatedHeight = 228
  const margin = 8

  let top = anchorRect.top - estimatedHeight - margin
  if (top < margin) {
    top = anchorRect.bottom + margin
  }

  let left = anchorRect.left + anchorRect.width / 2 - cardWidth / 2
  left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin))

  const dateRange = `${formatReservationDate(reservation.giris_tarihi)} → ${formatReservationDate(reservation.cikis_tarihi)}`

  const card = (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[110] w-[248px] rounded-xl border border-slate-200/80 bg-white p-3.5 text-left shadow-xl shadow-slate-900/15 ring-1 ring-slate-100"
      style={{ top, left, width: cardWidth }}
    >
      <p className="truncate text-sm font-bold text-slate-900">
        <span aria-hidden className="mr-1.5">
          👤
        </span>
        {reservation.ad_soyad}
      </p>
      <p className="mt-2 truncate text-xs text-slate-700">
        <span aria-hidden className="mr-1.5">
          📞
        </span>
        {formatDisplayPhone(reservation.telefon)}
      </p>
      <p className="mt-2 truncate text-xs font-medium text-blue-800">
        <span aria-hidden className="mr-1.5">
          🏨
        </span>
        {unitName}
      </p>
      <p className="mt-2 text-xs text-slate-700">
        <span aria-hidden className="mr-1.5">
          📅
        </span>
        {dateRange}
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-800">
        <span aria-hidden className="mr-1.5">
          💰
        </span>
        Toplam: {formatCurrency(reservation.toplam_ucret)}
      </p>
      <p className="mt-1.5 text-xs font-semibold text-emerald-700">
        <span aria-hidden className="mr-1.5">
          💵
        </span>
        Ödenen: {formatCurrency(paymentSummary.totalCollected)}
      </p>
      <p className="mt-1.5 text-xs font-bold text-red-600">
        <span aria-hidden className="mr-1.5">
          💳
        </span>
        Kalan: {formatCurrency(paymentSummary.remainingBalance)}
      </p>
    </div>
  )

  if (!showBackdrop) {
    return createPortal(card, document.body)
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Önizlemeyi kapat"
        className="fixed inset-0 z-[109] cursor-default bg-slate-900/10"
        onClick={onClose}
      />
      <div className="pointer-events-auto">{card}</div>
    </>,
    document.body,
  )
}
