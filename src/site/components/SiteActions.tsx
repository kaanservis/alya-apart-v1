import { WhatsAppIcon } from '../../components/whatsapp/WhatsAppIcon'
import { useSiteContent } from '../SiteContentContext'

export function FloatingActionButtons() {
  const { phoneHref, getWhatsAppHref } = useSiteContent()
  const whatsappHref = getWhatsAppHref()

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      <a
        href={phoneHref}
        aria-label="Telefon ile ara"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-xl shadow-blue-900/25 transition-transform hover:scale-105 active:scale-95"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp ile iletişime geç"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-900/30 transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      </a>
    </div>
  )
}

export function WhatsAppButton({
  className = '',
  label = "WhatsApp'tan Bilgi Al",
}: {
  className?: string
  label?: string
}) {
  const { getWhatsAppHref } = useSiteContent()

  return (
    <a
      href={getWhatsAppHref()}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#1ebe57] ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {label}
    </a>
  )
}

export function RoomWhatsAppButton({
  roomName,
  className = '',
}: {
  roomName: string
  className?: string
}) {
  const { getWhatsAppHref } = useSiteContent()

  return (
    <a
      href={getWhatsAppHref(`Merhaba, ${roomName} odası hakkında bilgi almak istiyorum.`)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#1ebe57] ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5" />
      WhatsApp ile Sor
    </a>
  )
}

export function InstagramIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 2A3.75 3.75 0 004 7.75v8.5A3.75 3.75 0 007.75 20h8.5A3.75 3.75 0 0020 16.25v-8.5A3.75 3.75 0 0016.25 4h-8.5zm8.75 1.5a1 1 0 110 2 1 1 0 010-2zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  )
}

export function CallButton({
  className = '',
  label = 'Hemen Ara',
  large = false,
}: {
  className?: string
  label?: string
  large?: boolean
}) {
  const { phoneHref } = useSiteContent()

  return (
    <a
      href={phoneHref}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-white font-bold text-blue-900 shadow-lg ring-1 ring-white/80 transition hover:bg-blue-50 ${
        large ? 'px-8 py-4 text-base' : 'px-6 py-3.5 text-sm'
      } ${className}`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
      {label}
    </a>
  )
}

export function LocationButton({
  className = '',
  label = 'Konuma Git',
  onClick,
}: {
  className?: string
  label?: string
  onClick?: () => void
}) {
  const { settings } = useSiteContent()

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20 ${className}`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {label}
      </button>
    )
  }

  return (
    <a
      href={settings.maps_link}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-sky-500/90 px-6 py-3.5 text-sm font-bold text-white shadow-lg backdrop-blur transition hover:bg-sky-600 ${className}`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      {label}
    </a>
  )
}

export function InstagramButton({ className = '', label = 'Takip Et' }: { className?: string; label?: string }) {
  const { settings } = useSiteContent()

  if (!settings.instagram_url) {
    return null
  }

  return (
    <a
      href={settings.instagram_url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-8 py-4 text-base font-bold text-white shadow-lg transition hover:opacity-90 ${className}`}
    >
      <InstagramIcon className="h-6 w-6" />
      {label}
    </a>
  )
}

