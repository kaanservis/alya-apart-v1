import { useEffect } from 'react'

interface PhotoLightboxProps {
  photos: { id: string; url: string }[]
  activeIndex: number
  roomName: string
  onClose: () => void
  onChangeIndex: (index: number) => void
}

export function PhotoLightbox({
  photos,
  activeIndex,
  roomName,
  onClose,
  onChangeIndex,
}: PhotoLightboxProps) {
  const activePhoto = photos[activeIndex]

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowLeft' && activeIndex > 0) {
        onChangeIndex(activeIndex - 1)
      }

      if (event.key === 'ArrowRight' && activeIndex < photos.length - 1) {
        onChangeIndex(activeIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, onChangeIndex, onClose, photos.length])

  if (!activePhoto) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4">
      <button
        type="button"
        aria-label="Galeriyi kapat"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3 text-white">
          <div>
            <p className="text-sm font-medium text-slate-300">{roomName}</p>
            <p className="text-lg font-bold">
              Fotoğraf {activeIndex + 1} / {photos.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/20"
          >
            Kapat
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
          <img
            src={activePhoto.url}
            alt={`${roomName} fotoğraf ${activeIndex + 1}`}
            className="max-h-[70vh] w-full object-contain"
          />
        </div>

        {photos.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => onChangeIndex(activeIndex - 1)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={activeIndex === photos.length - 1}
              onClick={() => onChangeIndex(activeIndex + 1)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onChangeIndex(index)}
              className={`overflow-hidden rounded-lg ring-2 ${
                index === activeIndex ? 'ring-white' : 'ring-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
