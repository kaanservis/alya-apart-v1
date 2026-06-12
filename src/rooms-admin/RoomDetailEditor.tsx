import { useEffect, useState } from 'react'
import { SlideOverPanel } from '../components/SlideOverPanel'
import type { WebsiteRoom } from '../types/database'
import { updateRoomContent } from '../website/websiteService'
import { CopyRoomShareLinkButton } from './CopyRoomShareLinkButton'
import { RoomPhotoGallery } from './RoomPhotoGallery'
import { SUGGESTED_ROOM_FEATURES } from './roomFeatures'

interface RoomDetailEditorProps {
  room: WebsiteRoom
  onClose: () => void
  onUpdated: () => void
}

function parseFeaturesInput(value: string) {
  return value
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean)
}

export function RoomDetailEditor({ room, onClose, onUpdated }: RoomDetailEditorProps) {
  const [description, setDescription] = useState(room.description)
  const [capacity, setCapacity] = useState(String(room.capacity))
  const [features, setFeatures] = useState<string[]>(room.features)
  const [customFeature, setCustomFeature] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDescription(room.description)
    setCapacity(String(room.capacity))
    setFeatures(room.features)
  }, [room])

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature],
    )
  }

  function addCustomFeature() {
    const trimmed = customFeature.trim()
    if (!trimmed || features.includes(trimmed)) {
      setCustomFeature('')
      return
    }

    setFeatures((current) => [...current, trimmed])
    setCustomFeature('')
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)

    const parsedCapacity = Number(capacity)

    try {
      await updateRoomContent(room.unitId, {
        description,
        capacity: parsedCapacity,
        features,
      })
      setMessage('Oda bilgileri kaydedildi.')
      onUpdated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kayıt başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SlideOverPanel
      open
      onClose={onClose}
      title={room.unitName}
      subtitle="Oda içeriği ve fotoğraf yönetimi"
      wide
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <CopyRoomShareLinkButton unitName={room.unitName} />

        <form onSubmit={(event) => void handleSave(event)} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Oda Bilgileri
            </h3>

            <div className="mt-4 space-y-4">
              <div className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Oda Adı</span>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
                  {room.unitName}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Oda adı yalnızca sistem kayıtlarından gelir ve değiştirilemez.
                </p>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Açıklama</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                />
              </label>

              <label className="block text-sm sm:max-w-xs">
                <span className="mb-1 block font-medium text-slate-700">Kapasite</span>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">Özellikler</span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_ROOM_FEATURES.map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                        features.includes(feature)
                          ? 'bg-blue-700 text-white ring-blue-700'
                          : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={customFeature}
                    onChange={(event) => setCustomFeature(event.target.value)}
                    placeholder="Özel özellik ekle"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none ring-blue-600 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={addCustomFeature}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ekle
                  </button>
                </div>

                {features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className="text-blue-600 hover:text-blue-900"
                          aria-label={`${feature} kaldır`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Virgülle ayırarak da girebilirsiniz:{' '}
                  {parseFeaturesInput('Klima, WiFi, Balkon').join(' • ')}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {busy ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
            </button>
          </section>
        </form>

        <RoomPhotoGallery
          room={room}
          busy={busy}
          onBusyChange={setBusy}
          onUpdated={onUpdated}
          onMessage={setMessage}
        />
      </div>
    </SlideOverPanel>
  )
}
