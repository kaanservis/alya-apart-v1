import type { GeneralInfoForm } from './useWebsiteManagement'

interface GeneralInfoTabProps {
  form: GeneralInfoForm
  heroPreviewUrl: string | null
  saving: boolean
  onFieldChange: <K extends keyof GeneralInfoForm>(key: K, value: GeneralInfoForm[K]) => void
  onHeroSelect: (file: File) => void
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-slate-900">{label}</span>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function inputClassName() {
  return 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2'
}

export function GeneralInfoTab({
  form,
  heroPreviewUrl,
  saving,
  onFieldChange,
  onHeroSelect,
}: GeneralInfoTabProps) {
  function handleHeroChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    onHeroSelect(file)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Site Başlığı" hint="Ana sayfada görünen büyük başlık (site_title).">
            <input
              type="text"
              value={form.site_title}
              onChange={(event) => onFieldChange('site_title', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="Alt Başlık" hint="Başlığın altında görünen kısa açıklama (site_subtitle).">
            <input
              type="text"
              value={form.site_subtitle}
              onChange={(event) => onFieldChange('site_subtitle', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="Karşılama Metni" hint="Hero bölümünde görünen kısa metin (welcome_text).">
            <input
              type="text"
              value={form.welcome_text}
              onChange={(event) => onFieldChange('welcome_text', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="Kısa Hakkında" hint="Bölüm açıklamalarında kullanılır (about_short).">
            <textarea
              value={form.about_short}
              onChange={(event) => onFieldChange('about_short', event.target.value)}
              rows={3}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="Telefon" hint="Örnek: 0553 460 6678">
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => onFieldChange('phone', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="WhatsApp" hint="Uluslararası format, boşluksuz. Örnek: 905534606678">
            <input
              type="text"
              inputMode="numeric"
              value={form.whatsapp}
              onChange={(event) => onFieldChange('whatsapp', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="Instagram" hint="Kullanıcı adı (instagram).">
            <input
              type="text"
              value={form.instagram}
              onChange={(event) => onFieldChange('instagram', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <FormField label="Google Maps Bağlantısı" hint="Haritada açılacak URL (maps_link).">
            <input
              type="url"
              value={form.maps_link}
              onChange={(event) => onFieldChange('maps_link', event.target.value)}
              className={inputClassName()}
            />
          </FormField>

          <div className="lg:col-span-2">
            <FormField label="Adres" hint="Web sitesinde gösterilecek tam adres metni (address).">
              <textarea
                value={form.address}
                onChange={(event) => onFieldChange('address', event.target.value)}
                rows={3}
                className={inputClassName()}
              />
            </FormField>
          </div>

          <div className="lg:col-span-2">
            <FormField
              label="Google Maps Embed"
              hint="iframe embed kodu veya embed URL (maps_embed)."
            >
              <textarea
                value={form.maps_embed}
                onChange={(event) => onFieldChange('maps_embed', event.target.value)}
                rows={4}
                className={inputClassName()}
              />
            </FormField>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hero Görseli</h3>
            <p className="mt-1 text-sm text-slate-600">
              Ana sayfa arka plan görseli (hero_image_path). Kaydet butonuna basıldığında Supabase&apos;e
              yüklenir.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
            Hero Görseli Seç
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={saving}
              onChange={handleHeroChange}
              className="hidden"
            />
          </label>
        </div>

        {heroPreviewUrl ? (
          <img
            src={heroPreviewUrl}
            alt="Hero önizleme"
            className="mt-4 aspect-[16/10] w-full max-w-3xl rounded-xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Henüz hero görseli yok. Apart kapak fotoğrafı yoksa bu alan ana sayfa arka planında kullanılır.
          </p>
        )}
      </section>
    </div>
  )
}
