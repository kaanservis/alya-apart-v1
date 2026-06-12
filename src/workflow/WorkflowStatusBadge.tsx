import type { UnitStatus } from '../types/database'
import { normalizeUnitStatus } from './unitStatusLogic'

const statusStyles: Record<UnitStatus, string> = {
  Boş: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
  Dolu: 'bg-rose-100 text-rose-800 ring-rose-200/80',
  'Çıkış Bekliyor': 'bg-orange-100 text-orange-800 ring-orange-200/80',
  'Temizlik Bekliyor': 'bg-violet-100 text-violet-800 ring-violet-200/80',
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
