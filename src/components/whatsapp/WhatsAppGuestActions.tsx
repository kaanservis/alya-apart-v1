import { useState } from 'react'
import { useCanViewPrices } from '../../auth/useFormatAdminCurrency'
import {
  adminWhatsAppChip,
  adminWhatsAppChipRow,
} from '../admin/adminMobileStyles'
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
  iconOnly?: boolean
  className?: string
}

export function WhatsAppGuestActions({
  phone,
  adSoyad,
  kalanBakiye,
  compact = false,
  iconOnly = false,
  className = '',
}: WhatsAppGuestActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const canViewPrices = useCanViewPrices()
  const normalizedPhone = phone.replace(/\D/g, '')
  const messageContext = { adSoyad, kalanBakiye, canViewPrices }

  if (!normalizedPhone) {
    if (iconOnly) {
      return null
    }

    return (
      <p className={`text-sm text-slate-500 max-md:text-[13px] ${className}`}>
        WhatsApp için telefon numarası yok.
      </p>
    )
  }

  if (iconOnly) {
    return (
      <div className={`relative inline-flex items-center gap-0.5 ${className}`}>
        <a
          href={getGuestWhatsAppUrl(phone)}
          target="_blank"
          rel="noreferrer"
          title={`${adSoyad} — WhatsApp`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe57]"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
        <button
          type="button"
          title="Hızlı mesajlar"
          onClick={(event) => {
            event.stopPropagation()
            setMenuOpen((current) => !current)
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#25D366]/30 bg-white text-[10px] font-bold text-emerald-800 hover:bg-[#25D366]/10"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="fixed inset-0 z-40"
              onClick={(event) => {
                event.stopPropagation()
                setMenuOpen(false)
              }}
            />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {WHATSAPP_QUICK_MESSAGES.map((item) => (
                <a
                  key={item.template}
                  href={getGuestWhatsAppUrl(
                    phone,
                    buildWhatsAppMessage(item.template, messageContext),
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    event.stopPropagation()
                    setMenuOpen(false)
                  }}
                  className="block px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 max-md:space-y-2 ${className}`}>
      <a
        href={getGuestWhatsAppUrl(phone)}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1ebe57] max-md:min-h-[42px] max-md:py-2.5 max-md:text-[13px] sm:w-auto"
      >
        <WhatsAppIcon className="h-5 w-5 max-md:h-4 max-md:w-4" />
        WhatsApp Gönder
      </a>

      {!compact && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 max-md:mb-1.5 max-md:text-[10px]">
            Hızlı Mesajlar
          </p>
          <div className={`${adminWhatsAppChipRow} admin-whatsapp-chips`}>
            {WHATSAPP_QUICK_MESSAGES.map((item) => (
              <a
                key={item.template}
                href={getGuestWhatsAppUrl(
                  phone,
                  buildWhatsAppMessage(item.template, messageContext),
                )}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className={adminWhatsAppChip}
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366] max-md:h-3.5 max-md:w-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
