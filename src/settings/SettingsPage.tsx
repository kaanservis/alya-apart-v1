import { useEffect, useState } from 'react'
import {
  getBusinessSettings,
  getBusinessWhatsAppNumberRaw,
  saveBusinessSettings,
} from './businessSettings'
import { getBusinessWhatsAppNumber, normalizePhoneForWhatsApp } from '../lib/whatsapp'
import { WebsiteSettingsPanel } from './website/WebsiteSettingsPanel'

export function SettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState(() => getBusinessWhatsAppNumberRaw())
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    setWhatsappNumber(getBusinessSettings().businessWhatsAppNumber)
  }, [])

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    saveBusinessSettings({ businessWhatsAppNumber: whatsappNumber })
    setSavedMessage('Ayarlar kaydedildi.')
    window.setTimeout(() => setSavedMessage(null), 2500)
  }

  const previewNumber = normalizePhoneForWhatsApp(whatsappNumber || '905320000000')

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Sistem</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Ayarlar</h2>
        <p className="mt-2 text-sm text-slate-600">
          WhatsApp entegrasyonu ve iletişim ayarlarını buradan yönetin.
        </p>
      </section>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <label className="block text-sm">
          <span className="font-semibold text-slate-900">İşletme WhatsApp Numarası</span>
          <p className="mt-1 text-sm text-slate-500">
            Tüm WhatsApp butonları ve web sitesi bu numarayı kullanır. Örnek: 0555 123 45 67
          </p>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
            placeholder="0555 123 45 67"
            className="mt-3 w-full max-w-md rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-600 focus:ring-2"
          />
        </label>

        <p className="mt-3 text-sm text-slate-600">
          Kaydedilecek format:{' '}
          <span className="font-semibold text-slate-900">{previewNumber}</span>
        </p>

        {savedMessage && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100">
            {savedMessage}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Kaydet
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Kullanım</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Web sitesindeki yüzen WhatsApp butonu bu numarayı kullanır.</li>
          <li>Misafir mesajları misafir telefon numarasına doğrudan gönderilir.</li>
          <li>Numara kaydedilirken boşluk, tire ve parantezler otomatik temizlenir.</li>
        </ul>
        <p className="mt-3">
          Önizleme bağlantısı:{' '}
          <a
            href={`https://wa.me/${getBusinessWhatsAppNumber()}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-blue-700 hover:underline"
          >
            wa.me/{getBusinessWhatsAppNumber()}
          </a>
        </p>
      </section>

      <WebsiteSettingsPanel />
    </div>
  )
}
