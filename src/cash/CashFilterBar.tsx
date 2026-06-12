import { CASH_FILTER_OPTIONS, type CashFilter } from './types'
import { getFilterLabel } from './cashFilters'

interface CashFilterBarProps {
  filter: CashFilter
  onFilterChange: (filter: CashFilter) => void
}

export function CashFilterBar({ filter, onFilterChange }: CashFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Filtre</p>
        <p className="text-sm text-slate-700">{getFilterLabel(filter)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CASH_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
