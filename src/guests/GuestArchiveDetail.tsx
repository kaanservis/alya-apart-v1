import type { GuestEntryWithPhotos } from './guestTypes'
import { getGuestPhotoPublicUrl } from './guestService'
import { GUEST_PHOTO_LABELS } from './guestTypes'

interface GuestArchiveDetailProps {
  reservationOwner: string
  kisiSayisi: number
  guests: GuestEntryWithPhotos[]
}

export function GuestArchiveDetail({
  reservationOwner,
  kisiSayisi,
  guests,
}: GuestArchiveDetailProps) {
  return (
    <div className="space-y-4 border-t border-blue-100 bg-slate-50/80 px-4 py-4">
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-medium text-slate-600">Rezervasyon Sahibi: </span>
          <span className="font-semibold text-slate-900">{reservationOwner}</span>
        </p>
        <p>
          <span className="font-medium text-slate-600">Kişi Sayısı: </span>
          <span className="font-semibold text-slate-900">{kisiSayisi}</span>
        </p>
      </div>

      {guests.length === 0 ? (
        <p className="text-sm text-slate-600">Ek misafir kaydı bulunmuyor.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Tüm Misafirler
          </p>
          {guests.map((guest, index) => (
            <div
              key={guest.id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <p className="font-semibold text-slate-900">
                {index + 1}. {guest.full_name}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {guest.tc_no && <span>TC: {guest.tc_no}</span>}
                {guest.phone && <span>Tel: {guest.phone}</span>}
                {guest.notes && <span>Not: {guest.notes}</span>}
              </div>

              {guest.photos.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Kimlik Fotoğrafları
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {guest.photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={getGuestPhotoPublicUrl(photo.photo_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-slate-200"
                        title={GUEST_PHOTO_LABELS[photo.photo_type]}
                      >
                        <img
                          src={getGuestPhotoPublicUrl(photo.photo_url)}
                          alt={`${guest.full_name} - ${GUEST_PHOTO_LABELS[photo.photo_type]}`}
                          className="h-20 w-20 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
