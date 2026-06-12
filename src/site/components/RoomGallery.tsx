import { useState } from 'react'
import type { WebsiteRoom } from '../../types/database'
import { PhotoLightbox } from './PhotoLightbox'

interface RoomGalleryProps {
  roomName: string
  photos: WebsiteRoom['photos']
  variant?: 'card' | 'detail'
}

export function RoomGallery({ roomName, photos, variant = 'card' }: RoomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const hasPhotos = photos.length > 0
  const activePhoto = hasPhotos ? photos[activeIndex] : null

  const aspectClass = variant === 'detail' ? 'aspect-[16/10] sm:aspect-[21/9]' : 'aspect-[4/3]'

  function openLightbox(index: number) {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => hasPhotos && openLightbox(activeIndex)}
        className={`group relative block w-full overflow-hidden rounded-2xl bg-slate-200 ${
          hasPhotos ? 'cursor-zoom-in' : 'cursor-default'
        }`}
        aria-label={hasPhotos ? `${roomName} galerisini aç` : undefined}
      >
        {activePhoto ? (
          <>
            <img
              src={activePhoto.url}
              alt={`${roomName} fotoğraf ${activeIndex + 1}`}
              className={`${aspectClass} w-full object-cover transition duration-300 group-hover:scale-[1.02]`}
              loading="lazy"
            />
            {hasPhotos && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Galeriyi Aç
              </span>
            )}
          </>
        ) : (
          <div
            className={`flex ${aspectClass} w-full items-center justify-center bg-gradient-to-br from-blue-100 to-slate-200`}
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">{roomName}</p>
              <p className="mt-1 text-xs text-slate-500">Fotoğraf yakında eklenecek</p>
            </div>
          </div>
        )}
      </button>

      {photos.length > 1 && (
        <div className={`mt-3 grid gap-2 ${variant === 'detail' ? 'grid-cols-5 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-5'}`}>
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => openLightbox(index)}
              className={`overflow-hidden rounded-xl ring-2 transition ${
                index === activeIndex ? 'ring-blue-600' : 'ring-transparent hover:ring-slate-300'
              }`}
            >
              <img
                src={photo.url}
                alt={`${roomName} küçük görsel ${index + 1}`}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && hasPhotos && (
        <PhotoLightbox
          photos={photos}
          activeIndex={activeIndex}
          roomName={roomName}
          onClose={() => setLightboxOpen(false)}
          onChangeIndex={setActiveIndex}
        />
      )}
    </div>
  )
}
