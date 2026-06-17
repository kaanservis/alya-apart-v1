import { useMemo, useState } from 'react'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import {
  adminActionBtnSecondary,
  adminMobileCard,
  adminMobileCardLabel,
  adminMobileCardList,
  adminMobileCardValue,
  adminPageDescription,
  adminPageEyebrow,
  adminPageStack,
  adminPageTitle,
  adminSectionCard,
  adminSectionPadding,
} from '../components/admin/adminMobileStyles'
import { GuestArchiveDetail } from '../guests/GuestArchiveDetail'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
import type { PaymentRecord, Reservation } from '../types/database'
import { formatReservationDate } from './reservationDisplay'
import { getRemainingBalance, getTotalCollected } from './depositCalculations'
import { useBatchPaymentSummaries } from './useBatchPaymentSummaries'
import {
  EMPTY_HISTORY_FILTERS,
  useReservationHistory,
  type ReservationHistoryFilters,
} from './useReservationHistory'

const HISTORY_STATUS_FILTERS: {
  value: ReservationHistoryFilters['status']
  label: string
}[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'gecmis', label: 'Geçmiş' },
  { value: 'iptal', label: 'İptal' },
  { value: 'noshow', label: 'No Show' },
]

interface ReservationHistoryPageProps {
  refreshToken?: number
}

