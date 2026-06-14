import { useMemo, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value)
}

export function ReservationsManagementPage({
  units,
  reservations,
  onUpdated,
  loading = false,
  error = null,
}: ReservationsManagementPageProps) {
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
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Rezervasyon Yönetimi
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Rezervasyonlar</h2>
        <p className="mt-2 text-sm text-slate-600">
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
          className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-7 text-white shadow-xl shadow-blue-700/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-700/40 sm:px-10 sm:py-8 ${
            showCreateForm ? 'ring-4 ring-blue-200' : ''
          }`}
        >
          <div className="relative flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold ring-1 ring-white/25 backdrop-blur-sm">
              +
            </span>
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">Yeni Rezervasyon</p>
              <p className="mt-1 text-sm text-blue-100/90">
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Aktif Rezervasyonlar</h3>
            <p className="mt-1 text-sm text-slate-500">
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
          <div className="overflow-x-auto">
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
        )}
      </section>
    </div>
  )
}
