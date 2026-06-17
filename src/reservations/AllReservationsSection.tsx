import { useMemo, useState } from 'react'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import type { AccommodationUnit, Reservation } from '../types/database'
import {
  adminActionBtnSecondary,
  adminSectionCard,
  adminSectionTitle,
} from '../components/admin/adminMobileStyles'
import { calculateNights } from './pricing'
import { getRemainingBalance, getTotalCollected } from './depositCalculations'
import { formatReservationShortDate } from './reservationDisplay'
import { ReservationTimelineBadge } from './reservationTimelineStatus'
import { useAllReservations } from './useAllReservations'
import { useBatchPaymentSummaries } from './useBatchPaymentSummaries'

const PAGE_SIZE = 50

type SortDirection = 'asc' | 'desc'

interface AllReservationsSectionProps {
  units: AccommodationUnit[]
  refreshToken: number
  onSelectReservation: (reservation: Reservation) => void
}

export function AllReservationsSection({
  units,
  refreshToken,
  onSelectReservation,
}: AllReservationsSectionProps) {
  const formatCurrency = useFormatAdminCurrency()
  const { reservations, loading, error } = useAllReservations(refreshToken)
  const { paymentsByReservation } = useBatchPaymentSummaries(reservations, refreshToken)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)

  const unitNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units],
  )

  const filteredReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return reservations
      .filter((reservation) => {
        if (!query) {
          return true
        }

        const unitName = unitNameById.get(reservation.konaklama_birimi_id) ?? ''
        return (
          reservation.ad_soyad.toLowerCase().includes(query) ||
          reservation.telefon.includes(query) ||
          unitName.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        const comparison = a.giris_tarihi.localeCompare(b.giris_tarihi, 'tr')
        return sortDirection === 'desc' ? -comparison : comparison
      })
  }, [reservations, searchQuery, sortDirection, unitNameById])

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredReservations.slice(start, start + PAGE_SIZE)
  }, [filteredReservations, currentPage])

  function toggleSortDirection() {
    setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setPage(1)
  }

  return (
    <section className={adminSectionCard}>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 max-md:gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h3 className={adminSectionTitle}>📋 TÜM REZERVASYONLAR</h3>
          <p className="mt-0.5 text-xs text-slate-500 max-md:text-[11px] sm:mt-1 sm:text-sm">
            {filteredReservations.length} kayıt · Sayfa {currentPage}/{totalPages}
          </p>
        </div>
        <label className="block w-full sm:w-80">
          <span className="sr-only">Ara</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Misafir, telefon veya oda ara..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 max-md:py-1.5 max-md:text-xs sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>
      </div>

      {loading && (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">Rezervasyonlar yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!loading && !error && filteredReservations.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          {searchQuery.trim()
            ? 'Aramanızla eşleşen rezervasyon bulunamadı.'
            : 'Henüz rezervasyon kaydı bulunmuyor.'}
        </p>
      )}

      {!loading && !error && filteredReservations.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Sıra No</th>
                  <th className="px-4 py-3 font-semibold">Oda</th>
                  <th className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={toggleSortDirection}
                      className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-blue-700"
                    >
                      Giriş Tarihi
                      <span aria-hidden className="text-[10px]">
                        {sortDirection === 'desc' ? '▼' : '▲'}
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Çıkış Tarihi</th>
                  <th className="px-4 py-3 font-semibold">Gün Sayısı</th>
                  <th className="px-4 py-3 font-semibold">Rezervasyon Sahibi</th>
                  <th className="px-4 py-3 font-semibold">Toplam Ücret</th>
                  <th className="px-4 py-3 font-semibold">Tahsil Edilen</th>
                  <th className="px-4 py-3 font-semibold">Kalan Bakiye</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReservations.map((reservation, index) => {
                  const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1
                  const nights = calculateNights(reservation.giris_tarihi, reservation.cikis_tarihi)
                  const payments = paymentsByReservation.get(reservation.id) ?? []

                  return (
                    <tr
                      key={reservation.id}
                      onClick={() => onSelectReservation(reservation)}
                      className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-blue-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700">{rowNumber}</td>
                      <td className="px-4 py-3 font-medium text-blue-800">
                        {unitNameById.get(reservation.konaklama_birimi_id) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatReservationShortDate(reservation.giris_tarihi)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatReservationShortDate(reservation.cikis_tarihi)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{nights} Gün</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{reservation.ad_soyad}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(reservation.toplam_ucret)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {formatCurrency(getTotalCollected(reservation, payments))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-700">
                        {formatCurrency(getRemainingBalance(reservation, payments))}
                      </td>
                      <td className="px-4 py-3">
                        <ReservationTimelineBadge reservation={reservation} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-6">
              <p className="text-xs text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredReservations.length)} /{' '}
                {filteredReservations.length} kayıt
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className={`${adminActionBtnSecondary} disabled:opacity-50`}
                >
                  Önceki
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className={`${adminActionBtnSecondary} disabled:opacity-50`}
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
