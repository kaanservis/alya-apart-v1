import { useState } from 'react'
import type { WebsiteRoom } from '../types/database'
import {
  deleteRoomPhoto,
  reorderRoomPhotos,
  uploadRoomPhoto,
} from '../website/websiteService'
import { PhotoLightbox } from './PhotoLightbox'

interface RoomPhotoGalleryProps {
  room: WebsiteRoom
  busy: boolean
  onBusyChange: (busy: boolean) => void
  onUpdated: () => void
  onMessage: (message: string | null) => void
}

export function RoomPhotoGallery({
  room,
  busy,
  onBusyChange,
  onUpdated,
  onMessage,
}: RoomPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    onBusyChange(true)
    onMessage(null)

    try {
      await uploadRoomPhoto(room.unitId, file)
      onMessage('Fotoğraf yüklendi.')
      onUpdated()
    } catch (uploadError) {
      onMessage(uploadError instanceof Error ? uploadError.message : 'Fotoğraf yüklenemedi.')
    } finally {
      onBusyChange(false)
    }
  }

  async function handleDelete(photoId: string, storagePath: string) {
    if (!window.confirm('Bu fotoğraf silinsin mi?')) {
      return
    }

    onBusyChange(true)
    onMessage(null)

    try {
      await deleteRoomPhoto(photoId, storagePath)
      onMessage('Fotoğraf silindi.')
      onUpdated()
    } catch (deleteError) {
      onMessage(deleteError instanceof Error ? deleteError.message : 'Fotoğraf silinemedi.')
    } finally {
      onBusyChange(false)
    }
  }

  async function handleMove(photoId: string, direction: 'up' | 'down') {
    const currentIds = room.photos.map((photo) => photo.id)
    const index = currentIds.indexOf(photoId)

    if (index < 0) {
      return
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= currentIds.length) {
      return
    }

    const reordered = [...currentIds]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]

    onBusyChange(true)
    onMessage(null)

    try {
      await reorderRoomPhotos(room.unitId, reordered)
      onMessage('Fotoğraf sırası güncellendi.')
      onUpdated()
    } catch (reorderError) {
      onMessage(reorderError instanceof Error ? reorderError.message : 'Sıralama güncellenemedi.')
    } finally {
      onBusyChange(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Fotoğraflar</h3>
          <p className="mt-1 text-sm text-slate-600">
            {room.photos.length} fotoğraf • Web sitesinde kullanıma hazır
          </p>
        </div>
        <label className="block">
          <span className="sr-only">Fotoğraf yükle</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={busy}
            onChange={(event) => void handleUpload(event)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800 disabled:opacity-50 sm:w-auto"
          />
        </label>
      </div>

      {room.photos.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Henüz fotoğraf yok. Yüklemek için dosya seçin.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {room.photos.map((photo, index) => (
            <article
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="block w-full"
              >
                <img
                  src={photo.url}
                  alt={`${room.unitName} ${index + 1}`}
                  className="aspect-square w-full object-cover transition hover:opacity-90"
                />
              </button>
              <div className="space-y-2 p-3">
                <p className="text-xs font-semibold text-slate-500">Sıra {index + 1}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => void handleMove(photo.id, 'up')}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === room.photos.length - 1}
                    onClick={() => void handleMove(photo.id, 'down')}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDelete(photo.id, photo.storagePath)}
                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={room.photos}
          activeIndex={lightboxIndex}
          roomName={room.unitName}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </section>
  )
}
