import {
  getRemainingBalance,
  getTotalCollected,
  type ReservationPaymentFields,
} from '../reservations/depositCalculations'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value)
}

interface PaymentBreakdownProps {
  reservation: ReservationPaymentFields
}

export function PaymentBreakdown({ reservation }: PaymentBreakdownProps) {
  const totalCollected = getTotalCollected(reservation)
  const remainingBalance = getRemainingBalance(reservation)

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200">
        <dt className="text-xs font-semibold uppercase text-slate-500">Toplam Ücret</dt>
        <dd className="mt-1 text-lg font-bold text-slate-900">
          {formatCurrency(Number(reservation.toplam_ucret))}
        </dd>
      </div>
      <div className="rounded-xl bg-white/80 p-3 ring-1 ring-emerald-100">
        <dt className="text-xs font-semibold uppercase text-emerald-700">Alınan Ücret</dt>
        <dd className="mt-1 text-lg font-bold text-emerald-900">{formatCurrency(totalCollected)}</dd>
      </div>
      <div className="rounded-xl bg-white/80 p-3 ring-1 ring-rose-100">
        <dt className="text-xs font-semibold uppercase text-rose-700">Kalan Bakiye</dt>
        <dd className="mt-1 text-lg font-bold text-rose-900">{formatCurrency(remainingBalance)}</dd>
      </div>
    </dl>
  )
}
