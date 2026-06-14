import { useMemo, useState } from 'react'
import { GuestArchiveDetail } from '../guests/GuestArchiveDetail'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
import type { Reservation } from '../types/database'
import { formatReservationDate } from './reservationDisplay'
import { getTotalCollected } from './depositCalculations'
import {
  EMPTY_HISTORY_FILTERS,
  useReservationHistory,
  type ReservationHistoryFilters,
} from './useReservationHistory'

interface ReservationHistoryPageProps {
  refreshToken?: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function ReservationHistoryPage({ refreshToken = 0 }: ReservationHistoryPageProps) {
  const { units, reservations, guestMap, totalCount, filters, setFilters, loading, error, unitMap } =
    useReservationHistory(refreshToken)

  const resultLabel = useMemo(() => {
    if (loading) {
      return 'Yükleniyor...'
    }

    return `${reservations.length} kayıt (${totalCount} tamamlanmış rezervasyon)`
  }, [loading, reservations.length, totalCount])

  function updateFilter<K extends keyof ReservationHistoryFilters>(
    key: K,
    value: ReservationHistoryFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleReset() {
    setFilters(EMPTY_HISTORY_FILTERS)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Rezervasyon Arşivi
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Rezervasyon Geçmişi</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tamamlanmış rezervasyonları misafir adı, oda sakini veya odaya göre arayın.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
            {resultLabel}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm xl:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Misafir / Telefon / Not</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Arama yapın..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Oda</span>
            <select
              value={filters.unitId}
              onChange={(event) => updateFilter('unitId', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            >
              <option value="">Tüm odalar</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Filtreleri Temizle
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Çıkış Başlangıç</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter('dateFrom', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Giriş Bitiş</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter('dateTo', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            />
          </label>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Rezervasyon geçmişi yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm ring-1 ring-blue-50">
          {reservations.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-600">
              Arama kriterlerine uygun tamamlanmış rezervasyon bulunamadı.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-blue-100 bg-blue-50/80 text-xs uppercase tracking-wider text-blue-900">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Misafir</th>
                    <th className="px-4 py-3.5 font-bold">Oda</th>
                    <th className="px-4 py-3.5 font-bold">Giriş</th>
                    <th className="px-4 py-3.5 font-bold">Çıkış</th>
                    <th className="px-4 py-3.5 font-bold">Kişi</th>
                    <th className="px-4 py-3.5 font-bold">Toplam</th>
                    <th className="px-4 py-3.5 font-bold">Alınan</th>
                    <th className="px-4 py-3.5 font-bold">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <HistoryRow
                      key={reservation.id}
                      reservation={reservation}
                      unitName={unitMap.get(reservation.konaklama_birimi_id) ?? '—'}
                      guests={guestMap.get(reservation.id) ?? []}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function HistoryRow({
  reservation,
  unitName,
  guests,
}: {
  reservation: Reservation
  unitName: string
  guests: GuestEntryWithPhotos[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-blue-50/40">
        <td className="px-4 py-3.5 font-semibold text-slate-900">{reservation.ad_soyad}</td>
        <td className="px-4 py-3.5 font-medium text-blue-800">{unitName}</td>
        <td className="px-4 py-3.5 text-slate-700">
          {formatReservationDate(reservation.giris_tarihi)}
        </td>
        <td className="px-4 py-3.5 text-slate-700">
          {formatReservationDate(reservation.cikis_tarihi)}
        </td>
        <td className="px-4 py-3.5 text-slate-700">{reservation.kisi_sayisi}</td>
        <td className="px-4 py-3.5 font-medium text-slate-900">
          {formatCurrency(reservation.toplam_ucret)}
        </td>
        <td className="px-4 py-3.5 text-slate-700">{formatCurrency(getTotalCollected(reservation))}</td>
        <td className="px-4 py-3.5">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
          >
            {expanded ? 'Gizle' : 'Misafirler'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 last:border-b-0">
          <td colSpan={8} className="p-0">
            <GuestArchiveDetail
              reservationOwner={reservation.ad_soyad}
              kisiSayisi={reservation.kisi_sayisi}
              guests={guests}
            />
          </td>
        </tr>
      )}
    </>
  )
}
