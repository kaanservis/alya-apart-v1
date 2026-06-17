import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  adminActionBtnDanger,
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import { SlideOverPanel } from '../components/SlideOverPanel'
import type { AccommodationUnit, Reservation } from '../types/database'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { fetchGuestEntriesForReservation } from '../guests/guestService'
import { getRemainingBalance } from '../reservations/depositCalculations'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { reservationToFormValues } from '../reservations/formState'
import { ReservationFormPanel } from '../reservations/ReservationFormPanel'
import { ReservationCariHesapSection } from '../reservations/ReservationCariHesapSection'
import { ReservationDetailActions } from '../reservations/ReservationDetailActions'
import { deleteReservation, updateReservation } from '../reservations/reservationService'
import { getAvailableUnits } from '../reservations/validation'
import { ReservationGuestsPanel } from '../guests/ReservationGuestsPanel'
import { GuestCheckInPanel } from '../guests/GuestCheckInPanel'
import { exportCustomerReservationPdf } from './customerReservationPdf'

interface CustomerDetailPanelProps {
  reservation: Reservation
  unitName: string
  units: AccommodationUnit[]
  reservations: Reservation[]
  onClose: () => void
  onUpdated: () => void
}

type ActionMode = 'view' | 'edit' | 'changeRoom' | 'changeDates'

