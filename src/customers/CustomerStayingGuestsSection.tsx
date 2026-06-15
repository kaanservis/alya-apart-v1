import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { maskTcNumber } from '../auth/formatMoney'
import {
  deleteGuestEntry,
  fetchGuestEntriesForReservation,
  getGuestPhotoPublicUrl,
  updateGuestEntry,
} from '../guests/guestService'
import { GuestFormFields } from '../guests/GuestFormFields'
import {
  applyGuestFullNameInput,
  applyGuestTcInput,
  hasGuestFormErrors,
  isGuestFormSubmittable,
  validateGuestFormFields,
  type GuestFormFieldErrors,
  type GuestFormValues,
} from '../guests/guestFormValidation'
import { GUEST_PHOTO_LABELS } from '../guests/guestTypes'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
import type { GuestPhotoType } from '../types/database'
import { GuestPhotoViewerModal } from './GuestPhotoViewerModal'

interface CustomerStayingGuestsSectionProps {
  reservationId: string
}

interface PhotoViewerState {
  title: string
  imageUrl: string | null
}

const EMPTY_EDIT_FORM: GuestFormValues = {
  fullName: '',
  tcNo: '',
  phone: '',
  notes: '',
}

const ID_PHOTO_SLOTS: {
  type: GuestPhotoType
  icon: string
  shortLabel: string
}[] = [
  { type: 'front_id', icon: '🆔', shortLabel: 'Ön' },
  { type: 'back_id', icon: '🆔', shortLabel: 'Arka' },
]

function formatOptionalValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function getGuestPhoto(guest: GuestEntryWithPhotos, photoType: GuestPhotoType) {
  return guest.photos.find((photo) => photo.photo_type === photoType) ?? null
}

function guestToEditForm(guest: GuestEntryWithPhotos): GuestFormValues {
  return {
    fullName: applyGuestFullNameInput(guest.full_name),
    tcNo: applyGuestTcInput(guest.tc_no ?? ''),
    phone: guest.phone ?? '',
    notes: guest.notes ?? '',
  }
}