export function ReservationHistoryPage({ refreshToken = 0 }: ReservationHistoryPageProps) {
  const { units, reservations, guestMap, totalCount, filters, setFilters, loading, error, unitMap } =
    useReservationHistory(refreshToken)
  const { paymentsByReservation } = useBatchPaymentSummaries(reservations, refreshToken)

  const resultLabel = useMemo(() => {
    if (loading) {
      return 'Yükleniyor...'
    }

    return `${reservations.length} kayıt (${totalCount} arşiv kaydı)`
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
    <div className={adminPageStack}>
      <section className={`${adminSectionCard} border-blue-100 ring-1 ring-blue-50 ${adminSectionPadding}`}>
        <div className="mb-3 flex flex-col gap-2 max-md:mb-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={adminPageEyebrow}>Rezervasyon Arşivi</p>
            <h2 className={adminPageTitle}>Rezervasyon Geçmişi</h2>
            <p className={`${adminPageDescription} max-md:mt-0.5`}>
              Geçmiş, iptal ve no show rezervasyonları misafir adı, oda sakini veya odaya göre arayın.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 max-md:text-[10px] sm:px-3 sm:py-1 sm:text-sm">
            {resultLabel}
          </span>
        </div>

        <div className="grid gap-3 max-md:gap-2 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
          <label className="block text-sm max-md:text-xs xl:col-span-2">
            <span className="mb-1 block font-medium text-slate-700 max-md:text-xs">Misafir / Telefon / Not</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Arama yapın..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2 max-md:py-1.5 max-md:text-xs sm:rounded-xl"
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

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Durum</span>
            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter('status', event.target.value as ReservationHistoryFilters['status'])
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            >
              {HISTORY_STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              Arama kriterlerine uygun arşiv kaydı bulunamadı.
            </p>
          ) : (
            <>
              <div className={adminMobileCardList}>
                {reservations.map((reservation) => (
                  <HistoryMobileCard
                    key={reservation.id}
                    reservation={reservation}
                    unitName={unitMap.get(reservation.konaklama_birimi_id) ?? '—'}
                    guests={guestMap.get(reservation.id) ?? []}
                    payments={paymentsByReservation.get(reservation.id) ?? []}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-blue-100 bg-blue-50/80 text-xs uppercase tracking-wider text-blue-900">
                    <tr>
                      <th className="px-4 py-3.5 font-bold">Misafir</th>
                      <th className="px-4 py-3.5 font-bold">Oda</th>
                      <th className="px-4 py-3.5 font-bold">Giriş</th>
                      <th className="px-4 py-3.5 font-bold">Çıkış</th>
                      <th className="px-4 py-3.5 font-bold">Kişi</th>
                      <th className="px-4 py-3.5 font-bold">Toplam</th>
                      <th className="px-4 py-3.5 font-bold">Tahsil Edilen</th>
                      <th className="px-4 py-3.5 font-bold">Kalan</th>
                      <th className="px-4 py-3.5 font-bold">Durum</th>
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
                        payments={paymentsByReservation.get(reservation.id) ?? []}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

function HistoryStatusBadge({ status }: { status: Reservation['durum'] }) {
  const styles: Record<Reservation['durum'], string> = {
    Aktif: 'bg-emerald-100 text-emerald-800',
    'Geçmiş': 'bg-slate-100 text-slate-700',
    'İptal': 'bg-zinc-200 text-zinc-800',
    'No Show': 'bg-neutral-100 text-neutral-600',
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  )
}

function HistoryMobileCard({
  reservation,
  unitName,
  guests,
  payments,
}: {
  reservation: Reservation
  unitName: string
  guests: GuestEntryWithPhotos[]
  payments: PaymentRecord[]
}) {
  const formatCurrency = useFormatAdminCurrency()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={adminMobileCard}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{reservation.ad_soyad}</p>
          <p className="mt-0.5 text-xs font-medium text-blue-800">{unitName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <HistoryStatusBadge status={reservation.durum} />
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className={adminActionBtnSecondary}
          >
            {expanded ? '▲' : '👥'}
            {expanded ? 'Gizle' : 'Misafir'}
          </button>
        </div>
      </div>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
        <div>
          <dt className={adminMobileCardLabel}>Giriş</dt>
          <dd className="text-xs text-slate-800">{formatReservationDate(reservation.giris_tarihi)}</dd>
        </div>
        <div>
          <dt className={adminMobileCardLabel}>Çıkış</dt>
          <dd className="text-xs text-slate-800">{formatReservationDate(reservation.cikis_tarihi)}</dd>
        </div>
        <div>
          <dt className={adminMobileCardLabel}>Kişi</dt>
          <dd className={adminMobileCardValue}>{reservation.kisi_sayisi}</dd>
        </div>
        <div>
          <dt className={adminMobileCardLabel}>Toplam</dt>
          <dd className={adminMobileCardValue}>{formatCurrency(reservation.toplam_ucret)}</dd>
        </div>
        <div>
          <dt className={adminMobileCardLabel}>Tahsil Edilen</dt>
          <dd className="text-xs font-semibold text-emerald-700">
            {formatCurrency(getTotalCollected(reservation, payments))}
          </dd>
        </div>
        <div>
          <dt className={adminMobileCardLabel}>Kalan</dt>
          <dd className="text-xs font-semibold text-rose-700">
            {formatCurrency(getRemainingBalance(reservation, payments))}
          </dd>
        </div>
      </dl>
      {expanded && (
        <div className="mt-2.5 border-t border-slate-100 pt-2.5">
          <GuestArchiveDetail
            reservationOwner={reservation.ad_soyad}
            kisiSayisi={reservation.kisi_sayisi}
            guests={guests}
          />
        </div>
      )}
    </div>
  )
}

function HistoryRow({
  reservation,
  unitName,
  guests,
  payments,
}: {
  reservation: Reservation
  unitName: string
  guests: GuestEntryWithPhotos[]
  payments: PaymentRecord[]
}) {
  const formatCurrency = useFormatAdminCurrency()
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
        <td className="px-4 py-3.5 text-emerald-700">
          {formatCurrency(getTotalCollected(reservation, payments))}
        </td>
        <td className="px-4 py-3.5 text-rose-700">
          {formatCurrency(getRemainingBalance(reservation, payments))}
        </td>
        <td className="px-4 py-3.5">
          <HistoryStatusBadge status={reservation.durum} />
        </td>
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
          <td colSpan={10} className="p-0">
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
