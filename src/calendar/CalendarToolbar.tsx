import { CALENDAR_ZOOM_LEVELS } from './constants'
import { formatPeriodLabel } from './dateUtils'
import type { CalendarViewState } from './types'

interface CalendarToolbarProps {
  viewState: CalendarViewState
  onZoomChange: (zoom: CalendarViewState['zoom']) => void
  onNavigate: (direction: -1 | 1) => void
  onToday: () => void
  onSeasonYearChange: (year: number) => void
}

export function CalendarToolbar({
  viewState,
  onZoomChange,
  onNavigate,
  onToday,
  onSeasonYearChange,
}: CalendarToolbarProps) {
  const periodLabel = formatPeriodLabel(
    viewState.zoom,
    viewState.anchorDate,
    viewState.seasonYear,
  )

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Takvim</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {periodLabel}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {CALENDAR_ZOOM_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onZoomChange(level.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                viewState.zoom === level.value
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {viewState.zoom === 'season' && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            Sezon Yılı
            <select
              value={viewState.seasonYear}
              onChange={(event) => onSeasonYearChange(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {[viewState.seasonYear - 1, viewState.seasonYear, viewState.seasonYear + 1].map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        {viewState.zoom !== 'season' && (
          <>
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={onToday}
              className="rounded-xl bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-700/20 transition-colors hover:bg-blue-800"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => onNavigate(1)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Sonraki
            </button>
          </>
        )}
      </div>
    </div>
  )
}
