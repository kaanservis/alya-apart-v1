import type { AccommodationUnit, Reservation } from '../types/database'
import { formatCurrency } from '../cash/cashCalculations'
import { getPendingDepositGuests } from '../reservations/depositCalculations'

interface DepositAlertSectionProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
}

export function DepositAlertSection({ units, reservations }: DepositAlertSectionProps) {
  const pendingDeposits = getPendingDepositGuests(units, reservations)

  return (
    <section className="overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 shadow-sm ring-1 ring-rose-100">
      <div className="border-b border-rose-200/70 bg-white/50 px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Tahsilat</p>
        <h2 className="mt-1 text-xl font-bold text-rose-950 sm:text-2xl">Kapora Bekleyenler</h2>
        <p className="mt-1 text-sm text-rose-900/75">
          Kapora tahsilatı bekleyen aktif rezervasyonlar.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {pendingDeposits.length === 0 ? (
          <p className="rounded-xl border border-white/80 bg-white/90 px-4 py-5 text-sm font-medium text-slate-600">
            Kapora bekleyen misafir bulunmuyor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-rose-800">
                <tr>
                  <th className="px-3 py-2 font-bold">Misafir</th>
                  <th className="px-3 py-2 font-bold">Oda</th>
                  <th className="px-3 py-2 font-bold">Bekleyen Kapora</th>
                  <th className="px-3 py-2 font-bold">Kalan Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.map(({ reservation, unit, depositDue, remainingBalance }) => (
                  <tr key={reservation.id} className="border-t border-rose-100/80">
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {reservation.ad_soyad}
                    </td>
                    <td className="px-3 py-3 font-medium text-blue-900">{unit.name}</td>
                    <td className="px-3 py-3 font-bold text-rose-700">{formatCurrency(depositDue)}</td>
                    <td className="px-3 py-3 font-semibold text-amber-800">
                      {formatCurrency(remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
