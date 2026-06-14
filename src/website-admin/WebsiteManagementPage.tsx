import { ApartmentEditorTab } from './ApartmentEditorTab'
import { GeneralInfoTab } from './GeneralInfoTab'
import { useWebsiteManagement } from './useWebsiteManagement'

export function WebsiteManagementPage() {
  const {
    activeTab,
    setActiveTab,
    generalForm,
    apartments,
    loading,
    saving,
    error,
    message,
    updateGeneralField,
    updateApartmentField,
    saveAll,
    stageCoverPhoto,
    stageGalleryPhotos,
    markGalleryPhotoForDeletion,
  } = useWebsiteManagement()

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <h1 className="text-2xl font-bold tracking-wide text-slate-900 sm:text-3xl">
          WEB SİTESİ YÖNETİMİ
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tüm bilgiler Supabase&apos;den yüklenir ve kaydet butonu ile Supabase&apos;e kaydedilir.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'general'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          Genel Bilgiler
        </button>

        {apartments?.map((profile) => {
          const isActive = activeTab === profile.apartment.id

          return (
            <button
              key={profile.apartment.id}
              type="button"
              onClick={() => setActiveTab(profile.apartment.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {profile.apartment.name || `Apart #${profile.apartment.id}`}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Supabase&apos;den veriler yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'general' && (
            <GeneralInfoTab form={generalForm} onFieldChange={updateGeneralField} />
          )}

          {apartments?.map(
            (profile) =>
              activeTab === profile.apartment.id && (
                <ApartmentEditorTab
                  key={profile.apartment.id}
                  apartmentId={profile.apartment.id}
                  profile={profile}
                  saving={saving}
                  onFieldChange={(key, value) =>
                    updateApartmentField(profile.apartment.id, key, value)
                  }
                  onCoverSelect={(file) => stageCoverPhoto(profile.apartment.id, file)}
                  onGallerySelect={(files) => stageGalleryPhotos(profile.apartment.id, files)}
                  onGalleryDelete={(photo) =>
                    markGalleryPhotoForDeletion(profile.apartment.id, photo)
                  }
                />
              ),
          )}

          {!loading && apartments && apartments.length === 0 && activeTab !== 'general' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Supabase&apos;de kayıtlı apart bulunamadı.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <button
              type="button"
              disabled={saving || loading}
              onClick={() => void saveAll()}
              className="w-full rounded-2xl bg-blue-700 px-6 py-4 text-base font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
            >
              {saving ? 'Kaydediliyor...' : '💾 Tüm Değişiklikleri Kaydet'}
            </button>
            <p className="mt-3 text-center text-sm text-slate-500">
              Genel bilgiler, apart adları, açıklamalar, kapak fotoğrafları ve galeri fotoğrafları
              tek butonla Supabase&apos;e kaydedilir.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
