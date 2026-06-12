import { CALENDAR_CELL_STYLES, CALENDAR_LEGEND } from './colors'

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-slate-700">Renkler:</span>
      {CALENDAR_LEGEND.map((item) => (
        <div key={item.state} className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-sm border ${CALENDAR_CELL_STYLES[item.state]}`}
          />
          <span className="text-sm text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
