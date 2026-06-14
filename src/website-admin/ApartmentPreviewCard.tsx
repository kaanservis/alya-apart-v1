import type { ApartmentProfile } from '../types/database'
import { APARTMENT_FEATURES } from '../website/apartmentDefaults'

interface ApartmentPreviewCardProps {
  profile: ApartmentProfile
}

export function ApartmentPreviewCard({ profile }: ApartmentPreviewCardProps) {
  const activeFeatures = APARTMENT_FEATURES.filter(
    (feature) => profile.apartment[feature.key],
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Önizleme</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">Preview Card</h3>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {profile.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt={profile.apartment.name}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
            Kapak fotoğrafı yok
          </div>
        )}

        <div className="space-y-3 p-4">
          <div>
            <h4 className="text-xl font-bold text-slate-900">
              {profile.apartment.name || 'Apart Adı'}
            </h4>
            <p className="mt-2 line-clamp-4 text-sm text-slate-600">
              {profile.apartment.description || 'Açıklama burada görünecek.'}
            </p>
          </div>

          {activeFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFeatures.map((feature) => (
                <span
                  key={feature.key}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100"
                >
                  {feature.label}
                </span>
              ))}
            </div>
          )}

          {profile.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {profile.photos.slice(0, 4).map((photo) => (
                <img
                  key={String(photo.id)}
                  src={photo.photoUrl}
                  alt=""
                  className="aspect-square rounded-lg object-cover ring-1 ring-slate-200"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
