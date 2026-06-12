import {
  getCheckoutDue,
  getDepositDue,
  getRemainingBalance,
  getTotalCollected,
  isDepositPaid,
  type ReservationPaymentFields,
} from '../reservations/depositCalculations'
import { DepositBadge } from './DepositBadge'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value)
}

interface PaymentBreakdownProps {
  reservation: ReservationPaymentFields
  showBadge?: boolean
}

export function PaymentBreakdown({ reservation, showBadge = true }: PaymentBreakdownProps) {
  const totalCollected = getTotalCollected(reservation)
  const remainingBalance = getRemainingBalance(reservation)
  const checkoutDue = getCheckoutDue(reservation)
  const depositDue = getDepositDue(reservation)

  return (
    <div className="space-y-4">
      {showBadge && Number(reservation.kapora) > 0 && (
        <div>
          <DepositBadge reservation={reservation} />
        </div>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200">
          <dt className="text-xs font-semibold uppercase text-slate-500">Toplam Ücret</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(Number(reservation.toplam_ucret))}
          </dd>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200">
          <dt className="text-xs font-semibold uppercase text-slate-500">Kapora</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(Number(reservation.kapora))}
          </dd>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-emerald-100">
          <dt className="text-xs font-semibold uppercase text-emerald-700">Kapora Tahsil</dt>
          <dd className="mt-1 text-lg font-bold text-emerald-800">
            {formatCurrency(Number(reservation.kapora_tahsil))}
            {Number(reservation.kapora) > 0 && (
              <span className="ml-2 text-xs font-semibold">
                ({isDepositPaid(reservation) ? 'Alındı' : `Bekleyen ${formatCurrency(depositDue)}`})
              </span>
            )}
          </dd>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-blue-100">
          <dt className="text-xs font-semibold uppercase text-blue-700">Girişte Alınan</dt>
          <dd className="mt-1 text-lg font-bold text-blue-900">
            {formatCurrency(Number(reservation.giris_te_alinan))}
          </dd>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-amber-100">
          <dt className="text-xs font-semibold uppercase text-amber-700">Çıkışta Alınacak</dt>
          <dd className="mt-1 text-lg font-bold text-amber-900">{formatCurrency(checkoutDue)}</dd>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-emerald-100">
          <dt className="text-xs font-semibold uppercase text-emerald-700">Toplam Tahsil Edilen</dt>
          <dd className="mt-1 text-lg font-bold text-emerald-900">{formatCurrency(totalCollected)}</dd>
        </div>
        <div className="rounded-xl bg-white/80 p-3 ring-1 ring-rose-100 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase text-rose-700">Kalan Bakiye</dt>
          <dd className="mt-1 text-xl font-bold text-rose-900">{formatCurrency(remainingBalance)}</dd>
        </div>
      </dl>
    </div>
  )
}