export function CustomerDetailPanel({
  reservation: reservationProp,
  unitName,
  units,
  reservations,
  onClose,
  onUpdated,
}: CustomerDetailPanelProps) {
  const { hasPermission } = useAuth()
  const canChangeDates = hasPermission('can_change_dates')
  const canDeleteReservations = hasPermission('can_delete_reservations')
  const canViewPrices = hasPermission('can_view_prices')
  const canViewCustomerTc = hasPermission('can_view_customer_tc')

  const [displayReservation, setDisplayReservation] = useState(reservationProp)
  const [mode, setMode] = useState<ActionMode>('view')
  const [processing, setProcessing] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [guestRefreshToken, setGuestRefreshToken] = useState(0)
  const [paymentRefreshToken, setPaymentRefreshToken] = useState(0)
  const [selectedRoomId, setSelectedRoomId] = useState(reservationProp.konaklama_birimi_id)
  const [checkIn, setCheckIn] = useState(reservationProp.giris_tarihi)
  const [checkOut, setCheckOut] = useState(reservationProp.cikis_tarihi)

  useEffect(() => {
    setDisplayReservation(reservationProp)
    setSelectedRoomId(reservationProp.konaklama_birimi_id)
    setCheckIn(reservationProp.giris_tarihi)
    setCheckOut(reservationProp.cikis_tarihi)
  }, [reservationProp])

  useEffect(() => {
    setGuestRefreshToken(0)
    setPaymentRefreshToken(0)
    setMode('view')
    setActionError(null)
    setConfirmDelete(false)
    setCheckInOpen(false)
  }, [displayReservation.id])

  function handleReservationUpdated(updatedReservation?: Reservation) {
    if (updatedReservation) {
      setDisplayReservation(updatedReservation)
    }
    setPaymentRefreshToken((current) => current + 1)
    onUpdated()
  }

  function handleGuestsUpdated() {
    setGuestRefreshToken((current) => current + 1)
    handleReservationUpdated()
  }

  const availableRooms = useMemo(() => {
    return getAvailableUnits(
      units,
      reservations,
      checkIn,
      checkOut,
      displayReservation.id,
    )
  }, [units, reservations, checkIn, checkOut, displayReservation.id])

  const unit = useMemo(
    () => units.find((item) => item.id === displayReservation.konaklama_birimi_id),
    [units, displayReservation.konaklama_birimi_id],
  )

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setProcessing(true)
    setActionError(null)

    try {
      await deleteReservation(displayReservation.id, displayReservation.konaklama_birimi_id)
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
      const values = reservationToFormValues(displayReservation)
      values.konaklama_birimi_id = selectedRoomId
      await updateReservation(
        displayReservation.id,
        values,
        displayReservation.konaklama_birimi_id,
      )
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
      const values = reservationToFormValues(displayReservation)
      values.giris_tarihi = checkIn
      values.cikis_tarihi = checkOut
      await updateReservation(
        displayReservation.id,
        values,
        displayReservation.konaklama_birimi_id,
      )
      onUpdated()
      setMode('view')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Tarihler güncellenemedi.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    setActionError(null)

    try {
      const guests = await fetchGuestEntriesForReservation(displayReservation.id)
      await exportCustomerReservationPdf(displayReservation, unitName, guests, {
        canViewPrices,
        canViewTc: canViewCustomerTc,
      })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'PDF oluşturulamadı.')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <>
      <SlideOverPanel
        open
        onClose={onClose}
        title={displayReservation.ad_soyad}
        subtitle={`Rezervasyon Detayı • ${unitName} • ${displayReservation.durum}`}
        wide
        mobileStickyClose
      >
        {mode === 'edit' ? (
          <ReservationFormPanel
            units={units}
            reservations={reservations}
            mode="edit"
            editReservation={displayReservation}
            onSaved={() => {
              onUpdated()
              setMode('view')
            }}
            onCancel={() => setMode('view')}
          />
        ) : (
          <div className="flex flex-col gap-6 max-md:gap-2">
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

            <section className="slide-over-section rounded-2xl border border-slate-200 bg-slate-50 p-5 max-md:p-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Rezervasyon Bilgileri
              </h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Telefon</dt>
                  <dd className="font-semibold text-slate-900">{displayReservation.telefon}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Oda</dt>
                  <dd className="font-semibold text-slate-900">{unitName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Giriş Tarihi</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatReservationDate(displayReservation.giris_tarihi)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Çıkış Tarihi</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatReservationDate(displayReservation.cikis_tarihi)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Kişi Sayısı</dt>
                  <dd className="font-semibold text-slate-900">{displayReservation.kisi_sayisi}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Durum</dt>
                  <dd className="font-semibold text-slate-900">{displayReservation.durum}</dd>
                </div>
              </dl>
            </section>

            <ReservationCariHesapSection
              reservation={displayReservation}
              refreshToken={paymentRefreshToken}
              onUpdated={handleReservationUpdated}
            />

            <ReservationGuestsPanel
              reservation={displayReservation}
              sectionTitle="👥 Misafir Yönetimi"
              sectionSubtitle="Misafir ekleyin, düzenleyin veya silin. Kimlik ön/arka yüz fotoğrafları her misafir kartında yönetilir."
              refreshToken={guestRefreshToken}
              onUpdated={handleGuestsUpdated}
            />

            <section className="slide-over-section rounded-2xl border border-slate-200 bg-white p-5 max-md:rounded-xl max-md:p-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                📄 PDF Oluştur / Yazdır
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Rezervasyon özeti, misafir bilgileri ve ödeme geçmişini PDF olarak indirin.
              </p>
              <button
                type="button"
                disabled={exportingPdf}
                onClick={() => void handleExportPdf()}
                className={`${adminActionBtnSecondary} mt-4`}
              >
                {exportingPdf ? 'PDF oluşturuluyor...' : 'PDF Oluştur / Yazdır'}
              </button>
            </section>

            <section className="slide-over-section rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 p-5 max-md:rounded-xl max-md:p-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">WhatsApp</h3>
              <div className="mt-4">
                <WhatsAppGuestActions
                  phone={displayReservation.telefon}
                  adSoyad={displayReservation.ad_soyad}
                  kalanBakiye={getRemainingBalance(displayReservation)}
                />
              </div>
            </section>

            {displayReservation.notlar && (
              <section className="slide-over-section rounded-2xl border border-slate-200 bg-white p-5 max-md:rounded-xl max-md:p-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Notlar</h3>
                <p className="mt-3 text-sm text-slate-700">{displayReservation.notlar}</p>
              </section>
            )}

            {mode === 'changeRoom' && (
              <section className="slide-over-section rounded-2xl border border-blue-200 bg-blue-50/40 p-5 max-md:rounded-xl max-md:p-3">
              <h3 className="text-sm font-bold text-blue-900">Oda Değiştir</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-bold ${
                        selectedRoomId === room.id
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      {room.name}
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
              <section className="slide-over-section rounded-2xl border border-blue-200 bg-blue-50/40 p-5 max-md:rounded-xl max-md:p-3">
              <h3 className="text-sm font-bold text-blue-900">Tarih Değiştir</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Giriş Tarihi</span>
                    <input
                      type="date"
                      value={checkIn}
                      readOnly={!canChangeDates}
                      onChange={(event) => setCheckIn(event.target.value)}
                      className={`w-full rounded-xl border border-slate-300 px-3 py-2.5${!canChangeDates ? ' cursor-not-allowed bg-slate-100' : ''}`}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Çıkış Tarihi</span>
                    <input
                      type="date"
                      value={checkOut}
                      readOnly={!canChangeDates}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className={`w-full rounded-xl border border-slate-300 px-3 py-2.5${!canChangeDates ? ' cursor-not-allowed bg-slate-100' : ''}`}
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

            {mode === 'view' && (
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5">
                {unit && (
                  <section className="slide-over-section rounded-2xl border border-blue-100 bg-blue-50/40 p-4 max-md:rounded-xl max-md:p-3">
                    <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-blue-900">
                      Rezervasyon İşlemleri
                    </h3>
                    <p className="mb-3 text-xs text-blue-800/80">
                      Oda kabul hızlı erişim olarak isteğe bağlıdır; ödeme, misafir ve kimlik işlemleri
                      yukarıdaki bölümlerden yapılır.
                    </p>
                    <ReservationDetailActions
                      reservation={displayReservation}
                      unit={unit}
                      onUpdated={handleReservationUpdated}
                      onOpenCheckIn={
                        displayReservation.durum === 'Aktif'
                          ? () => setCheckInOpen(true)
                          : undefined
                      }
                    />
                  </section>
                )}

                <div className="flex flex-wrap gap-1.5 max-md:gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className={`${adminActionBtnPrimary}`}
                  >
                    <span aria-hidden>✏️</span>
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('changeRoom')}
                    className={adminActionBtnSecondary}
                  >
                    <span aria-hidden>🔄</span>
                    Oda
                  </button>
                  {canChangeDates && (
                    <button
                      type="button"
                      onClick={() => setMode('changeDates')}
                      className={adminActionBtnSecondary}
                    >
                      <span aria-hidden>📅</span>
                      Tarih
                    </button>
                  )}
                  {canDeleteReservations && (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleDelete}
                      className={`${adminActionBtnDanger} disabled:opacity-60 ${
                        confirmDelete ? 'bg-red-700 hover:bg-red-800' : ''
                      }`}
                    >
                      <span aria-hidden>🗑️</span>
                      {processing ? '...' : confirmDelete ? 'Onayla' : 'Sil'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOverPanel>

      {checkInOpen && (
        <GuestCheckInPanel
          open
          onClose={() => setCheckInOpen(false)}
          reservation={displayReservation}
          unitName={unitName}
          onUpdated={handleGuestsUpdated}
          guestRefreshToken={guestRefreshToken}
          onOdaKabulComplete={() => {
            setCheckInOpen(false)
            handleGuestsUpdated()
          }}
        />
      )}
    </>
  )
}
