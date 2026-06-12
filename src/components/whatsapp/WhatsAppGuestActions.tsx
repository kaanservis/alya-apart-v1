import {
  buildWhatsAppMessage,
  getGuestWhatsAppUrl,
  WHATSAPP_QUICK_MESSAGES,
} from '../../lib/whatsapp'
import { WhatsAppIcon } from './WhatsAppIcon'

interface WhatsAppGuestActionsProps {
  phone: string
  adSoyad: string
  kalanBakiye?: number
  compact?: boolean
  className?: string
}

export function WhatsAppGuestActions({
  phone,
  adSoyad,
  kalanBakiye,
  compact = false,
  className = '',
}: WhatsAppGuestActionsProps) {
  const normalizedPhone = phone.replace(/\D/g, '')

  if (!normalizedPhone) {
    return (
      <p className={`text-sm text-slate-500 ${className}`}>WhatsApp için telefon numarası yok.</p>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <a
        href={getGuestWhatsAppUrl(phone)}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1ebe57] sm:w-auto"
      >
        <WhatsAppIcon className="h-5 w-5" />
        WhatsApp Gönder
      </a>

      {!compact && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hızlı Mesajlar
          </p>
          <div className="flex flex-wrap gap-2">
            {WHATSAPP_QUICK_MESSAGES.map((item) => (
              <a
                key={item.template}
                href={getGuestWhatsAppUrl(
                  phone,
                  buildWhatsAppMessage(item.template, { adSoyad, kalanBakiye }),
                )}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-[#25D366]/20 sm:text-sm"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
