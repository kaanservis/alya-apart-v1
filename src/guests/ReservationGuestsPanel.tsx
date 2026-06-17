import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import type { GuestPhoto, Reservation } from '../types/database'
import { GuestFormFields } from './GuestFormFields'
import { GuestEntryCard } from './GuestEntryCard'
import {
  createGuestEntry,
  deleteGuestEntry,
  fetchGuestEntriesForReservation,
  isGuestReservationOwner,
  syncReservationGuestCount,
  updateGuestEntry,
} from './guestService'
import {
  applyGuestFullNameInput,
  applyGuestTcInput,
  hasGuestFormErrors,
  isGuestFormSubmittable,
  validateGuestFormFields,
  type GuestFormFieldErrors,
  type GuestFormValues,
} from './guestFormValidation'
import type { GuestEntryWithPhotos } from './guestTypes'

interface ReservationGuestsPanelProps {
  reservation: Reservation
  onUpdated?: () => void
  onGuestCountChange?: (count: number) => void
  onGuestsChange?: (guests: GuestEntryWithPhotos[]) => void
  refreshToken?: number
  sectionTitle?: string
  sectionSubtitle?: string
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

export function ReservationGuestsPanel({
  reservation,
  onUpdated,
  onGuestCountChange,
  onGuestsChange,
  refreshToken = 0,
  sectionTitle,
  sectionSubtitle,
}: ReservationGuestsPanelProps) {
  const { hasPermission } = useAuth()
  const canViewCustomerTc = hasPermission('can_view_customer_tc')
  const canUploadPhotos = hasPermission('can_upload_photos')

  const [guests, setGuests] = useState<GuestEntryWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
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
  const fullNameInputRef = useRef<HTMLInputElement>(null)

  const publishGuests = useCallback(
    (entries: GuestEntryWithPhotos[]) => {
      onGuestCountChange?.(entries.length)
      onGuestsChange?.(entries)
    },
    [onGuestCountChange, onGuestsChange],
  )

  const loadGuests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const entries = await fetchGuestEntriesForReservation(reservation.id)
      setGuests(entries)
      publishGuests(entries)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Misafir kayıtları yüklenemedi.')
      setGuests([])
      publishGuests([])
    } finally {
      setLoading(false)
    }
  }, [publishGuests, reservation.id])

  useEffect(() => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setEditingGuestId(null)
    setDeleteConfirmGuestId(null)
    setCreateFormErrors({})
    setEditFormErrors({})
    setSuccess(null)
    void loadGuests()
  }, [loadGuests, reservation.id, refreshToken])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = window.setTimeout(() => setSuccess(null), 3500)
    return () => window.clearTimeout(timer)
  }, [success])

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
      setGuests((current) => {
        const next = [...current, newGuest]
        publishGuests(next)
        return next
      })
      setForm(EMPTY_FORM)
      setShowForm(true)
      setSuccess('Misafir eklendi. Kimlik fotoğraflarını yükleyin.')
      onUpdated?.()
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
      setGuests((current) => {
        const next = current.map((guest) =>
          guest.id === guestId ? { ...guest, ...updatedGuest, photos: guest.photos } : guest,
        )
        publishGuests(next)
        return next
      })
      setEditingGuestId(null)
      setEditForm(EMPTY_FORM)
      setSuccess('Misafir bilgileri güncellendi.')
      onUpdated?.()
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
      setGuests((current) => {
        const next = current.filter((guest) => guest.id !== guestId)
        publishGuests(next)
        return next
      })
      setDeleteConfirmGuestId(null)
      setSuccess('Misafir kaydı silindi.')
      onUpdated?.()
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

  const handlePhotoUploaded = useCallback(
    (uploadedPhoto: GuestPhoto) => {
      setGuests((current) => {
        const next = current.map((guest) =>
          guest.id === uploadedPhoto.guest_entry_id
            ? {
                ...guest,
                photos: [
                  ...guest.photos.filter((photo) => photo.photo_type !== uploadedPhoto.photo_type),
                  uploadedPhoto,
                ],
              }
            : guest,
        )
        publishGuests(next)
        return next
      })
      onUpdated?.()
    },
    [onUpdated, publishGuests],
  )

  function startEditing(guest: GuestEntryWithPhotos) {
    setEditingGuestId(guest.id)
    setEditForm(guestToForm(guest))
    setEditFormErrors({})
    setShowForm(false)
    setDeleteConfirmGuestId(null)
  }

  const panelContent = (
    <div className="space-y-4">
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
        <ol className="flex flex-col gap-3">
          {guests.map((guest, index) => (
            <GuestEntryCard
              key={guest.id}
              guest={guest}
              index={index}
              reservation={reservation}
              canViewCustomerTc={canViewCustomerTc}
              canUploadPhotos={canUploadPhotos}
              isEditing={editingGuestId === guest.id}
              editForm={editForm}
              editFormErrors={editFormErrors}
              saving={saving}
              deleting={deleting}
              deleteConfirm={deleteConfirmGuestId === guest.id}
              onStartEdit={() => startEditing(guest)}
              onCancelEdit={() => {
                setEditingGuestId(null)
                setEditForm(EMPTY_FORM)
                setEditFormErrors({})
              }}
              onEditFormChange={(updates) => {
                setEditForm((prev) => ({ ...prev, ...updates }))
                setEditFormErrors({})
              }}
              onSaveEdit={(event) => void handleUpdateGuest(event, guest.id)}
              onDeleteClick={() => handleDeleteClick(guest)}
              onConfirmDelete={() => void handleConfirmDelete(guest.id)}
              onCancelDelete={() => setDeleteConfirmGuestId(null)}
              onPhotoUploaded={handlePhotoUploaded}
            />
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
          ➕ Misafir Ekle
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
    </div>
  )

  if (sectionTitle) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">{sectionTitle}</h3>
        {sectionSubtitle && (
          <p className="mt-1 text-sm text-emerald-800/80">{sectionSubtitle}</p>
        )}
        <div className="mt-4">{panelContent}</div>
      </section>
    )
  }

  return panelContent
}
