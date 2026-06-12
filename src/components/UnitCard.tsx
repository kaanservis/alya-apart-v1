import type { AccommodationUnit } from '../types/database'
import { StatusBadge } from './StatusBadge'

interface UnitCardProps {
  unit: AccommodationUnit
}

export function UnitCard({ unit }: UnitCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Oda
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{unit.name}</h3>
        </div>
        <StatusBadge status={unit.status} />
      </div>
    </article>
  )
}
