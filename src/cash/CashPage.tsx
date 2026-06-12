import { useMemo, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import {
  buildActiveReservationRows,
  buildPaymentHistoryEntries,
  getFilteredCashSummary,
} from './cashCalculations'
import { ActiveReservationsSection } from './ActiveReservationsSection'
import { CashFilterBar } from './CashFilterBar'
import { CashSummaryCards } from './CashSummaryCards'
import { PaymentHistorySection } from './PaymentHistorySection'
import type { CashFilter, PaymentRecord } from './types'

interface CashPageProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  paymentRecords: PaymentRecord[]
  paymentLoading: boolean
  paymentError: string | null
}

export function CashPage({
  units,
  reservations,
  paymentRecords,
  paymentLoading,
  paymentError,
}: CashPageProps) {
  const [filter, setFilter] = useState<CashFilter>('month')

  const summary = useMemo(
    () => getFilteredCashSummary(reservations, filter),
    [reservations, filter],
  )

  const activeRows = useMemo(
    () => buildActiveReservationRows(reservations, units, filter),
    [reservations, units, filter],
  )

  const paymentHistory = useMemo(
    () => buildPaymentHistoryEntries(paymentRecords, reservations, units, filter),
    [paymentRecords, reservations, units, filter],
  )

  return (
    <div className="flex flex-col gap-6">
      <CashFilterBar filter={filter} onFilterChange={setFilter} />
      <CashSummaryCards summary={summary} />

      {paymentError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tahsilat geçmişi yüklenemedi: {paymentError}. Özet veriler rezervasyonlardan
          hesaplanmaya devam ediyor.
        </div>
      )}

      {paymentLoading && (
        <p className="text-sm text-slate-500">Tahsilat geçmişi yükleniyor...</p>
      )}

      <ActiveReservationsSection rows={activeRows} />
      <PaymentHistorySection entries={paymentHistory} />
    </div>
  )
}
