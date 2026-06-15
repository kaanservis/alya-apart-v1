import { useMemo, useState } from 'react'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import type { AccommodationUnit, Reservation } from '../types/database'
import {
  adminActionBtnPrimary,
  adminMobileCard,
  adminMobileCardLabel,
  adminMobileCardList,
  adminMobileCardValue,
  adminPageDescription,
  adminPageEyebrow,
  adminPageStack,
  adminPageTitle,
  adminPrimaryCta,
  adminSectionCard,
  adminSectionPadding,
  adminSectionTitle,
} from '../components/admin/adminMobileStyles'
import { formatReservationDate } from './reservationDisplay'
import { getTotalCollected } from './depositCalculations'
import { ReservationFormPanel } from './ReservationFormPanel'

interface ReservationsManagementPageProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  onUpdated: () => void
  loading?: boolean
  error?: string | null
}

export function ReservationsManagementPage({
  units,
  reservations,
  onUpdated,
  loading = false,
  error = null,
}: ReservationsManagementPageProps) {
  const formatCurrency = useFormatAdminCurrency()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editReservation, setEditReservation] = useState<Reservation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const unitNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units],
  )

  const activeReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return reservations
      .filter((reservation) => reservation.durum === 'Aktif')
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
      .sort((a, b) => b.giris_tarihi.localeCompare(a.giris_tarihi, 'tr'))
  }, [reservations, searchQuery, unitNameById])

  function handleSaved() {
    onUpdated()
    setShowCreateForm(false)
    setEditReservation(null)
    setFormKey((current) => current + 1)
  }

  function handleEdit(reservation: Reservation) {
    setEditReservation(reservation)
    setShowCreateForm(false)
  }

  return (
    <div className={adminPageStack}>
      <section className={`${adminSectionCard} border-blue-100 ring-1 ring-blue-50 ${adminSectionPadding}`}>
        <p className={adminPageEyebrow}>Rezervasyon Yönetimi</p>
        <h2 className={adminPageTitle}>Rezervasyonlar</h2>
        <p className={adminPageDescription}>
          Yeni rezervasyon oluşturun, mevcut kayıtları düzenleyin ve aktif rezervasyonları listeleyin.
        </p>
      </section>

      <section>
        <button
          type="button"
          onClick={() => {
            setEditReservation(null)
            setShowCreateForm((current) => !current)
          }}
          className={`${adminPrimaryCta} ${
            showCreateForm ? 'ring-4 ring-blue-200' : ''
          }`}
        >
          <div className="relative flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold ring-1 ring-white/25 backdrop-blur-sm">
              +
            </span>
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">Yeni Rezervasyon</p>
              <p className="mt-1 text-sm text-blue-100/90 max-md:text-xs">
                {showCreateForm
                  ? 'Formu gizlemek için tıklayın'
                  : 'Yeni rezervasyon oluşturmak için tıklayın'}
              </p>
            </div>
          </div>
        </button>
      </section>

      {showCreateForm && (
        <ReservationFormPanel
          key={`create-${formKey}`}
          units={units}
          reservations={reservations}
          onSaved={handleSaved}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editReservation && (
        <ReservationFormPanel
          key={`edit-${formKey}-${editReservation.id}`}
          units={units}
          reservations={reservations}
          mode="edit"
          editReservation={editReservation}
          onSaved={handleSaved}
          onCancel={() => setEditReservation(null)}
        />
      )}

      <section className={adminSectionCard}>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 max-md:gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div>
            <h3 className={adminSectionTitle}>Aktif Rezervasyonlar</h3>
            <p className="mt-0.5 text-xs text-slate-500 max-md:text-[11px] sm:mt-1 sm:text-sm">
              {activeReservations.length} kayıt listeleniyor
            </p>
          </div>
          <label className="block w-full sm:w-72">
            <span className="sr-only">Ara</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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

        {!loading && !error && activeReservations.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {searchQuery.trim()
              ? 'Aramanızla eşleşen aktif rezervasyon bulunamadı.'
              : 'Aktif rezervasyon bulunmuyor.'}
          </p>
        )}

        {!loading && !error && activeReservations.length > 0 && (
          <>
            <div className={adminMobileCardList}>
              {activeReservations.map((reservation) => (
                <div key={reservation.id} className={adminMobileCard}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{reservation.ad_soyad}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{reservation.telefon}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEdit(reservation)}
                      className={`${adminActionBtnPrimary} shrink-0`}
                    >
                      <span aria-hidden>✏️</span>
                      Düzenle
                    </button>
                  </div>
                  <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <dt className={adminMobileCardLabel}>Oda</dt>
                      <dd className={`${adminMobileCardValue} text-blue-800`}>
                        {unitNameById.get(reservation.konaklama_birimi_id) ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className={adminMobileCardLabel}>Toplam</dt>
                      <dd className={adminMobileCardValue}>
                        {formatCurrency(reservation.toplam_ucret)}
                      </dd>
                    </div>
                    <div>
                      <dt className={adminMobileCardLabel}>Giriş</dt>
                      <dd className="text-xs text-slate-800">
                        {formatReservationDate(reservation.giris_tarihi)}
                      </dd>
                    </div>
                    <div>
                      <dt className={adminMobileCardLabel}>Çıkış</dt>
                      <dd className="text-xs text-slate-800">
                        {formatReservationDate(reservation.cikis_tarihi)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className={adminMobileCardLabel}>Alınan</dt>
                      <dd className="text-xs font-semibold text-emerald-700">
                        {formatCurrency(getTotalCollected(reservation))}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Misafir</th>
                    <th className="px-4 py-3 font-semibold">Telefon</th>
                    <th className="px-4 py-3 font-semibold">Oda</th>
                    <th className="px-4 py-3 font-semibold">Giriş</th>
                    <th className="px-4 py-3 font-semibold">Çıkış</th>
                    <th className="px-4 py-3 font-semibold">Toplam</th>
                    <th className="px-4 py-3 font-semibold">Alınan</th>
                    <th className="px-4 py-3 font-semibold">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReservations.map((reservation) => (
                    <tr key={reservation.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{reservation.ad_soyad}</td>
                      <td className="px-4 py-3 text-slate-700">{reservation.telefon}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {unitNameById.get(reservation.konaklama_birimi_id) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatReservationDate(reservation.giris_tarihi)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatReservationDate(reservation.cikis_tarihi)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {formatCurrency(reservation.toplam_ucret)}
                      </td>
                      <td className="px-4 py-3 text-emerald-700">
                        {formatCurrency(getTotalCollected(reservation))}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(reservation)}
                          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                        >
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
