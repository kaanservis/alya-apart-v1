import { useRef, useState } from 'react'
import type { GuestPhotoType } from '../types/database'
import { uploadGuestPhoto } from './guestService'
import { GUEST_PHOTO_LABELS } from './guestTypes'

interface GuestPhotoUploadProps {
  guestEntryId: string
  reservationId: string
  photoType: GuestPhotoType
  label: string
  capture?: boolean
  existingUrl?: string
  onUploaded: () => void
}

export function GuestPhotoUpload({
  guestEntryId,
  reservationId,
  photoType,
  label,
  capture = false,
  existingUrl,
  onUploaded,
}: GuestPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      await uploadGuestPhoto(guestEntryId, reservationId, photoType, file)
      onUploaded()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Fotoğraf yüklenemedi.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1">
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
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {uploading ? 'Yükleniyor...' : label}
      </button>
      {existingUrl && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          {GUEST_PHOTO_LABELS[photoType]} görüntüle
        </a>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
