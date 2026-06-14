import type { UnitStatus } from '../types/database'
import { normalizeUnitStatus } from './unitStatusLogic'

const statusStyles: Record<UnitStatus, string> = {
  Boş: 'bg-[#DBEAFE] text-[#1D4ED8] ring-[#BFDBFE]',
  Dolu: 'bg-[#EDE9FE] text-[#6D28D9] ring-[#DDD6FE]',
  'Çıkış Bekliyor': 'bg-[#FFEDD5] text-[#C2410C] ring-[#FED7AA]',
  'Temizlik Bekliyor': 'bg-[#FEF9C3] text-[#A16207] ring-[#FDE68A]',
}

const statusLabels: Record<UnitStatus, string> = {
  Boş: 'Müsait',
  Dolu: 'Dolu',
  'Çıkış Bekliyor': 'Çıkış Bekliyor',
  'Temizlik Bekliyor': 'Temizlik Bekliyor',
}

interface WorkflowStatusBadgeProps {
  status: UnitStatus | string
}

export function WorkflowStatusBadge({ status }: WorkflowStatusBadgeProps) {
  const normalizedStatus = normalizeUnitStatus(status)

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${statusStyles[normalizedStatus]}`}
    >
      {statusLabels[normalizedStatus]}
    </span>
  )
}
