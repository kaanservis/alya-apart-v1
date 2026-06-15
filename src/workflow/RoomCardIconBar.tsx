import { WhatsAppIcon } from '../components/whatsapp/WhatsAppIcon'

interface RoomCardIconBarProps {
  whatsAppUrl?: string | null
  onOdaKabul?: () => void
  showOdaKabul?: boolean
  onPdf?: () => void
  onPayment?: () => void
  onKimlikler?: () => void
  className?: string
}

function IconButton({
  title,
  onClick,
  href,
  children,
  accentClass = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
}: {
  title: string
  onClick?: (event: React.MouseEvent) => void
  href?: string
  children: React.ReactNode
  accentClass?: string
}) {
  const className = `inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition max-md:h-7 max-md:w-7 ${accentClass}`

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={title}
        onClick={onClick}
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" title={title} onClick={onClick} className={className}>
      {children}
    </button>
  )
}

export function RoomCardIconBar({
  whatsAppUrl,
  onOdaKabul,
  showOdaKabul = false,
  onPdf,
  onPayment,
  onKimlikler,
  className = '',
}: RoomCardIconBarProps) {
  return (
    <div
      className={`flex shrink-0 flex-wrap items-center justify-end gap-1 ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      {whatsAppUrl && (
        <IconButton
          title="WhatsApp"
          href={whatsAppUrl}
          accentClass="border-[#25D366]/40 bg-[#25D366] text-white hover:bg-[#1ebe57]"
          onClick={(event) => event.stopPropagation()}
        >
          <WhatsAppIcon className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
        </IconButton>
      )}

      {showOdaKabul && onOdaKabul && (
        <IconButton
          title="Oda Kabul"
          onClick={(event) => {
            event.stopPropagation()
            onOdaKabul()
          }}
          accentClass="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <span className="text-sm max-md:text-xs">📝</span>
        </IconButton>
      )}

      {onKimlikler && (
        <IconButton title="Kimlikler" onClick={onKimlikler} accentClass="border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100">
          <span className="text-sm max-md:text-xs">📷</span>
        </IconButton>
      )}

      {onPdf && (
        <IconButton title="PDF" onClick={onPdf} accentClass="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
          <span className="text-sm max-md:text-xs">📄</span>
        </IconButton>
      )}

      {onPayment && (
        <IconButton title="Ödeme" onClick={onPayment} accentClass="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
          <span className="text-sm max-md:text-xs">💰</span>
        </IconButton>
      )}
    </div>
  )
}
