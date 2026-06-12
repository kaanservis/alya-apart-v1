import { useState } from 'react'
import type { WebsiteGalleryCategory, WebsiteGalleryPhoto } from '../../types/database'
import {
  deleteWebsiteGalleryPhoto,
  reorderWebsiteGalleryPhotos,
  uploadWebsiteGalleryPhotos,
} from '../../website/websiteContentService'

interface SiteGalleryManagerProps {
  category: WebsiteGalleryCategory
  title: string
  description: string
  photos: WebsiteGalleryPhoto[]
  busy: boolean
  onBusyChange: (busy: boolean) => void
  onUpdated: () => void
  onMessage: (message: string | null) => void
}

export function SiteGalleryManager({
  category,
  title,
  description,
  photos,
  busy,
  onBusyChange,
  onUpdated,
  onMessage,
}: SiteGalleryManagerProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) {
      return
    }

    onBusyChange(true)
    onMessage(null)

    try {
      await uploadWebsiteGalleryPhotos(category, files)
      onMessage(`${files.length} fotoğraf yüklendi.`)
      onUpdated()
    } catch (uploadError) {
      onMessage(uploadError instanceof Error ? uploadError.message : 'Fotoğraf yüklenemedi.')
    } finally {
      onBusyChange(false)
    }
  }

  async function handleDelete(photo: WebsiteGalleryPhoto) {
    if (!window.confirm('Bu fotoğraf silinsin mi?')) {
      return
    }

    onBusyChange(true)
    onMessage(null)

    try {
      await deleteWebsiteGalleryPhoto(photo.id, photo.storagePath)
      onMessage('Fotoğraf silindi.')
      onUpdated()
    } catch (deleteError) {
      onMessage(deleteError instanceof Error ? deleteError.message : 'Fotoğraf silinemedi.')
    } finally {
      onBusyChange(false)
    }
  }

  async function persistOrder(nextPhotos: WebsiteGalleryPhoto[]) {
    onBusyChange(true)
    onMessage(null)

    try {
      await reorderWebsiteGalleryPhotos(
        category,
        nextPhotos.map((photo) => photo.id),
      )
      onMessage('Sıralama güncellendi.')
      onUpdated()
    } catch (reorderError) {
      onMessage(reorderError instanceof Error ? reorderError.message : 'Sıralama güncellenemedi.')
    } finally {
      onBusyChange(false)
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      return
    }

    const current = [...photos]
    const fromIndex = current.findIndex((photo) => photo.id === draggingId)
    const toIndex = current.findIndex((photo) => photo.id === targetId)

    if (fromIndex < 0 || toIndex < 0) {
      setDraggingId(null)
      return
    }

    const [moved] = current.splice(fromIndex, 1)
    current.splice(toIndex, 0, moved)
    setDraggingId(null)
    void persistOrder(current)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
          Fotoğraf Yükle
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={busy}
            onChange={(event) => void handleUpload(event)}
            className="hidden"
          />
        </label>
      </div>

      {photos.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Henüz fotoğraf yok. Sürükleyip bırakarak sıralayabilirsiniz.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              draggable={!busy}
              onDragStart={() => setDraggingId(photo.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(photo.id)}
              className={`group relative overflow-hidden rounded-xl ring-1 ring-slate-200 ${
                draggingId === photo.id ? 'opacity-50' : ''
              }`}
            >
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-2 py-1 text-[10px] text-white">
                <span>Sürükle</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete(photo)}
                  className="rounded bg-red-600 px-2 py-0.5 font-semibold hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
