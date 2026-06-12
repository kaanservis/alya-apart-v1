import type { UnitStatus } from '../types/database'

const statusStyles: Record<UnitStatus, string> = {
  Boş: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Dolu: 'bg-blue-100 text-blue-800 ring-blue-200',
  'Çıkış Bekliyor': 'bg-orange-100 text-orange-800 ring-orange-200',
  'Temizlik Bekliyor': 'bg-orange-100 text-orange-800 ring-orange-200',
}

interface StatusBadgeProps {
  status: UnitStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}
