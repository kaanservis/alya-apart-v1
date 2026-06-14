import type { ApartmentId, ApartmentPhoto, ApartmentProfile, ApartmentRow } from '../types/database'
import { APARTMENT_FEATURES } from '../website/apartmentDefaults'
import { ApartmentPreviewCard } from './ApartmentPreviewCard'

interface ApartmentEditorTabProps {
  apartmentId: ApartmentId
  profile: ApartmentProfile
  saving: boolean
  onFieldChange: <K extends keyof ApartmentRow>(key: K, value: ApartmentRow[K]) => void
  onCoverSelect: (file: File) => void
  onGallerySelect: (files: File[]) => void
  onGalleryDelete: (photo: ApartmentPhoto) => void
}

function fieldClassName() {
  return 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2'
}

export function ApartmentEditorTab({
  profile,
  saving,
  onFieldChange,
  onCoverSelect,
  onGallerySelect,
  onGalleryDelete,
}: ApartmentEditorTabProps) {
  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    onCoverSelect(file)
  }

  function handleGalleryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    onGallerySelect(files)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5">
            <label className="block text-sm">
              <span className="font-semibold text-slate-900">Apart Adı</span>
              <input
                type="text"
                value={profile.apartment.name}
                onChange={(event) => onFieldChange('name', event.target.value)}
                className={`mt-2 ${fieldClassName()}`}
                placeholder="ALYA APART"
              />
            </label>

            <label className="block text-sm">
              <span className="font-semibold text-slate-900">Açıklama</span>
              <textarea
                value={profile.apartment.description}
                onChange={(event) => onFieldChange('description', event.target.value)}
                rows={5}
                className={`mt-2 ${fieldClassName()}`}
                placeholder="Apart hakkında kısa açıklama..."
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Kapak Fotoğrafı Yükle</h3>
              <p className="mt-1 text-sm text-slate-600">
                Seçilen kapak fotoğrafı kaydet butonuna basıldığında Supabase&apos;e yüklenir.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
              Kapak Seç
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={saving}
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>
          </div>

          {profile.coverUrl && (
            <img
              src={profile.coverUrl}
              alt={profile.apartment.name}
              className="mt-4 aspect-[16/10] w-full max-w-xl rounded-xl object-cover ring-1 ring-slate-200"
            />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Galeri Fotoğrafları</h3>
              <p className="mt-1 text-sm text-slate-600">
                Birden fazla fotoğraf seçebilirsiniz. Kaydet butonuna basıldığında yüklenir.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
              Fotoğraf Yükle
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={saving}
                onChange={handleGalleryChange}
                className="hidden"
              />
            </label>
          </div>

          {profile.photos.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Henüz galeri fotoğrafı yok.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {profile.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200"
                >
                  <img src={photo.photoUrl} alt="" className="aspect-square w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onGalleryDelete(photo)}
                      className="w-full rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold text-slate-900">Özellikler</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {APARTMENT_FEATURES.map((feature) => (
              <label
                key={feature.key}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800"
              >
                <input
                  type="checkbox"
                  checked={profile.apartment[feature.key]}
                  onChange={(event) => onFieldChange(feature.key, event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                {feature.label}
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="xl:sticky xl:top-28 xl:self-start">
        <ApartmentPreviewCard profile={profile} />
      </div>
    </div>
  )
}
