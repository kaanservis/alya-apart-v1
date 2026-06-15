import { memo, useEffect, useRef, useState } from 'react'
import type { GuestPhoto, GuestPhotoType } from '../types/database'
import { getGuestPhotoPublicUrl, getGuestPhotoUploadErrorMessage, uploadGuestPhoto } from './guestService'
import { GUEST_PHOTO_LABELS } from './guestTypes'

interface GuestPhotoUploadProps {
  guestEntryId: string
  reservationId: string
  photoType: GuestPhotoType
  capture?: boolean
  existingPhoto?: GuestPhoto | null
  onUploaded: (photo: GuestPhoto) => void | Promise<void>
  onDelete?: (photo: GuestPhoto) => Promise<void>
  deleting?: boolean
  disabled?: boolean
}

export const GuestPhotoUpload = memo(function GuestPhotoUpload({
  guestEntryId,
  reservationId,
  photoType,
  capture = false,
  existingPhoto,
  onUploaded,
  onDelete,
  deleting = false,
  disabled = false,
}: GuestPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const slotKey = `${guestEntryId}:${photoType}`

  const label = GUEST_PHOTO_LABELS[photoType]
  const storedUrl = existingPhoto ? getGuestPhotoPublicUrl(existingPhoto.photo_url) : null
  const thumbnailUrl = previewUrl ?? storedUrl

  useEffect(() => {
    setPreviewUrl(null)
    setSuccess(null)
    setError(null)
    setConfirmDelete(false)
  }, [slotKey])

  useEffect(() => {
    if (!success) {
      return
    }

    const timer = window.setTimeout(() => setSuccess(null), 4000)
    return () => window.clearTimeout(timer)
  }, [success])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      return
    }

    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Geçersiz dosya türü. Lütfen JPG veya PNG formatında bir fotoğraf yükleyin.')
      event.target.value = ''
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    try {
      const uploadedPhoto = await uploadGuestPhoto(guestEntryId, reservationId, photoType, file)
      const publicUrl = getGuestPhotoPublicUrl(uploadedPhoto.photo_url)

      setPreviewUrl(publicUrl)
      setSuccess('Fotoğraf başarıyla yüklendi.')
      setError(null)

      try {
        await onUploaded(uploadedPhoto)
      } catch {
        // Upload succeeded; keep success state even if parent refresh fails.
      }
    } catch (uploadError) {
      setPreviewUrl(existingPhoto ? getGuestPhotoPublicUrl(existingPhoto.photo_url) : null)
      setSuccess(null)
      setError(getGuestPhotoUploadErrorMessage(uploadError))
    } finally {
      URL.revokeObjectURL(localPreview)
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDelete() {
    if (!existingPhoto || !onDelete) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      await onDelete(existingPhoto)
      setPreviewUrl(null)
      setConfirmDelete(false)
    } catch {
      setError('Fotoğraf silinemedi. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div className="flex w-36 flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-800">{label}</p>

      <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white">
        {thumbnailUrl ? (
          <a href={thumbnailUrl} target="_blank" rel="noreferrer" title={`${label} görüntüle`}>
            <img
              src={thumbnailUrl}
              alt={label}
              className="h-24 w-full object-cover"
            />
          </a>
        ) : (
          <span className="px-2 text-center text-xs text-slate-400">Önizleme yok</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={disabled || uploading || deleting}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {disabled
          ? 'Yetki yok'
          : uploading
            ? 'Yükleniyor...'
            : capture
              ? `${label} Çek`
              : `${label} Yükle`}
      </button>

      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
          {success}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </p>
      )}

      {existingPhoto && onDelete && !disabled && (
        confirmDelete ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2">
            <p className="text-xs text-red-800">Fotoğraf silinsin mi?</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
              >
                {deleting ? 'Siliniyor...' : 'Evet Sil'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                Vazgeç
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading || deleting}
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-60"
          >
            Fotoğraf Sil
          </button>
        )
      )}
    </div>
  )
})
