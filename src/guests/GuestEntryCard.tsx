import { useState } from 'react'
import { maskTcNumber } from '../auth/formatMoney'
import {
  adminActionBtnDanger,
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import { GuestPhotoViewerModal } from '../customers/GuestPhotoViewerModal'
import type { GuestPhoto, Reservation } from '../types/database'
import { GuestFormFields } from './GuestFormFields'
import { GuestIdPhotoSlot } from './GuestIdPhotoSlot'
import { isGuestReservationOwner } from './guestService'
import {
  isGuestFormSubmittable,
  type GuestFormFieldErrors,
  type GuestFormValues,
} from './guestFormValidation'
import type { GuestEntryWithPhotos } from './guestTypes'

interface GuestEntryCardProps {
  guest: GuestEntryWithPhotos
  index: number
  reservation: Reservation
  canViewCustomerTc: boolean
  canUploadPhotos: boolean
  isEditing: boolean
  editForm: GuestFormValues
  editFormErrors: GuestFormFieldErrors
  saving: boolean
  deleting: boolean
  deleteConfirm: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onEditFormChange: (updates: Partial<GuestFormValues>) => void
  onSaveEdit: (event: React.FormEvent) => void
  onDeleteClick: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onPhotoUploaded: (photo: GuestPhoto) => void
}

function GuestActionButtons({
  onStartEdit,
  onDeleteClick,
  showDelete,
  layout,
}: {
  onStartEdit: () => void
  onDeleteClick: () => void
  showDelete: boolean
  layout: 'row' | 'column'
}) {
  const layoutClass = layout === 'column' ? 'flex-col' : 'flex-row'

  return (
    <div className={`flex shrink-0 gap-1 ${layoutClass}`}>
      <button
        type="button"
        onClick={onStartEdit}
        title="Düzenle"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm transition hover:border-blue-300 hover:bg-blue-50 max-md:h-7 max-md:w-7 max-md:text-xs"
      >
        ✏️
      </button>
      {showDelete && (
        <button
          type="button"
          onClick={onDeleteClick}
          title="Sil"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm transition hover:border-red-300 hover:bg-red-50 max-md:h-7 max-md:w-7 max-md:text-xs"
        >
          🗑️
        </button>
      )}
    </div>
  )
}

export function GuestEntryCard({
  guest,
  index,
  reservation,
  canViewCustomerTc,
  canUploadPhotos,
  isEditing,
  editForm,
  editFormErrors,
  saving,
  deleting,
  deleteConfirm,
  onStartEdit,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
  onPhotoUploaded,
}: GuestEntryCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerTitle, setViewerTitle] = useState('')
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  const frontPhoto = guest.photos.find((photo) => photo.photo_type === 'front_id') ?? null
  const backPhoto = guest.photos.find((photo) => photo.photo_type === 'back_id') ?? null
  const canDeleteGuest = !isGuestReservationOwner(guest, reservation.ad_soyad)

  function openViewer(title: string, imageUrl: string) {
    setViewerTitle(title)
    setViewerUrl(imageUrl)
    setViewerOpen(true)
  }

  if (isEditing) {
    return (
      <li className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <form noValidate onSubmit={onSaveEdit} className="space-y-3">
          <GuestFormFields
            form={editForm}
            onChange={(updates) => onEditFormChange(updates)}
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
            <button type="button" onClick={onCancelEdit} className={adminActionBtnSecondary}>
              İptal
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="w-full rounded-xl border border-slate-200 bg-white shadow-sm max-md:rounded-xl">
      <div className="flex min-h-[130px] flex-col p-3 sm:min-h-[140px] sm:flex-row sm:items-center sm:gap-3 max-md:min-h-0 max-md:p-3">
          <div className="hidden sm:block">
            <GuestActionButtons
              onStartEdit={onStartEdit}
              onDeleteClick={onDeleteClick}
              showDelete={canDeleteGuest}
              layout="column"
            />
          </div>

          <div className="relative min-w-0 flex-1">
            <div className="absolute right-0 top-0 sm:hidden">
              <GuestActionButtons
                onStartEdit={onStartEdit}
                onDeleteClick={onDeleteClick}
                showDelete={canDeleteGuest}
                layout="row"
              />
            </div>

            <div className="pr-16 sm:pr-0">
              <p className="text-[22px] font-bold uppercase leading-tight tracking-tight text-slate-900 max-md:text-lg">
                {index + 1}. {guest.full_name.toLocaleUpperCase('tr-TR')}
              </p>
              {guest.tc_no && (
                <p className="mt-1 text-[18px] font-semibold tracking-wide text-slate-800 max-md:text-sm">
                  TC: {maskTcNumber(guest.tc_no, canViewCustomerTc)}
                </p>
              )}
              {(guest.phone?.trim() || guest.notes?.trim()) && (
                <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                  {guest.phone?.trim() && <p>{guest.phone.trim()}</p>}
                  {guest.notes?.trim() && <p className="line-clamp-1">{guest.notes.trim()}</p>}
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2 sm:hidden">
              <GuestIdPhotoSlot
                guestEntryId={guest.id}
                reservationId={reservation.id}
                photoType="front_id"
                existingPhoto={frontPhoto}
                onUploaded={onPhotoUploaded}
                onView={openViewer}
                disabled={!canUploadPhotos}
                capture
              />
              <GuestIdPhotoSlot
                guestEntryId={guest.id}
                reservationId={reservation.id}
                photoType="back_id"
                existingPhoto={backPhoto}
                onUploaded={onPhotoUploaded}
                onView={openViewer}
                disabled={!canUploadPhotos}
                capture
              />
            </div>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <GuestIdPhotoSlot
              guestEntryId={guest.id}
              reservationId={reservation.id}
              photoType="front_id"
              existingPhoto={frontPhoto}
              onUploaded={onPhotoUploaded}
              onView={openViewer}
              disabled={!canUploadPhotos}
              capture
            />
            <GuestIdPhotoSlot
              guestEntryId={guest.id}
              reservationId={reservation.id}
              photoType="back_id"
              existingPhoto={backPhoto}
              onUploaded={onPhotoUploaded}
              onView={openViewer}
              disabled={!canUploadPhotos}
              capture
            />
          </div>
        </div>

        {deleteConfirm && (
          <div className="border-t border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs font-medium text-red-800">Bu misafiri silmek istiyor musunuz?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={onConfirmDelete}
                className={`${adminActionBtnDanger} disabled:opacity-60`}
              >
                {deleting ? '...' : 'Sil'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={onCancelDelete}
                className={adminActionBtnSecondary}
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

      <GuestPhotoViewerModal
        open={viewerOpen}
        title={viewerTitle}
        imageUrl={viewerUrl}
        onClose={() => setViewerOpen(false)}
      />
    </li>
  )
}
