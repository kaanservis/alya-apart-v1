import { RoomGallery } from '../components/RoomGallery'
import { RoomWhatsAppButton } from '../components/SiteActions'
import { findRoomByShareSlug, getRoomCoverPhoto } from '../roomUtils'
import { getPrivateRoomSharePath } from '../roomShareLink'
import { getSiteHomePath } from '../siteRouter'
import { useSiteContent } from '../SiteContentContext'
import { useWebsiteRooms } from '../useWebsiteRooms'
import { useSiteSeo } from '../useSiteSeo'

interface PrivateRoomPageProps {
  shareSlug: string
}

export function PrivateRoomPage({ shareSlug }: PrivateRoomPageProps) {
  const { settings } = useSiteContent()
  const { rooms, loading, error } = useWebsiteRooms()
  const room = findRoomByShareSlug(rooms, shareSlug)
  const coverPhoto = room ? getRoomCoverPhoto(room) : null

  useSiteSeo({
    title: room ? room.unitName : 'Özel Oda',
    description: room?.description ?? settings.about_short,
    path: getPrivateRoomSharePath(room?.unitName ?? shareSlug),
    image: coverPhoto ?? undefined,
    noIndex: true,
  })

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
        <p className="text-sm text-slate-600">Oda bilgileri yükleniyor...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      </section>
    )
  }

  if (!room) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Sayfa bulunamadı</h1>
        <p className="mt-3 text-sm text-slate-600">
          Bu bağlantı geçersiz olabilir veya içerik kaldırılmış olabilir.
        </p>
        <a
          href={getSiteHomePath()}
          className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Ana Sayfaya Dön
        </a>
      </section>
    )
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <a
          href={getSiteHomePath()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← {settings.site_title}
        </a>

        <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-3">
            <RoomGallery roomName={room.unitName} photos={room.photos} variant="detail" />
          </div>

          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Özel Oda Sayfası</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {room.unitName}
            </h1>
            <p className="mt-2 text-base font-semibold text-blue-700">
              Kapasite: {room.capacity} kişi
            </p>

            <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">{room.description}</p>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Özellikler</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {room.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-100"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 p-5">
              <p className="text-sm font-semibold text-slate-900">{settings.welcome_text || settings.site_subtitle}</p>
              <p className="mt-2 text-sm text-slate-600">{settings.about_short}</p>
              <div className="mt-4">
                <RoomWhatsAppButton roomName={room.unitName} className="w-full sm:w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
