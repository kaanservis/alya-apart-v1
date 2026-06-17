import { memo, useEffect, useRef, useState } from 'react'
import type { GuestPhoto, GuestPhotoType } from '../types/database'
import { getGuestPhotoPublicUrl, uploadGuestPhoto } from './guestService'
import { GUEST_PHOTO_LABELS } from './guestTypes'

interface GuestIdPhotoSlotProps {
  guestEntryId: string
  reservationId: string
  photoType: Extract<GuestPhotoType, 'front_id' | 'back_id'>
  existingPhoto?: GuestPhoto | null
  onUploaded: (photo: GuestPhoto) => void | Promise<void>
  onView: (title: string, imageUrl: string) => void
  disabled?: boolean
  capture?: boolean
}

export const GuestIdPhotoSlot = memo(function GuestIdPhotoSlot({
  guestEntryId,
  reservationId,
  photoType,
  existingPhoto,
  onUploaded,
  onView,
  disabled = false,
  capture = false,
}: GuestIdPhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const slotKey = `${guestEntryId}:${photoType}`

  const label = GUEST_PHOTO_LABELS[photoType]
  const shortLabel = photoType === 'front_id' ? 'Kimlik Ön' : 'Kimlik Arka'
  const storedUrl = existingPhoto ? getGuestPhotoPublicUrl(existingPhoto.photo_url) : null
  const displayUrl = previewUrl ?? storedUrl

  useEffect(() => {
    setPreviewUrl(null)
  }, [slotKey])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      return
    }

    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      event.target.value = ''
      return
    }

    setUploading(true)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    try {
      const uploadedPhoto = await uploadGuestPhoto(guestEntryId, reservationId, photoType, file)
      setPreviewUrl(getGuestPhotoPublicUrl(uploadedPhoto.photo_url))
      await onUploaded(uploadedPhoto)
    } catch {
      setPreviewUrl(existingPhoto ? getGuestPhotoPublicUrl(existingPhoto.photo_url) : null)
    } finally {
      URL.revokeObjectURL(localPreview)
      setUploading(false)
      event.target.value = ''
    }
  }

  function handlePreviewClick() {
    if (displayUrl) {
      onView(label, displayUrl)
      return
    }

    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handlePreviewClick}
        disabled={uploading}
        title={displayUrl ? `${label} — tam boy görüntüle` : `${label} yükle`}
        className="group relative h-[70px] w-[100px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm transition hover:border-blue-300 hover:shadow disabled:opacity-60"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={label}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center px-1 text-[10px] font-medium text-slate-400">
            <span className="text-lg leading-none text-slate-300">🪪</span>
            Fotoğraf yok
          </span>
        )}

        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-[10px] font-semibold text-slate-600">
            ...
          </span>
        )}

        {!disabled && !uploading && (
          <span className="absolute bottom-0 right-0 rounded-tl-md bg-slate-900/75 px-1 py-0.5 text-[9px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
            {displayUrl ? 'Büyüt' : 'Yükle'}
          </span>
        )}
      </button>

      <span className="max-w-[100px] truncate text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {shortLabel}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />

      {!disabled && displayUrl && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[10px] font-semibold text-blue-700 hover:underline"
        >
          Değiştir
        </button>
      )}
    </div>
  )
})
