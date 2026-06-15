import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { maskTcNumber } from '../auth/formatMoney'
import { useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import { SlideOverPanel } from '../components/SlideOverPanel'
import {
  adminActionBtnDanger,
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import type { GuestPhoto, Reservation } from '../types/database'
import { sanitizePriceInput } from '../reservations/formInputHelpers'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { calculateNights } from '../reservations/pricing'
import { calculateRemainingBalance, parseAmount } from '../reservations/validation'
import { GuestFormFields } from './GuestFormFields'
import { GuestPhotoUpload } from './GuestPhotoUpload'
import { GuestRegistrationBadge } from './GuestRegistrationBadge'
import {
  createGuestEntry,
  deleteGuestEntry,
  deleteGuestPhoto,
  fetchGuestEntriesForReservation,
  isGuestReservationOwner,
  syncReservationGuestCount,
  updateGuestEntry,
} from './guestService'
import { completeOdaKabul } from '../workflow/workflowService'
import { isOdaKabulYapildi } from '../workflow/roomDisplayStatus'
import {
  applyGuestFullNameInput,
  applyGuestTcInput,
  hasGuestFormErrors,
  isGuestFormSubmittable,
  validateGuestFormFields,
  type GuestFormFieldErrors,
  type GuestFormValues,
} from './guestFormValidation'
import { getGuestRegistrationStatus } from './guestRegistrationStatus'
import type { GuestEntryWithPhotos } from './guestTypes'

interface GuestCheckInPanelProps {
  open: boolean
  onClose: () => void
  reservation: Reservation
  unitName: string
  onUpdated: () => void
  onOdaKabulComplete?: () => void
}

const EMPTY_FORM: GuestFormValues = {
  fullName: '',
  tcNo: '',
  phone: '',
  notes: '',
}

function guestToForm(guest: GuestEntryWithPhotos): GuestFormValues {
  return {
    fullName: applyGuestFullNameInput(guest.full_name),
    tcNo: applyGuestTcInput(guest.tc_no ?? ''),
    phone: guest.phone ?? '',
    notes: guest.notes ?? '',
  }
}

export function GuestCheckInPanel({
  open,
  onClose,
  reservation,
  unitName,
  onUpdated,
  onOdaKabulComplete,
}: GuestCheckInPanelProps) {
  const { hasPermission } = useAuth()
  const canViewCustomerTc = hasPermission('can_view_customer_tc')
  const canUploadPhotos = hasPermission('can_upload_photos')

  const [guests, setGuests] = useState<GuestEntryWithPhotos[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<GuestFormValues>(EMPTY_FORM)
  const [createFormErrors, setCreateFormErrors] = useState<GuestFormFieldErrors>({})
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GuestFormValues>(EMPTY_FORM)
  const [editFormErrors, setEditFormErrors] = useState<GuestFormFieldErrors>({})
  const [deleteConfirmGuestId, setDeleteConfirmGuestId] = useState<string | null>(null)
  const [completingOdaKabul, setCompletingOdaKabul] = useState(false)
  const [tahsilInput, setTahsilInput] = useState('0')
  const fullNameInputRef = useRef<HTMLInputElement>(null)

  const formatCurrency = useFormatAdminCurrency()
  const totalNights = useMemo(
    () => calculateNights(reservation.giris_tarihi, reservation.cikis_tarihi),
    [reservation.giris_tarihi, reservation.cikis_tarihi],
  )
  const parsedTahsil = useMemo(() => {
    const trimmed = tahsilInput.trim()
    if (!trimmed) {
      return 0
    }

    const parsed = parseAmount(trimmed)
    return Number.isNaN(parsed) ? NaN : Math.max(0, parsed)
  }, [tahsilInput])
  const remainingBalance = useMemo(() => {
    if (Number.isNaN(parsedTahsil)) {
      return calculateRemainingBalance(Number(reservation.toplam_ucret), 0)
    }

    return calculateRemainingBalance(Number(reservation.toplam_ucret), parsedTahsil)
  }, [reservation.toplam_ucret, parsedTahsil])

  const registrationStatus = getGuestRegistrationStatus(reservation, guests)

  const loadGuests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const entries = await fetchGuestEntriesForReservation(reservation.id)
      setGuests(entries)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Misafir kayıtları yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [reservation.id])

  useEffect(() => {
    if (!open) {
      return
    }

    setShowForm(false)
    setForm(EMPTY_FORM)
    setEditingGuestId(null)
    setDeleteConfirmGuestId(null)
    setCreateFormErrors({})
    setEditFormErrors({})
    setSuccess(null)
    setTahsilInput(String(reservation.alinan_tutar ?? 0))
    void loadGuests()
  }, [open, loadGuests, reservation.alinan_tutar])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = window.setTimeout(() => setSuccess(null), 3500)
    return () => window.clearTimeout(timer)
  }, [success])

  async function handleCompleteOdaKabul() {
    if (isOdaKabulYapildi(reservation)) {
      return
    }

    setCompletingOdaKabul(true)
    setError(null)

    const collected = parsedTahsil
    if (Number.isNaN(collected)) {
      setError('Geçerli bir tahsil tutarı giriniz.')
      setCompletingOdaKabul(false)
      return
    }

    try {
      await completeOdaKabul(reservation.id, collected)
      onUpdated()
      onClose()
      onOdaKabulComplete?.()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'ODA KABUL tamamlanamadı.')
    } finally {
      setCompletingOdaKabul(false)
    }
  }

  async function handleSaveGuest(event: React.FormEvent) {
    event.preventDefault()

    const fieldErrors = validateGuestFormFields(form)
    if (hasGuestFormErrors(fieldErrors)) {
      setCreateFormErrors(fieldErrors)
      return
    }

    setCreateFormErrors({})
    setSaving(true)
    setError(null)

    try {
      const newGuest = await createGuestEntry({
        reservationId: reservation.id,
        fullName: form.fullName,
        tcNo: form.tcNo,
        phone: form.phone,
        notes: form.notes,
      })

      await syncReservationGuestCount(reservation.id, guests.length + 1)
      setGuests((current) => [...current, newGuest])
      setForm(EMPTY_FORM)
      setShowForm(true)
      setSuccess('Misafir eklendi. Kimlik fotoğraflarını yükleyin.')
      onUpdated()
      window.requestAnimationFrame(() => fullNameInputRef.current?.focus())
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Misafir kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateGuest(event: React.FormEvent, guestId: string) {
    event.preventDefault()

    const fieldErrors = validateGuestFormFields(editForm)
    if (hasGuestFormErrors(fieldErrors)) {
      setEditFormErrors(fieldErrors)
      return
    }

    setEditFormErrors({})
    setSaving(true)
    setError(null)

    try {
      const updatedGuest = await updateGuestEntry({
        guestEntryId: guestId,
        fullName: editForm.fullName,
        tcNo: editForm.tcNo,
        phone: editForm.phone,
        notes: editForm.notes,
      })
      setGuests((current) =>
        current.map((guest) =>
          guest.id === guestId ? { ...guest, ...updatedGuest, photos: guest.photos } : guest,
        ),
      )
      setEditingGuestId(null)
      setEditForm(EMPTY_FORM)
      setSuccess('Misafir bilgileri güncellendi.')
      onUpdated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Misafir güncellenemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete(guestId: string) {
    setDeleting(true)
    setError(null)

    try {
      await deleteGuestEntry(guestId, reservation.id)
      setGuests((current) => current.filter((guest) => guest.id !== guestId))
      setDeleteConfirmGuestId(null)
      setSuccess('Misafir kaydı silindi.')
      onUpdated()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Misafir silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  function handleDeleteClick(guest: GuestEntryWithPhotos) {
    if (isGuestReservationOwner(guest, reservation.ad_soyad)) {
      setError('Rezervasyon sahibi silinemez.')
      setDeleteConfirmGuestId(null)
      return
    }

    setError(null)
    setDeleteConfirmGuestId(guest.id)
  }

  const handlePhotoUploaded = useCallback((uploadedPhoto: GuestPhoto) => {
    setGuests((current) =>
      current.map((guest) =>
        guest.id === uploadedPhoto.guest_entry_id
          ? {
              ...guest,
              photos: [
                ...guest.photos.filter((photo) => photo.photo_type !== uploadedPhoto.photo_type),
                uploadedPhoto,
              ],
            }
          : guest,
      ),
    )
    onUpdated()
  }, [onUpdated])

  async function handleConfirmDeletePhoto(photo: GuestPhoto) {
    setDeleting(true)

    try {
      await deleteGuestPhoto(photo.id, photo.photo_url)
      setGuests((current) =>
        current.map((guest) =>
          guest.id === photo.guest_entry_id
            ? { ...guest, photos: guest.photos.filter((item) => item.id !== photo.id) }
            : guest,
        ),
      )
      onUpdated()
    } catch {
      setError('Fotoğraf silinemedi.')
      throw new Error('Fotoğraf silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  function startEditing(guest: GuestEntryWithPhotos) {
    setEditingGuestId(guest.id)
    setEditForm(guestToForm(guest))
    setEditFormErrors({})
    setShowForm(false)
    setDeleteConfirmGuestId(null)
  }

  function handleCollectFullAmount() {
    setTahsilInput(String(reservation.toplam_ucret))
  }

  if (!open) {
    return null
  }

  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      wide
      title="ODA KABUL"
      subtitle={`Misafir Kabul • ${unitName} • ${reservation.ad_soyad}`}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 max-md:p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <GuestRegistrationBadge status={registrationStatus} />
            <span className="text-xs font-medium text-slate-600">
              {guests.length} / {reservation.kisi_sayisi} misafir kayıtlı
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-sm max-md:gap-1.5 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Giriş
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatReservationDate(reservation.giris_tarihi)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Çıkış
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatReservationDate(reservation.cikis_tarihi)}
              </dd>
            </div>
          </dl>
        </div>

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-600">Misafir kayıtları yükleniyor...</p>
        ) : guests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
            Henüz misafir kaydı yok. Aşağıdan ilk misafiri ekleyin.
          </p>
        ) : (
          <ol className="space-y-3">
            {guests.map((guest, index) => (
              <li
                key={guest.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm max-md:p-2.5"
              >
                {editingGuestId === guest.id ? (
                  <form
                    noValidate
                    onSubmit={(event) => void handleUpdateGuest(event, guest.id)}
                    className="space-y-3"
                  >
                    <GuestFormFields
                      form={editForm}
                      onChange={(updates) => {
                        setEditForm((prev) => ({ ...prev, ...updates }))
                        setEditFormErrors({})
                      }}
                      errors={editFormErrors}
                      accentClassName="ring-blue-600"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={saving || !isGuestFormSubmittable(editForm)}
                        className={adminActionBtnPrimary}
                      >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGuestId(null)
                          setEditForm(EMPTY_FORM)
                          setEditFormErrors({})
                        }}
                        className={adminActionBtnSecondary}
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {index + 1}. {guest.full_name}
                        </p>
                        {guest.tc_no && (
                          <p className="mt-0.5 text-xs text-slate-600">
                            TC: {maskTcNumber(guest.tc_no, canViewCustomerTc)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(guest)}
                          className={adminActionBtnSecondary}
                          title="Düzenle"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(guest)}
                          className={adminActionBtnDanger}
                          title="Sil"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {deleteConfirmGuestId === guest.id && (
                      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
                        <p className="text-xs font-medium text-red-800">Bu misafiri silmek istiyor musunuz?</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => void handleConfirmDelete(guest.id)}
                            className={`${adminActionBtnDanger} disabled:opacity-60`}
                          >
                            {deleting ? '...' : 'Sil'}
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setDeleteConfirmGuestId(null)}
                            className={adminActionBtnSecondary}
                          >
                            Vazgeç
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <GuestPhotoUpload
                        guestEntryId={guest.id}
                        reservationId={reservation.id}
                        photoType="front_id"
                        capture
                        disabled={!canUploadPhotos}
                        existingPhoto={
                          guest.photos.find((photo) => photo.photo_type === 'front_id') ?? null
                        }
                        onUploaded={handlePhotoUploaded}
                        onDelete={handleConfirmDeletePhoto}
                        deleting={deleting}
                      />
                      <GuestPhotoUpload
                        guestEntryId={guest.id}
                        reservationId={reservation.id}
                        photoType="back_id"
                        capture
                        disabled={!canUploadPhotos}
                        existingPhoto={
                          guest.photos.find((photo) => photo.photo_type === 'back_id') ?? null
                        }
                        onUploaded={handlePhotoUploaded}
                        onDelete={handleConfirmDeletePhoto}
                        deleting={deleting}
                      />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}

        {!showForm ? (
          <button
            type="button"
            onClick={() => {
              setShowForm(true)
              setEditingGuestId(null)
              setDeleteConfirmGuestId(null)
              setCreateFormErrors({})
            }}
            className={`${adminActionBtnPrimary} w-full justify-center py-2.5 sm:w-auto`}
          >
            + Yeni Misafir Ekle
          </button>
        ) : (
          <form
            noValidate
            onSubmit={(event) => void handleSaveGuest(event)}
            className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Yeni Misafir</p>
            <GuestFormFields
              form={form}
              onChange={(updates) => {
                setForm((prev) => ({ ...prev, ...updates }))
                setCreateFormErrors({})
              }}
              errors={createFormErrors}
              fullNameInputRef={fullNameInputRef}
              accentClassName="ring-blue-600"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || !isGuestFormSubmittable(form)}
                className={adminActionBtnPrimary}
              >
                {saving ? 'Kaydediliyor...' : 'Misafir Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                  setCreateFormErrors({})
                }}
                className={adminActionBtnSecondary}
              >
                İptal
              </button>
            </div>
          </form>
        )}

        <section className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 max-md:p-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-900">
            Tahsilat Bilgileri
          </h3>
          <dl className="mt-3 grid gap-2.5 text-sm max-md:gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Giriş Tarihi
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatReservationDate(reservation.giris_tarihi)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Çıkış Tarihi
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatReservationDate(reservation.cikis_tarihi)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Toplam Gece
              </dt>
              <dd className="font-semibold text-slate-900">{totalNights}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Toplam Ücret
              </dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(reservation.toplam_ucret)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Tahsil Edilen
              </dt>
              <dd className="mt-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tahsilInput}
                    onChange={(event) => setTahsilInput(sanitizePriceInput(event.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-orange-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none ring-orange-500 focus:ring-2 max-md:py-2.5 max-md:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCollectFullAmount}
                    className={`${adminActionBtnSecondary} shrink-0 whitespace-nowrap`}
                  >
                    Tamamını Tahsil Et
                  </button>
                </div>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Kalan Bakiye
              </dt>
              <dd className="text-lg font-black text-red-600 max-md:text-base">
                {Number.isNaN(parsedTahsil) ? '—' : formatCurrency(remainingBalance)}
              </dd>
            </div>
          </dl>
        </section>

        {!isOdaKabulYapildi(reservation) && (
          <button
            type="button"
            disabled={completingOdaKabul}
            onClick={() => void handleCompleteOdaKabul()}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-red-600/30 transition hover:from-red-700 hover:to-red-800 disabled:opacity-60 sm:py-5 sm:text-lg"
          >
            {completingOdaKabul ? 'Tamamlanıyor...' : 'ODA KABULÜ TAMAMLA'}
          </button>
        )}

        {isOdaKabulYapildi(reservation) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
            ✓ ODA KABUL tamamlandı — oda DOLU durumunda.
          </div>
        )}
      </div>
    </SlideOverPanel>
  )
}
