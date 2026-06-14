import { useState } from 'react'
import { SITE_CONFIG } from '../site/siteConfig'

interface WebsiteManagementForm {
  siteTitle: string
  subtitle: string
  phone: string
  whatsapp: string
  instagram: string
  mapsLink: string
  address: string
}

const INITIAL_FORM: WebsiteManagementForm = {
  siteTitle: SITE_CONFIG.name,
  subtitle: SITE_CONFIG.tagline,
  phone: SITE_CONFIG.phone,
  whatsapp: '905320000000',
  instagram: SITE_CONFIG.instagramHandle,
  mapsLink: SITE_CONFIG.mapsLink,
  address: SITE_CONFIG.address,
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

export function WebsiteManagementPage() {
  const [form, setForm] = useState<WebsiteManagementForm>(INITIAL_FORM)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  function updateField<K extends keyof WebsiteManagementForm>(key: K, value: WebsiteManagementForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setSavedMessage(null)
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSavedMessage('Değişiklikler kaydedildi.')
    window.setTimeout(() => setSavedMessage(null), 3500)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Web Sitesi</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">🌐 Web Sitesi Yönetimi</h2>
        <p className="mt-2 text-sm text-slate-600">
          Genel site bilgilerini buradan düzenleyin.
        </p>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Site Başlığı" hint="Ana sayfada görünen büyük başlık.">
            <input
              type="text"
              value={form.siteTitle}
              onChange={(event) => updateField('siteTitle', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="ALYA APART"
            />
          </FormField>

          <FormField label="Alt Başlık" hint="Başlığın altında görünen kısa açıklama.">
            <input
              type="text"
              value={form.subtitle}
              onChange={(event) => updateField('subtitle', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="Avşa Adası - Yiğitler Köyü"
            />
          </FormField>

          <FormField label="Telefon" hint="Örnek: 0553 460 6678">
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="0553 460 6678"
            />
          </FormField>

          <FormField label="WhatsApp" hint="Uluslararası format, boşluksuz. Örnek: 905534606678">
            <input
              type="text"
              inputMode="numeric"
              value={form.whatsapp}
              onChange={(event) => updateField('whatsapp', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="905534606678"
            />
          </FormField>

          <FormField label="Instagram" hint="Kullanıcı adı veya profil bağlantısı.">
            <input
              type="text"
              value={form.instagram}
              onChange={(event) => updateField('instagram', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="@alyaapart"
            />
          </FormField>

          <FormField label="Google Maps Linki" hint="Haritada açılacak tam Google Maps URL'si.">
            <input
              type="url"
              value={form.mapsLink}
              onChange={(event) => updateField('mapsLink', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
              placeholder="https://maps.google.com/?q=..."
            />
          </FormField>

          <div className="lg:col-span-2">
            <FormField label="Adres" hint="Web sitesinde gösterilecek tam adres metni.">
              <textarea
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
                placeholder="Avşa Adası, Yiğitler Köyü, Balıkesir"
              />
            </FormField>
          </div>
        </div>

        {savedMessage && (
          <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
            {savedMessage}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Kaydet
        </button>
      </form>
    </div>
  )
}
