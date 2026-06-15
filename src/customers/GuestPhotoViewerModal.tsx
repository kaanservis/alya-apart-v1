interface GuestPhotoViewerModalProps {
  open: boolean
  title: string
  imageUrl: string | null
  onClose: () => void
}

export function GuestPhotoViewerModal({
  open,
  title,
  imageUrl,
  onClose,
}: GuestPhotoViewerModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Görseli kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center bg-slate-50 p-4 sm:p-6">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md"
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-10 text-center">
              <p className="text-sm font-medium text-slate-500">Görsel yüklenmemiş</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
