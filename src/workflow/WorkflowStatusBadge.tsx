import type { RoomDisplayStatus } from '../types/database'
import { ROOM_DISPLAY_BADGE_CLASS } from './roomDisplayColors'

const statusDisplay: Record<RoomDisplayStatus, { icon: string; label: string }> = {
  Boş: { icon: '🟢', label: 'BOŞ' },
  'Bugün Giriş': { icon: '🔴', label: 'BUGÜN GİRİŞ' },
  Dolu: { icon: '🔵', label: 'DOLU' },
  'Çıkış Bugün': { icon: '🟠', label: 'ÇIKIŞ BUGÜN' },
  'Temizlik Bekliyor': { icon: '🟡', label: 'TEMİZLİK' },
}

interface WorkflowStatusBadgeProps {
  status: RoomDisplayStatus
  prominent?: boolean
}

export function WorkflowStatusBadge({ status, prominent = false }: WorkflowStatusBadgeProps) {
  const display = statusDisplay[status]
  const isTodayCheckIn = status === 'Bugün Giriş'

  return (
    <span
      className={`room-status-badge ${ROOM_DISPLAY_BADGE_CLASS[status]} ${
        prominent || isTodayCheckIn ? 'text-[0.7rem] sm:text-xs' : ''
      } ${isTodayCheckIn ? 'px-2 py-1 font-black sm:px-3 sm:py-1.5 sm:text-sm' : ''}`}
    >
      <span className="room-status-badge-icon" aria-hidden="true">
        {display.icon}
      </span>
      {display.label}
    </span>
  )
}

export function CheckInCompleteBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-400 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 sm:text-[10px]">
      ✓ CHECK-IN
    </span>
  )
}