export function CustomerStayingGuestsSection({ reservationId }: CustomerStayingGuestsSectionProps) {
  const { hasPermission } = useAuth()
  const canViewCustomerTc = hasPermission('can_view_customer_tc')

  const [guests, setGuests] = useState<GuestEntryWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [photoViewer, setPhotoViewer] = useState<PhotoViewerState | null>(null)
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GuestFormValues>(EMPTY_EDIT_FORM)
  const [editFormErrors, setEditFormErrors] = useState<GuestFormFieldErrors>({})
  const [savingGuestId, setSavingGuestId] = useState<string | null>(null)
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null)

  const loadGuests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const rows = await fetchGuestEntriesForReservation(reservationId)
      setGuests(rows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Misafirler yüklenemedi.')
      setGuests([])
    } finally {
      setLoading(false)
    }
  }, [reservationId])

  useEffect(() => {
    void loadGuests()
  }, [loadGuests])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = window.setTimeout(() => setSuccess(null), 3000)
    return () => window.clearTimeout(timer)
  }, [success])

  function openPhotoViewer(guest: GuestEntryWithPhotos, photoType: GuestPhotoType) {
    const photo = getGuestPhoto(guest, photoType)
    const imageUrl = photo ? getGuestPhotoPublicUrl(photo.photo_url) : null

    setPhotoViewer({
      title: `${guest.full_name} • ${GUEST_PHOTO_LABELS[photoType]}`,
      imageUrl: imageUrl || null,
    })
  }

  function startEditing(guest: GuestEntryWithPhotos) {
    setEditingGuestId(guest.id)
    setEditForm(guestToEditForm(guest))
    setEditFormErrors({})
    setSuccess(null)
  }

  function cancelEditing() {
    setEditingGuestId(null)
    setEditForm(EMPTY_EDIT_FORM)
    setEditFormErrors({})
  }

  function handleEditFormChange(updates: Partial<GuestFormValues>) {
    setEditForm((prev) => ({ ...prev, ...updates }))
    setEditFormErrors({})
  }

  async function handleSaveEdit(guest: GuestEntryWithPhotos) {
    const fieldErrors = validateGuestFormFields(editForm)
    if (hasGuestFormErrors(fieldErrors)) {
      setEditFormErrors(fieldErrors)
      return
    }

    setSavingGuestId(guest.id)
    setEditFormErrors({})

    try {
      const updatedGuest = await updateGuestEntry({
        guestEntryId: guest.id,
        fullName: editForm.fullName.trim(),
        tcNo: editForm.tcNo,
        phone: guest.phone ?? undefined,
        notes: guest.notes ?? undefined,
      })

      setGuests((current) =>
        current.map((entry) =>
          entry.id === guest.id
            ? {
                ...entry,
                ...updatedGuest,
                photos: entry.photos,
              }
            : entry,
        ),
      )
      setSuccess('Misafir bilgileri güncellendi.')
      cancelEditing()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Misafir güncellenemedi.')
    } finally {
      setSavingGuestId(null)
    }
  }

  async function handleDeleteGuest(guest: GuestEntryWithPhotos) {
    const confirmed = window.confirm('Bu misafiri silmek istediğinize emin misiniz?')
    if (!confirmed) {
      return
    }

    setDeletingGuestId(guest.id)
    setError(null)
    setSuccess(null)

    if (editingGuestId === guest.id) {
      cancelEditing()
    }

    try {
      await deleteGuestEntry(guest.id, reservationId, { syncGuestCount: false })
      setGuests((current) => current.filter((entry) => entry.id !== guest.id))
      setSuccess('Misafir kaydı silindi.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Misafir silinemedi.')
    } finally {
      setDeletingGuestId(null)
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
          Konaklayan Misafirler
        </h3>

        {loading && (
          <p className="mt-4 text-sm text-slate-600">Misafir kayıtları yükleniyor...</p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {!loading && !error && guests.length === 0 && (
          <p className="mt-4 text-sm text-slate-600">Bu rezervasyon için misafir kaydı bulunmuyor.</p>
        )}

        {!loading && guests.length > 0 && (
          <ul className="mt-4 space-y-4">
            {guests.map((guest, index) => {
              const isEditing = editingGuestId === guest.id
              const isSaving = savingGuestId === guest.id
              const isDeleting = deletingGuestId === guest.id
              const editInvalid = isEditing ? !isGuestFormSubmittable(editForm) : false

              return (
                <li
                  key={guest.id}
                  className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-emerald-50 bg-emerald-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      {index + 1}. {guest.full_name}
                    </p>

                    {!isEditing && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isDeleting || savingGuestId !== null}
                          onClick={() => startEditing(guest)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                        >
                          <span aria-hidden>✏️</span>
                          Düzenle
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting || savingGuestId !== null}
                          onClick={() => void handleDeleteGuest(guest)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          <span aria-hidden>🗑️</span>
                          {isDeleting ? 'Siliniyor...' : 'Sil'}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <form
                      noValidate
                      className="space-y-4 p-4"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void handleSaveEdit(guest)
                      }}
                    >
                      <GuestFormFields
                        form={editForm}
                        onChange={handleEditFormChange}
                        errors={editFormErrors}
                        showPhoneAndNotes={false}
                        accentClassName="ring-blue-600"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={isSaving || editInvalid}
                          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={cancelEditing}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
                      <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Ad Soyad
                          </dt>
                          <dd className="font-semibold text-slate-900">{guest.full_name}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            TC Kimlik No
                          </dt>
                          <dd className="font-medium text-slate-800">
                            {maskTcNumber(guest.tc_no, canViewCustomerTc)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Doğum Tarihi
                          </dt>
                          <dd className="text-slate-800">{formatOptionalValue(guest.birth_date)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Telefon
                          </dt>
                          <dd className="text-slate-800">{formatOptionalValue(guest.phone)}</dd>
                        </div>
                      </dl>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {ID_PHOTO_SLOTS.map((slot) => {
                          const photo = getGuestPhoto(guest, slot.type)
                          const hasPhoto = Boolean(photo?.photo_url)

                          return (
                            <button
                              key={slot.type}
                              type="button"
                              title={GUEST_PHOTO_LABELS[slot.type]}
                              onClick={() => openPhotoViewer(guest, slot.type)}
                              className={`flex min-w-[5.5rem] flex-col items-center gap-1 rounded-xl border px-3 py-2 text-center text-[11px] font-semibold transition ${
                                hasPhoto
                                  ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-base leading-none">{slot.icon}</span>
                              <span className="leading-tight">Kimlik {slot.shortLabel} Yüz</span>
                              {!hasPhoto && (
                                <span className="text-[10px] font-normal text-slate-400">Yüklenmemiş</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <GuestPhotoViewerModal
        open={photoViewer !== null}
        title={photoViewer?.title ?? ''}
        imageUrl={photoViewer?.imageUrl ?? null}
        onClose={() => setPhotoViewer(null)}
      />
    </>
  )
}
