import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { maskTcNumber } from '../auth/formatMoney'
import type { GuestPhoto, Reservation } from '../types/database'
import {
  computeTotalGuestCount,
  createGuestEntry,
  deleteGuestEntry,
  deleteGuestPhoto,
  fetchGuestEntriesForReservation,
  isGuestReservationOwner,
  updateGuestEntry,
} from './guestService'
import { logGuestSection } from './guestSectionLog'
import type { GuestEntryWithPhotos } from './guestTypes'
import { GuestFormFields } from './GuestFormFields'
import {
  applyGuestFullNameInput,
  applyGuestTcInput,
  hasGuestFormErrors,
  isGuestFormSubmittable,
  validateGuestFormFields,
  type GuestFormFieldErrors,
  type GuestFormValues,
} from './guestFormValidation'
import { GuestPhotoUpload } from './GuestPhotoUpload'

interface RoomGuestsSectionProps {
  reservation: Reservation
  onGuestCountChange?: (kisiSayisi: number) => void
}

interface GuestFormState extends GuestFormValues {}

const EMPTY_FORM: GuestFormState = {
  fullName: '',
  tcNo: '',
  phone: '',
  notes: '',
}

const GUEST_SAVE_SUCCESS_MESSAGE = 'Misafir başarıyla kaydedildi.'

function guestToForm(guest: GuestEntryWithPhotos): GuestFormState {
  return {
    fullName: applyGuestFullNameInput(guest.full_name),
    tcNo: applyGuestTcInput(guest.tc_no ?? ''),
    phone: guest.phone ?? '',
    notes: guest.notes ?? '',
  }
}

