import { useEffect, useState } from 'react'
import type { WebsiteSettingsRow } from '../../types/database'
import { WEBSITE_GALLERY_CATEGORIES } from '../../website/websiteContentDefaults'
import {
  getGalleryPreviewUrl,
} from '../../site/SiteContentContext'
import {
  normalizeMapsEmbedValue,
  resolveHeroImageUrl,
  uploadHeroImage,
} from '../../website/websiteContentService'
import { RichTextEditor } from './RichTextEditor'
import { SiteGalleryManager } from './SiteGalleryManager'
import { useWebsiteContentAdmin } from './useWebsiteContentAdmin'

type WebsiteSettingsTab =
  | 'homepage'
  | 'contact'
  | 'map'
  | 'gallery'
  | 'about'
  | 'seo'
  | 'social'

const NAV_ITEMS: { id: WebsiteSettingsTab; label: string }[] = [
  { id: 'homepage', label: 'Ana Sayfa' },
  { id: 'contact', label: 'İletişim' },
  { id: 'map', label: 'Harita' },
  { id: 'gallery', label: 'Galeri' },
  { id: 'about', label: 'Hakkımızda' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Sosyal Medya' },
]

function SettingsField({
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

function textInputClassName() {
  return 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2'
}

function textareaClassName() {
  return 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2'
}

export function WebsiteSettingsPanel() {
  const {
    settings,
    loading,
    saving,
    error,
    message,
    saveSettings,
    refetch,
    getGalleryByCategory,
  } = useWebsiteContentAdmin()

  const [activeTab, setActiveTab] = useState<WebsiteSettingsTab>('homepage')
  const [form, setForm] = useState<WebsiteSettingsRow | null>(null)
  const [galleryBusy, setGalleryBusy] = useState(false)
  const [galleryMessage, setGalleryMessage] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  function updateField<K extends keyof WebsiteSettingsRow>(key: K, value: WebsiteSettingsRow[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

    if (!form) {
      return
    }

    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...patch } = form

    try {
      await saveSettings({
        ...patch,
        maps_embed: normalizeMapsEmbedValue(form.maps_embed),
      })
    } catch {
      // error handled in hook
    }
  }

  async function handleHeroUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !form) {
      return
    }

    setGalleryBusy(true)
    setGalleryMessage(null)

    try {
      const storagePath = await uploadHeroImage(file)
      updateField('hero_image_path', storagePath)
      setGalleryMessage('Hero görseli yüklendi.')
      refetch()
    } catch (uploadError) {
      setGalleryMessage(uploadError instanceof Error ? uploadError.message : 'Yükleme başarısız.')
    } finally {
      setGalleryBusy(false)
    }
  }

  if (loading || !form) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Web sitesi ayarları yükleniyor...
      </section>
    )
  }

  const promotionalPreview =
    getGalleryPreviewUrl(form.hero_image_path) ?? resolveHeroImageUrl(form)
  const mapsPreview = normalizeMapsEmbedValue(form.maps_embed)

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm ring-1 ring-violet-50 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          Web Sitesi
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Web Sitesi Ayarları</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ana sayfa, iletişim, galeri, harita, hakkımızda, SEO ve sosyal medya içeriklerini buradan
          yönetin. Değişiklikler anında web sitesine yansır.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === item.id
                  ? 'bg-violet-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {(error || message || galleryMessage) && (
        <div className="space-y-3">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-100">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
              {message}
            </p>
          )}
          {galleryMessage && (
            <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 ring-1 ring-sky-100">
              {galleryMessage}
            </p>
          )}
        </div>
      )}

      {activeTab === 'gallery' ? (
        <div className="space-y-6">
          {WEBSITE_GALLERY_CATEGORIES.filter((category) => category.id !== 'homepage').map(
            (category) => (
              <SiteGalleryManager
                key={category.id}
                category={category.id}
                title={category.label}
                description={category.description}
                photos={getGalleryByCategory(category.id)}
                busy={galleryBusy}
                onBusyChange={setGalleryBusy}
                onUpdated={refetch}
                onMessage={setGalleryMessage}
              />
            ),
          )}
        </div>
      ) : (
        <form onSubmit={(event) => void handleSave(event)} className="space-y-6">
          {activeTab === 'homepage' && (
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SettingsField label="Site Başlığı">
                <input
                  type="text"
                  value={form.site_title}
                  onChange={(event) => updateField('site_title', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>

              <SettingsField label="Alt Başlık">
                <input
                  type="text"
                  value={form.site_subtitle}
                  onChange={(event) => updateField('site_subtitle', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>

              <SettingsField label="Karşılama Yazısı">
                <textarea
                  value={form.welcome_text}
                  onChange={(event) => updateField('welcome_text', event.target.value)}
                  rows={3}
                  className={textareaClassName()}
                />
              </SettingsField>

              <SettingsField label="Hakkımızda Kısa Açıklama">
                <textarea
                  value={form.about_short}
                  onChange={(event) => updateField('about_short', event.target.value)}
                  rows={3}
                  className={textareaClassName()}
                />
              </SettingsField>

              <SettingsField
                label="Hero Arka Plan Görseli"
                hint="Yüklenirse ana sayfa hero arka planında kullanılır. Aynı görsel galeride tanıtım afişi olarak da gösterilir."
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {promotionalPreview ? (
                    <img
                      src={promotionalPreview}
                      alt="Tanıtım afişi önizleme"
                      className="h-40 w-full max-w-sm rounded-xl object-contain bg-slate-100 ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                      Henüz afiş yüklenmedi
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
                    Afiş Yükle
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={galleryBusy}
                      onChange={(event) => void handleHeroUpload(event)}
                      className="hidden"
                    />
                  </label>
                </div>
              </SettingsField>

              <SiteGalleryManager
                category="homepage"
                title="Ana Sayfa Galerisi"
                description="Ana sayfada gösterilecek ek galeri görselleri."
                photos={getGalleryByCategory('homepage')}
                busy={galleryBusy}
                onBusyChange={setGalleryBusy}
                onUpdated={refetch}
                onMessage={setGalleryMessage}
              />
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
              <SettingsField label="Telefon">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="WhatsApp" hint="Örnek: 0555 123 45 67">
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(event) => updateField('whatsapp', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="Instagram">
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(event) => updateField('instagram', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="Facebook">
                <input
                  type="text"
                  value={form.facebook}
                  onChange={(event) => updateField('facebook', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="E-posta">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="Adres">
                <textarea
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  rows={3}
                  className={textareaClassName()}
                />
              </SettingsField>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SettingsField
                label="Google Maps Embed"
                hint="Google Maps embed kodunu veya iframe src bağlantısını yapıştırın."
              >
                <textarea
                  value={form.maps_embed}
                  onChange={(event) => updateField('maps_embed', event.target.value)}
                  rows={4}
                  className={textareaClassName()}
                />
              </SettingsField>

              <SettingsField label="Harita Bağlantısı" hint="Haritada Aç butonu için kullanılır.">
                <input
                  type="url"
                  value={form.maps_link}
                  onChange={(event) => updateField('maps_link', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>

              {mapsPreview && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-900">Harita Önizleme</p>
                  <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                    <iframe
                      title="Harita önizleme"
                      src={mapsPreview}
                      className="h-80 w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SettingsField label="Hakkımızda İçeriği">
                <RichTextEditor
                  value={form.about_content}
                  onChange={(value) => updateField('about_content', value)}
                  placeholder="Hakkımızda metnini buraya yazın..."
                />
              </SettingsField>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <SettingsField label="Meta Title">
                <input
                  type="text"
                  value={form.meta_title}
                  onChange={(event) => updateField('meta_title', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="Meta Description">
                <textarea
                  value={form.meta_description}
                  onChange={(event) => updateField('meta_description', event.target.value)}
                  rows={4}
                  className={textareaClassName()}
                />
              </SettingsField>
              <SettingsField label="Keywords">
                <textarea
                  value={form.meta_keywords}
                  onChange={(event) => updateField('meta_keywords', event.target.value)}
                  rows={3}
                  className={textareaClassName()}
                />
              </SettingsField>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
              <SettingsField label="Instagram URL">
                <input
                  type="url"
                  value={form.instagram_url}
                  onChange={(event) => updateField('instagram_url', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="Facebook URL">
                <input
                  type="url"
                  value={form.facebook_url}
                  onChange={(event) => updateField('facebook_url', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="TikTok URL">
                <input
                  type="url"
                  value={form.tiktok_url}
                  onChange={(event) => updateField('tiktok_url', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
              <SettingsField label="YouTube URL">
                <input
                  type="url"
                  value={form.youtube_url}
                  onChange={(event) => updateField('youtube_url', event.target.value)}
                  className={textInputClassName()}
                />
              </SettingsField>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}
    </section>
  )
}
