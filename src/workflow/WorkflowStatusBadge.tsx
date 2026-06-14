import type { UnitStatus } from '../types/database'
import { normalizeUnitStatus } from './unitStatusLogic'
import { UNIT_STATUS_BADGE_CLASS } from './unitStatusColors'

const statusDisplay: Record<UnitStatus, { icon: string; label: string }> = {
  Boş: { icon: '🔵', label: 'MÜSAİT' },
  Dolu: { icon: '🟣', label: 'DOLU' },
  'Çıkış Bekliyor': { icon: '🟠', label: 'ÇIKIŞ' },
  'Temizlik Bekliyor': { icon: '🟡', label: 'TEMİZLİK' },
}

interface WorkflowStatusBadgeProps {
  status: UnitStatus | string
}

export function WorkflowStatusBadge({ status }: WorkflowStatusBadgeProps) {
  const normalizedStatus = normalizeUnitStatus(status)
  const display = statusDisplay[normalizedStatus]

  return (
    <span className={`room-status-badge ${UNIT_STATUS_BADGE_CLASS[normalizedStatus]}`}>
      <span className="room-status-badge-icon" aria-hidden="true">
        {display.icon}
      </span>
      {display.label}
    </span>
  )
}