export function RoomGuestsSection({ reservation, onGuestCountChange }: RoomGuestsSectionProps) {
  const { hasPermission } = useAuth()
  const canViewCustomerTc = hasPermission('can_view_customer_tc')
  const canUploadPhotos = hasPermission('can_upload_photos')

  const [guests, setGuests] = useState<GuestEntryWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<GuestFormState>(EMPTY_FORM)
  const [createFormErrors, setCreateFormErrors] = useState<GuestFormFieldErrors>({})
  const [editFormErrors, setEditFormErrors] = useState<GuestFormFieldErrors>({})
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GuestFormState>(EMPTY_FORM)
  const [deleteConfirmGuestId, setDeleteConfirmGuestId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [highlightGuestId, setHighlightGuestId] = useState<string | null>(null)
  const fullNameInputRef = useRef<HTMLInputElement>(null)
  const onGuestCountChangeRef = useRef(onGuestCountChange)
  const loadGenerationRef = useRef(0)
  const loadGuestsCallCountRef = useRef(0)
  const renderCountRef = useRef(0)
  const lastNotifiedKisiRef = useRef<number | null>(null)
  const hasLoadedOnceRef = useRef(false)

  renderCountRef.current += 1
  if (renderCountRef.current <= 5 || renderCountRef.current % 25 === 0) {
    logGuestSection('render', {
      renderCount: renderCountRef.current,
      reservationId: reservation.id,
      loading,
      showForm,
      guestCount: guests.length,
    })
  }

  useEffect(() => {
    onGuestCountChangeRef.current = onGuestCountChange
  }, [onGuestCountChange])

  useEffect(() => {
    lastNotifiedKisiRef.current = null
    hasLoadedOnceRef.current = false
    logGuestSection('mounted', { reservationId: reservation.id })
    return () => logGuestSection('unmounted', { reservationId: reservation.id })
  }, [reservation.id])

  const totalGuestCount = useMemo(() => computeTotalGuestCount(guests.length), [guests.length])

  const notifyGuestCountChange = useCallback((entryCount: number) => {
    const kisiSayisi = computeTotalGuestCount(entryCount)
    if (lastNotifiedKisiRef.current === kisiSayisi) {
      return
    }

    lastNotifiedKisiRef.current = kisiSayisi
    logGuestSection('notifyGuestCountChange', { entryCount, kisiSayisi })
    onGuestCountChangeRef.current?.(kisiSayisi)
  }, [])

  useEffect(() => {
    const reservationId = reservation.id
    let cancelled = false
    const generation = loadGenerationRef.current + 1
    loadGenerationRef.current = generation
    loadGuestsCallCountRef.current += 1

    logGuestSection('loadGuests call', {
      callCount: loadGuestsCallCountRef.current,
      generation,
      reservationId,
    })

    if (!hasLoadedOnceRef.current) {
      setLoading(true)
    }
    setError(null)

    void (async () => {
      try {
        const entries = await fetchGuestEntriesForReservation(reservationId)

        if (cancelled || generation !== loadGenerationRef.current) {
          logGuestSection('loadGuests → skipped stale response', { generation, reservationId })
          return
        }

        setGuests(entries)
        notifyGuestCountChange(entries.length)
        hasLoadedOnceRef.current = true
        logGuestSection('loadGuests → success', {
          callCount: loadGuestsCallCountRef.current,
          generation,
          entryCount: entries.length,
        })
      } catch (loadError) {
        if (cancelled || generation !== loadGenerationRef.current) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Misafir kayıtları yüklenemedi.')
        logGuestSection('loadGuests → failed', {
          callCount: loadGuestsCallCountRef.current,
          generation,
          error: loadError instanceof Error ? loadError.message : String(loadError),
        })
      } finally {
        if (!cancelled && generation === loadGenerationRef.current) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [notifyGuestCountChange, reservation.id])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = window.setTimeout(() => setSuccess(null), 4000)
    return () => window.clearTimeout(timer)
  }, [success])

  useEffect(() => {
    if (!highlightGuestId) {
      return
    }

    const timer = window.setTimeout(() => {
      document.getElementById(`guest-entry-${highlightGuestId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
      setHighlightGuestId(null)
    }, 100)

    return () => window.clearTimeout(timer)
  }, [highlightGuestId])

  async function handleSaveGuest(event: React.FormEvent) {
    event.preventDefault()
    logGuestSection('handleSaveGuest → submit', { reservationId: reservation.id })

    const fieldErrors = validateGuestFormFields(form)
    if (hasGuestFormErrors(fieldErrors)) {
      setCreateFormErrors(fieldErrors)
      setError(null)
      return
    }

    setCreateFormErrors({})
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const newGuest = await createGuestEntry({
        reservationId: reservation.id,
        fullName: form.fullName,
        tcNo: form.tcNo,
        phone: form.phone,
        notes: form.notes,
      })

      setGuests((current) => {
        const nextGuests = [...current, newGuest]
        notifyGuestCountChange(nextGuests.length)
        return nextGuests
      })
      setForm(EMPTY_FORM)
      setShowForm(true)
      setSuccess(GUEST_SAVE_SUCCESS_MESSAGE)
      setHighlightGuestId(newGuest.id)
      window.requestAnimationFrame(() => {
        fullNameInputRef.current?.focus()
      })
      logGuestSection('handleSaveGuest → success', { guestId: newGuest.id })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Misafir kaydedilemedi.')
      logGuestSection('handleSaveGuest → failed', {
        error: saveError instanceof Error ? saveError.message : String(saveError),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateGuest(event: React.FormEvent, guestId: string) {
    event.preventDefault()

    const fieldErrors = validateGuestFormFields(editForm)
    if (hasGuestFormErrors(fieldErrors)) {
      setEditFormErrors(fieldErrors)
      setError(null)
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
          guest.id === guestId
            ? { ...guest, ...updatedGuest, photos: guest.photos }
            : guest,
        ),
      )
      setEditingGuestId(null)
      setEditForm(EMPTY_FORM)
      setSuccess('Misafir bilgileri güncellendi.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Misafir güncellenemedi.')
    } finally {
      setSaving(false)
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

  async function handleConfirmDelete(guestId: string) {
    setDeleting(true)
    setError(null)

    try {
      await deleteGuestEntry(guestId, reservation.id)
      setGuests((current) => {
        const nextGuests = current.filter((guest) => guest.id !== guestId)
        notifyGuestCountChange(nextGuests.length)
        return nextGuests
      })
      setDeleteConfirmGuestId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Misafir silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleConfirmDeletePhoto(photo: GuestPhoto) {
    setDeleting(true)

    try {
      await deleteGuestPhoto(photo.id, photo.photo_url)
      setGuests((current) =>
        current.map((guest) =>
          guest.id === photo.guest_entry_id
            ? {
                ...guest,
                photos: guest.photos.filter((item) => item.id !== photo.id),
              }
            : guest,
        ),
      )
      setError(null)
    } catch {
      setError('Fotoğraf silinemedi. Lütfen tekrar deneyin.')
      throw new Error('Fotoğraf silinemedi.')
    } finally {
      setDeleting(false)
    }
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
    setError(null)
  }, [])

  function startEditing(guest: GuestEntryWithPhotos) {
    setEditingGuestId(guest.id)
    setEditForm(guestToForm(guest))
    setEditFormErrors({})
    setCreateFormErrors({})
    setDeleteConfirmGuestId(null)
    setError(null)
    setSuccess(null)
  }

  function handleCreateFormChange(updates: Partial<GuestFormState>) {
    setForm((prev) => ({ ...prev, ...updates }))
    setCreateFormErrors({})
  }

  function handleEditFormChange(updates: Partial<GuestFormState>) {
    setEditForm((prev) => ({ ...prev, ...updates }))
    setEditFormErrors({})
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-900">Oda Sakinleri</h3>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Rezervasyon Sahibi</dt>
          <dd className="font-semibold text-slate-900">{reservation.ad_soyad}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Toplam Kişi Sayısı</dt>
          <dd className="font-semibold text-slate-900">{totalGuestCount} kişi</dd>
        </div>
      </dl>

      {success && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && guests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Misafir kayıtları yükleniyor...</p>
      ) : guests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Henüz ek misafir kaydı yok.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {guests.map((guest, index) => (
            <li
              key={guest.id}
              id={`guest-entry-${guest.id}`}
              className="scroll-mt-24 rounded-xl border border-indigo-100 bg-white px-4 py-4"
            >
              {editingGuestId === guest.id ? (
                <form
                  noValidate
                  onSubmit={(event) => void handleUpdateGuest(event, guest.id)}
                  className="space-y-3"
                >
                  <GuestFormFields
                    form={editForm}
                    onChange={handleEditFormChange}
                    errors={editFormErrors}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={saving || !isGuestFormSubmittable(editForm)}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {index + 1}. {guest.full_name}
                      </p>
                      {(guest.tc_no || guest.phone || guest.notes) && (
                        <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                          {guest.tc_no && (
                            <div>
                              <dt className="inline font-medium">TC: </dt>
                              <dd className="inline">{maskTcNumber(guest.tc_no, canViewCustomerTc)}</dd>
                            </div>
                          )}
                          {guest.phone && (
                            <div>
                              <dt className="inline font-medium">Tel: </dt>
                              <dd className="inline">{guest.phone}</dd>
                            </div>
                          )}
                          {guest.notes && (
                            <div className="sm:col-span-2">
                              <dt className="inline font-medium">Not: </dt>
                              <dd className="inline">{guest.notes}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(guest)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(guest)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Sil
                      </button>
                    </div>
                  </div>

                  {deleteConfirmGuestId === guest.id && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-800">
                        Bu misafiri silmek istediğinize emin misiniz?
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => void handleConfirmDelete(guest.id)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleting ? 'Siliniyor...' : 'Evet Sil'}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setDeleteConfirmGuestId(null)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3">
                    <GuestPhotoUpload
                      guestEntryId={guest.id}
                      reservationId={reservation.id}
                      photoType="front_id"
                      capture
                      disabled={!canUploadPhotos}
                      existingPhoto={guest.photos.find((photo) => photo.photo_type === 'front_id') ?? null}
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
                      existingPhoto={guest.photos.find((photo) => photo.photo_type === 'back_id') ?? null}
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
            logGuestSection('Misafir Ekle clicked')
            setShowForm(true)
            setEditingGuestId(null)
            setDeleteConfirmGuestId(null)
            setCreateFormErrors({})
            setSuccess(null)
          }}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Misafir Ekle
        </button>
      ) : (
        <form
          noValidate
          onSubmit={(event) => void handleSaveGuest(event)}
          className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-white p-4"
        >
          <GuestFormFields
            form={form}
            onChange={handleCreateFormChange}
            errors={createFormErrors}
            fullNameInputRef={fullNameInputRef}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || !isGuestFormSubmittable(form)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
                setCreateFormErrors({})
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              İptal
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
