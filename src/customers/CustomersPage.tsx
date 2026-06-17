import { useState } from 'react'
import { CustomerDetailPanel } from './CustomerDetailPanel'
import { exportCustomerListExcel, exportCustomerListPdf } from './customerExports'
import { formatReservationDate } from '../reservations/reservationDisplay'
import type { PaymentRecord } from '../types/database'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import {
  EMPTY_CUSTOMER_FILTERS,
  type CustomerListRow,
  type CustomerListFilters,
  type CustomerStatusFilter,
} from './customerListUtils'
import { useCustomersPage } from './useCustomersPage'
import { useCanViewPrices, useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import { useBatchPaymentSummaries } from '../reservations/useBatchPaymentSummaries'

interface CustomersPageProps {
  refreshToken: number
  onUpdated: () => void
}

const STATUS_FILTERS: { value: CustomerStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'gecmis', label: 'Geçmiş' },
  { value: 'iptal', label: 'İptal' },
  { value: 'noshow', label: 'No Show' },
]

interface CustomerRowContentProps {
  row: CustomerListRow
  selected: boolean
  onSelect: () => void
}

function StatusBadge({ status }: { status: CustomerListRow['reservation']['durum'] }) {
  const styles: Record<CustomerListRow['reservation']['durum'], string> = {
    Aktif: 'bg-emerald-100 text-emerald-800',
    'Geçmiş': 'bg-slate-100 text-slate-700',
    'İptal': 'bg-zinc-200 text-zinc-800',
    'No Show': 'bg-neutral-100 text-neutral-600',
  }

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold max-md:text-[9px] sm:px-2.5 sm:py-1 sm:text-xs ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function CustomerMobileCard({
  row,
  selected,
  onSelect,
  paymentsByReservation,
}: CustomerRowContentProps & {
  paymentsByReservation: Map<string, PaymentRecord[]>
}) {
  const { reservation, unitName } = row
  const formatCurrency = useFormatAdminCurrency()
  const payments = paymentsByReservation.get(reservation.id) ?? []

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left shadow-sm transition-colors max-md:p-2.5 sm:rounded-2xl sm:p-4 ${
        selected
          ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 max-md:text-xs sm:text-base">{reservation.ad_soyad}</p>
          <p className="mt-0.5 text-xs text-slate-600 max-md:text-[11px] sm:text-sm">{reservation.telefon}</p>
        </div>
        <StatusBadge status={reservation.durum} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm max-md:mt-2 max-md:gap-y-1.5 sm:mt-4 sm:gap-y-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Oda</dt>
          <dd className="font-semibold text-blue-800">{unitName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Toplam Ücret</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(reservation.toplam_ucret)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Giriş Tarihi</dt>
          <dd className="text-slate-800">{formatReservationDate(reservation.giris_tarihi)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Çıkış Tarihi</dt>
          <dd className="text-slate-800">{formatReservationDate(reservation.cikis_tarihi)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Tahsil Edilen</dt>
          <dd className="font-semibold text-emerald-700">{formatCurrency(getTotalCollected(reservation, payments))}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Kalan Bakiye</dt>
          <dd className="font-semibold text-rose-700">{formatCurrency(getRemainingBalance(reservation, payments))}</dd>
        </div>
      </dl>
    </button>
  )
}

export function CustomersPage({ refreshToken, onUpdated }: CustomersPageProps) {
  const {
    units,
    reservations,
    rows,
    filters,
    setFilters,
    loading,
    error,
    refetch,
    unitMap,
  } = useCustomersPage(refreshToken)

  const formatCurrency = useFormatAdminCurrency()
  const canViewPrices = useCanViewPrices()
  const { paymentsByReservation } = useBatchPaymentSummaries(
    rows.map((row) => row.reservation),
    refreshToken,
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedReservation = rows.find((row) => row.reservation.id === selectedId)?.reservation

  function updateFilter<K extends keyof CustomerListFilters>(key: K, value: CustomerListFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleUpdated() {
    refetch()
    onUpdated()
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Misafir Yönetimi
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Müşteriler</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tüm misafirleri ve rezervasyonları tek ekrandan yönetin.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={() => void exportCustomerListPdf(rows, canViewPrices)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              PDF İndir
            </button>
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={() => void exportCustomerListExcel(rows, canViewPrices)}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Excel İndir
            </button>
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Ara</span>
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(event) => updateFilter('searchQuery', event.target.value)}
            placeholder="Ad soyad veya telefon..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
          />
          <span className="mt-1 block text-xs text-slate-500">Ad Soyad veya Telefon ile arayın</span>
        </label>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Durum</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFilter('status', option.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  filters.status === option.value
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Sıralama</span>
            <select
              value={filters.sortField}
              onChange={(event) =>
                updateFilter('sortField', event.target.value as CustomerListFilters['sortField'])
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-600 focus:ring-2"
            >
              <option value="checkIn">Giriş Tarihi</option>
              <option value="checkOut">Çıkış Tarihi</option>
              <option value="name">Ad Soyad</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Yön</span>
            <select
              value={filters.sortDirection}
              onChange={(event) =>
                updateFilter(
                  'sortDirection',
                  event.target.value as CustomerListFilters['sortDirection'],
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-600 focus:ring-2"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setFilters(EMPTY_CUSTOMER_FILTERS)}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Filtreleri Temizle
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Müşteriler yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Kayıt bulunamadı.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((row) => (
              <CustomerMobileCard
                key={row.reservation.id}
                row={row}
                selected={selectedId === row.reservation.id}
                onSelect={() => setSelectedId(row.reservation.id)}
                paymentsByReservation={paymentsByReservation}
              />
            ))}
          </div>

          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Ad Soyad</th>
                    <th className="px-4 py-3.5 font-bold">Telefon</th>
                    <th className="px-4 py-3.5 font-bold">Oda</th>
                    <th className="px-4 py-3.5 font-bold">Giriş Tarihi</th>
                    <th className="px-4 py-3.5 font-bold">Çıkış Tarihi</th>
                    <th className="px-4 py-3.5 font-bold">Toplam Ücret</th>
                    <th className="px-4 py-3.5 font-bold">Tahsil Edilen</th>
                    <th className="px-4 py-3.5 font-bold">Kalan Bakiye</th>
                    <th className="px-4 py-3.5 font-bold">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ reservation, unitName }) => {
                    const isSelected = selectedId === reservation.id
                    const payments = paymentsByReservation.get(reservation.id) ?? []

                    return (
                      <tr
                        key={reservation.id}
                        onClick={() => setSelectedId(reservation.id)}
                        className={`cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-blue-50/60 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {reservation.ad_soyad}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{reservation.telefon}</td>
                        <td className="px-4 py-3.5 font-medium text-blue-800">{unitName}</td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {formatReservationDate(reservation.giris_tarihi)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {formatReservationDate(reservation.cikis_tarihi)}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {formatCurrency(reservation.toplam_ucret)}
                        </td>
                        <td className="px-4 py-3.5 text-emerald-700">
                          {formatCurrency(getTotalCollected(reservation, payments))}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-rose-700">
                          {formatCurrency(getRemainingBalance(reservation, payments))}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={reservation.durum} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {selectedReservation && (
        <CustomerDetailPanel
          reservation={selectedReservation}
          unitName={unitMap.get(selectedReservation.konaklama_birimi_id) ?? '—'}
          units={units}
          reservations={reservations}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
