import type { GuestRegistrationStatus } from './guestRegistrationStatus'

interface GuestRegistrationBadgeProps {
  status: GuestRegistrationStatus
  className?: string
}

export function GuestRegistrationBadge({ status, className = '' }: GuestRegistrationBadgeProps) {
  if (status === 'future') {
    return null
  }

  if (status === 'complete') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 max-md:text-[9px] sm:text-[11px] ${className}`}
      >
        ✓ Kimlikler Alındı
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 max-md:text-[9px] sm:text-[11px] ${className}`}
    >
      ⏳ Kayıt Bekliyor
    </span>
  )
}
