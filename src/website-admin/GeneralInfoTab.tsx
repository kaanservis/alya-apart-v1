import type { GeneralInfoForm } from './useWebsiteManagement'

interface GeneralInfoTabProps {
  form: GeneralInfoForm
  onFieldChange: <K extends keyof GeneralInfoForm>(key: K, value: GeneralInfoForm[K]) => void
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

export function GeneralInfoTab({ form, onFieldChange }: GeneralInfoTabProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <FormField label="Site Başlığı" hint="Ana sayfada görünen büyük başlık.">
          <input
            type="text"
            value={form.siteTitle}
            onChange={(event) => onFieldChange('siteTitle', event.target.value)}
            className={inputClassName()}
            placeholder="ALYA APART"
          />
        </FormField>

        <FormField label="Alt Başlık" hint="Başlığın altında görünen kısa açıklama.">
          <input
            type="text"
            value={form.subtitle}
            onChange={(event) => onFieldChange('subtitle', event.target.value)}
            className={inputClassName()}
            placeholder="Avşa Adası - Yiğitler Köyü"
          />
        </FormField>

        <FormField label="Telefon" hint="Örnek: 0553 460 6678">
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => onFieldChange('phone', event.target.value)}
            className={inputClassName()}
            placeholder="0553 460 6678"
          />
        </FormField>

        <FormField label="WhatsApp" hint="Uluslararası format, boşluksuz. Örnek: 905534606678">
          <input
            type="text"
            inputMode="numeric"
            value={form.whatsapp}
            onChange={(event) => onFieldChange('whatsapp', event.target.value)}
            className={inputClassName()}
            placeholder="905534606678"
          />
        </FormField>

        <FormField label="Instagram" hint="Kullanıcı adı veya profil bağlantısı.">
          <input
            type="text"
            value={form.instagram}
            onChange={(event) => onFieldChange('instagram', event.target.value)}
            className={inputClassName()}
            placeholder="@alyaapart"
          />
        </FormField>

        <FormField label="Google Maps" hint="Haritada açılacak tam Google Maps URL'si.">
          <input
            type="url"
            value={form.mapsLink}
            onChange={(event) => onFieldChange('mapsLink', event.target.value)}
            className={inputClassName()}
            placeholder="https://maps.google.com/?q=..."
          />
        </FormField>

        <div className="lg:col-span-2">
          <FormField label="Adres" hint="Web sitesinde gösterilecek tam adres metni.">
            <textarea
              value={form.address}
              onChange={(event) => onFieldChange('address', event.target.value)}
              rows={3}
              className={inputClassName()}
              placeholder="Avşa Adası, Yiğitler Köyü, Balıkesir"
            />
          </FormField>
        </div>
      </div>
    </section>
  )
}
