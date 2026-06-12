import { useMemo, useState } from 'react'
import type { AccommodationUnit, PaymentRecord, Reservation } from '../types/database'
import { SlideOverPanel } from '../components/SlideOverPanel'
import { PaymentBreakdown } from '../components/PaymentBreakdown'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { reservationToFormValues } from '../reservations/formState'
import { ReservationFormPanel } from '../reservations/ReservationFormPanel'
import { deleteReservation, updateReservation } from '../reservations/reservationService'
import { getAvailableUnits } from '../reservations/validation'
import { findGuestReservationHistory } from './customerListUtils'

interface CustomerDetailPanelProps {
  reservation: Reservation
  unitName: string
  units: AccommodationUnit[]
  reservations: Reservation[]
  paymentRecords: PaymentRecord[]
  onClose: () => void
  onUpdated: () => void
  unitMap: Map<string, string>
}

type ActionMode = 'view' | 'edit' | 'changeRoom' | 'changeDates' | 'updatePayment'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPaymentDate(value: string) {
  return formatReservationDate(value)
}

export function CustomerDetailPanel({
  reservation,
  unitName,
  units,
  reservations,
  paymentRecords,
  onClose,
  onUpdated,
  unitMap,
}: CustomerDetailPanelProps) {
  const [mode, setMode] = useState<ActionMode>('view')
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(reservation.konaklama_birimi_id)
  const [checkIn, setCheckIn] = useState(reservation.giris_tarihi)
  const [checkOut, setCheckOut] = useState(reservation.cikis_tarihi)
  const [kaporaAmount, setKaporaAmount] = useState(String(reservation.kapora ?? 0))
  const [kaporaCollected, setKaporaCollected] = useState(String(reservation.kapora_tahsil ?? 0))
  const [checkInCollected, setCheckInCollected] = useState(String(reservation.giris_te_alinan ?? 0))

  const guestHistory = useMemo(
    () => findGuestReservationHistory(reservations, reservation),
    [reservations, reservation],
  )

  const availableRooms = useMemo(() => {
    return getAvailableUnits(
      units,
      reservations,
      checkIn,
      checkOut,
      reservation.id,
    )
  }, [units, reservations, checkIn, checkOut, reservation.id])

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setProcessing(true)
    setActionError(null)

    try {
      await deleteReservation(reservation.id, reservation.konaklama_birimi_id)
      onUpdated()
      onClose()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Rezervasyon silinemedi.')
      setConfirmDelete(false)
    } finally {
      setProcessing(false)
    }
  }

  async function handleRoomChange() {
    setProcessing(true)
    setActionError(null)

    try {
      const values = reservationToFormValues(reservation)
      values.konaklama_birimi_id = selectedRoomId
      await updateReservation(reservation.id, values, reservation.konaklama_birimi_id)
      onUpdated()
      setMode('view')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Oda değiştirilemedi.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDateChange() {
    setProcessing(true)
    setActionError(null)

    try {
      const values = reservationToFormValues(reservation)
      values.giris_tarihi = checkIn
      values.cikis_tarihi = checkOut
      await updateReservation(reservation.id, values, reservation.konaklama_birimi_id)
      onUpdated()
      setMode('view')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Tarihler güncellenemedi.')
    } finally {
      setProcessing(false)
    }
  }

  async function handlePaymentUpdate() {
    setProcessing(true)
    setActionError(null)

    try {
      const values = reservationToFormValues(reservation)
      values.kapora = kaporaAmount
      values.kapora_tahsil = kaporaCollected
      values.giris_te_alinan = checkInCollected
      await updateReservation(reservation.id, values, reservation.konaklama_birimi_id)
      onUpdated()
      setMode('view')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Ödeme güncellenemedi.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <SlideOverPanel
      open
      onClose={onClose}
      title={reservation.ad_soyad}
      subtitle={`${unitName} • ${reservation.durum}`}
      wide
    >
      {mode === 'edit' ? (
        <ReservationFormPanel
          units={units}
          reservations={reservations}
          mode="edit"
          editReservation={reservation}
          onSaved={() => {
            onUpdated()
            onClose()
          }}
          onCancel={() => setMode('view')}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {actionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {actionError}
            </div>
          )}

          {confirmDelete && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Silmeyi onaylamak için tekrar tıklayın.
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Rezervasyon Bilgileri
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Telefon</dt>
                <dd className="font-semibold text-slate-900">{reservation.telefon}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Oda</dt>
                <dd className="font-semibold text-slate-900">{unitName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Giriş Tarihi</dt>
                <dd className="font-semibold text-slate-900">
                  {formatReservationDate(reservation.giris_tarihi)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Çıkış Tarihi</dt>
                <dd className="font-semibold text-slate-900">
                  {formatReservationDate(reservation.cikis_tarihi)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Kişi Sayısı</dt>
                <dd className="font-semibold text-slate-900">{reservation.kisi_sayisi}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Durum</dt>
                <dd className="font-semibold text-slate-900">{reservation.durum}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">WhatsApp</h3>
            <div className="mt-4">
              <WhatsAppGuestActions
                phone={reservation.telefon}
                adSoyad={reservation.ad_soyad}
                kalanBakiye={reservation.kalan_bakiye}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-800">
              Ödeme Bilgileri
            </h3>
            <div className="mt-4">
              <PaymentBreakdown reservation={reservation} />
            </div>

            {paymentRecords.length > 0 && (
              <ul className="mt-4 space-y-2">
                {paymentRecords.map((record) => (
                  <li
                    key={record.id}
                    className="rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(record.amount)} — {formatPaymentDate(record.payment_date)}
                    </p>
                    {record.note && <p className="mt-1 text-slate-600">{record.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {reservation.notlar && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Notlar</h3>
              <p className="mt-3 text-sm text-slate-700">{reservation.notlar}</p>
            </section>
          )}

          {guestHistory.length > 0 && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">
                Rezervasyon Geçmişi
              </h3>
              <ul className="mt-4 space-y-2">
                {guestHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-slate-900">
                      {unitMap.get(entry.konaklama_birimi_id) ?? '—'} • {entry.durum}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {formatReservationDate(entry.giris_tarihi)} —{' '}
                      {formatReservationDate(entry.cikis_tarihi)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mode === 'changeRoom' && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
              <h3 className="text-sm font-bold text-blue-900">Oda Değiştir</h3>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableRooms.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setSelectedRoomId(unit.id)}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                      selectedRoomId === unit.id
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {unit.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={handleRoomChange}
                className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {processing ? 'Kaydediliyor...' : 'Odayı Kaydet'}
              </button>
            </section>
          )}

          {mode === 'changeDates' && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
              <h3 className="text-sm font-bold text-blue-900">Tarih Değiştir</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Giriş Tarihi</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Çıkış Tarihi</span>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={handleDateChange}
                className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {processing ? 'Kaydediliyor...' : 'Tarihleri Kaydet'}
              </button>
            </section>
          )}

          {mode === 'updatePayment' && (
            <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
              <h3 className="text-sm font-bold text-orange-900">Ödeme Güncelle</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Kapora</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kaporaAmount}
                    onChange={(event) => setKaporaAmount(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Kapora Tahsil</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kaporaCollected}
                    onChange={(event) => setKaporaCollected(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Girişte Alınan</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={checkInCollected}
                    onChange={(event) => setCheckInCollected(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={handlePaymentUpdate}
                className="mt-4 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {processing ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
              </button>
            </section>
          )}

          {mode === 'view' && (
            <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Düzenle
              </button>
              <button
                type="button"
                onClick={() => setMode('changeRoom')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Oda Değiştir
              </button>
              <button
                type="button"
                onClick={() => setMode('changeDates')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Tarih Değiştir
              </button>
              <button
                type="button"
                onClick={() => setMode('updatePayment')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Ödeme Güncelle
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleDelete}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  confirmDelete ? 'bg-red-700' : 'bg-red-600'
                }`}
              >
                {processing ? 'Siliniyor...' : confirmDelete ? 'Silmeyi Onayla' : 'Sil'}
              </button>
            </div>
          )}
        </div>
      )}
    </SlideOverPanel>
  )
}
