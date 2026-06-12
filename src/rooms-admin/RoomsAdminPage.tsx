import { useCallback, useEffect, useState } from 'react'
import type { WebsiteRoom } from '../types/database'
import { fetchAdminWebsiteRooms } from '../website/websiteService'
import { RoomDetailEditor } from './RoomDetailEditor'

interface RoomsAdminPageProps {
  refreshToken: number
  onUpdated: () => void
}

export function RoomsAdminPage({ refreshToken, onUpdated }: RoomsAdminPageProps) {
  const [rooms, setRooms] = useState<WebsiteRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const loadRooms = useCallback(async () => {
    setLoading(true)

    try {
      const data = await fetchAdminWebsiteRooms()
      setRooms(data)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Odalar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms, refreshToken])

  const selectedRoom = rooms.find((room) => room.unitId === selectedRoomId) ?? null

  function handleRoomUpdated() {
    void loadRooms()
    onUpdated()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">İçerik Yönetimi</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Odalar</h2>
        <p className="mt-2 text-sm text-slate-600">
          Oda açıklamaları, kapasite, özellikler ve fotoğrafları yönetin. Her oda için özel
          paylaşım linki oluşturulur — odalar web sitesinde herkese açık listelenmez.
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">Odalar yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!loading && !error && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => {
            const coverPhoto = room.photos[0]

            return (
              <button
                key={room.unitId}
                type="button"
                onClick={() => setSelectedRoomId(room.unitId)}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto.url}
                      alt={room.unitName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                      Fotoğraf yok
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-slate-900">{room.unitName}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{room.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span>{room.capacity} kişi</span>
                    <span>•</span>
                    <span>{room.photos.length} fotoğraf</span>
                    <span>•</span>
                    <span>{room.features.length} özellik</span>
                  </div>
                </div>
              </button>
            )
          })}
        </section>
      )}

      {selectedRoom && (
        <RoomDetailEditor
          room={selectedRoom}
          onClose={() => setSelectedRoomId(null)}
          onUpdated={handleRoomUpdated}
        />
      )}
    </div>
  )
}
