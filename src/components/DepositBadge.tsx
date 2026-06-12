import { isDepositPaid, isDepositPending } from '../reservations/depositCalculations'
import type { ReservationPaymentFields } from '../reservations/depositCalculations'

interface DepositBadgeProps {
  reservation: ReservationPaymentFields
  className?: string
}

export function DepositBadge({ reservation, className = '' }: DepositBadgeProps) {
  if (Number(reservation.kapora) <= 0) {
    return null
  }

  const paid = isDepositPaid(reservation)
  const pending = isDepositPending(reservation)

  if (!paid && !pending) {
    return null
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
        paid
          ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
          : 'bg-rose-100 text-rose-800 ring-rose-200'
      } ${className}`}
    >
      {paid ? 'Kapora Alındı' : 'Kapora Bekleniyor'}
    </span>
  )
}
