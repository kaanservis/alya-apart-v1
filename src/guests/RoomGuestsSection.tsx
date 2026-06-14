import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GuestPhoto, Reservation } from '../types/database'
import {
  computeTotalGuestCount,
  createGuestEntry,
  deleteGuestEntry,
  deleteGuestPhoto,
  fetchGuestEntriesForReservation,
  getGuestPhotoPublicUrl,
  isGuestReservationOwner,
  updateGuestEntry,
} from './guestService'
import type { GuestEntryWithPhotos } from './guestTypes'
import { GUEST_PHOTO_LABELS } from './guestTypes'
import { GuestPhotoUpload } from './GuestPhotoUpload'

interface RoomGuestsSectionProps {
  reservation: Reservation
  onUpdated?: () => void
}

interface GuestFormState {
  fullName: string
  tcNo: string
  phone: string
  notes: string
}

const EMPTY_FORM: GuestFormState = {
  fullName: '',
  tcNo: '',
  phone: '',
  notes: '',
}

function guestToForm(guest: GuestEntryWithPhotos): GuestFormState {
  return {
    fullName: guest.full_name,
    tcNo: guest.tc_no ?? '',
    phone: guest.phone ?? '',
    notes: guest.notes ?? '',
  }
}

export function RoomGuestsSection({ reservation, onUpdated }: RoomGuestsSectionProps) {
  const [guests, setGuests] = useState<GuestEntryWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<GuestFormState>(EMPTY_FORM)
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GuestFormState>(EMPTY_FORM)
  const [deleteConfirmGuestId, setDeleteConfirmGuestId] = useState<string | null>(null)
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalGuestCount = useMemo(() => computeTotalGuestCount(guests.length), [guests.length])

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
    void loadGuests()
  }, [loadGuests])

  async function handleMutationComplete() {
    await loadGuests()
    onUpdated?.()
  }

  async function handleSaveGuest(event: React.FormEvent) {
    event.preventDefault()

    if (!form.fullName.trim()) {
      setError('Ad Soyad zorunludur.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createGuestEntry({
        reservationId: reservation.id,
        fullName: form.fullName,
        tcNo: form.tcNo,
        phone: form.phone,
        notes: form.notes,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      await handleMutationComplete()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Misafir kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateGuest(event: React.FormEvent, guestId: string) {
    event.preventDefault()

    if (!editForm.fullName.trim()) {
      setError('Ad Soyad zorunludur.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateGuestEntry({
        guestEntryId: guestId,
        fullName: editForm.fullName,
        tcNo: editForm.tcNo,
        phone: editForm.phone,
        notes: editForm.notes,
      })
      setEditingGuestId(null)
      setEditForm(EMPTY_FORM)
      await handleMutationComplete()
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
      setDeleteConfirmGuestId(null)
      await handleMutationComplete()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Misafir silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleConfirmDeletePhoto(photo: GuestPhoto) {
    setDeleting(true)
    setError(null)

    try {
      await deleteGuestPhoto(photo.id, photo.photo_url)
      setDeletePhotoId(null)
      await loadGuests()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Fotoğraf silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  function startEditing(guest: GuestEntryWithPhotos) {
    setEditingGuestId(guest.id)
    setEditForm(guestToForm(guest))
    setDeleteConfirmGuestId(null)
    setDeletePhotoId(null)
    setError(null)
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

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-600">Misafir kayıtları yükleniyor...</p>
      ) : guests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Henüz ek misafir kaydı yok.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {guests.map((guest, index) => (
            <li
              key={guest.id}
              className="rounded-xl border border-indigo-100 bg-white px-4 py-4"
            >
              {editingGuestId === guest.id ? (
                <form
                  onSubmit={(event) => void handleUpdateGuest(event, guest.id)}
                  className="space-y-3"
                >
                  <GuestFormFields form={editForm} onChange={setEditForm} />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGuestId(null)
                        setEditForm(EMPTY_FORM)
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
                              <dd className="inline">{guest.tc_no}</dd>
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <GuestPhotoUpload
                      guestEntryId={guest.id}
                      reservationId={reservation.id}
                      photoType="front_id"
                      label="Kimlik Ön Yüz Çek"
                      capture
                      existingUrl={
                        guest.photos.find((photo) => photo.photo_type === 'front_id')
                          ? getGuestPhotoPublicUrl(
                              guest.photos.find((photo) => photo.photo_type === 'front_id')!
                                .photo_url,
                            )
                          : undefined
                      }
                      onUploaded={loadGuests}
                    />
                    <GuestPhotoUpload
                      guestEntryId={guest.id}
                      reservationId={reservation.id}
                      photoType="back_id"
                      label="Kimlik Arka Yüz Çek"
                      capture
                      existingUrl={
                        guest.photos.find((photo) => photo.photo_type === 'back_id')
                          ? getGuestPhotoPublicUrl(
                              guest.photos.find((photo) => photo.photo_type === 'back_id')!
                                .photo_url,
                            )
                          : undefined
                      }
                      onUploaded={loadGuests}
                    />
                    <GuestPhotoUpload
                      guestEntryId={guest.id}
                      reservationId={reservation.id}
                      photoType="guest_photo"
                      label="Fotoğraf Yükle"
                      existingUrl={
                        guest.photos.find((photo) => photo.photo_type === 'guest_photo')
                          ? getGuestPhotoPublicUrl(
                              guest.photos.find((photo) => photo.photo_type === 'guest_photo')!
                                .photo_url,
                            )
                          : undefined
                      }
                      onUploaded={loadGuests}
                    />
                  </div>

                  {guest.photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {guest.photos.map((photo) => (
                        <div key={photo.id} className="flex flex-col gap-1">
                          <a
                            href={getGuestPhotoPublicUrl(photo.photo_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-lg border border-slate-200"
                            title={GUEST_PHOTO_LABELS[photo.photo_type]}
                          >
                            <img
                              src={getGuestPhotoPublicUrl(photo.photo_url)}
                              alt={`${guest.full_name} - ${GUEST_PHOTO_LABELS[photo.photo_type]}`}
                              className="h-16 w-16 object-cover"
                            />
                          </a>
                          {deletePhotoId === photo.id ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-2">
                              <p className="text-xs text-red-800">Fotoğraf silinsin mi?</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => void handleConfirmDeletePhoto(photo)}
                                  className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  Evet Sil
                                </button>
                                <button
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => setDeletePhotoId(null)}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                                >
                                  Vazgeç
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletePhotoId(photo.id)}
                              className="text-xs font-semibold text-red-700 hover:underline"
                            >
                              Fotoğraf Sil
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
          }}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Misafir Ekle
        </button>
      ) : (
        <form
          onSubmit={handleSaveGuest}
          className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-white p-4"
        >
          <GuestFormFields form={form} onChange={setForm} />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
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

function GuestFormFields({
  form,
  onChange,
}: {
  form: GuestFormState
  onChange: (form: GuestFormState) => void
}) {
  return (
    <>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Ad Soyad</span>
        <input
          type="text"
          value={form.fullName}
          onChange={(event) => onChange({ ...form, fullName: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-600 focus:ring-2"
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">TC Kimlik No</span>
        <input
          type="text"
          inputMode="numeric"
          value={form.tcNo}
          onChange={(event) => onChange({ ...form, tcNo: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-600 focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Telefon</span>
        <input
          type="tel"
          value={form.phone}
          onChange={(event) => onChange({ ...form, phone: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-600 focus:ring-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Not</span>
        <textarea
          value={form.notes}
          onChange={(event) => onChange({ ...form, notes: event.target.value })}
          rows={2}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-600 focus:ring-2"
        />
      </label>
    </>
  )
}
