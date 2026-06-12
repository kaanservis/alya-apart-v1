import type { AccommodationUnit, Reservation } from '../types/database'
import { DAY_WIDTH, UNIT_LABEL_WIDTH } from './constants'
import { formatHeaderDate, toDateKey } from './dateUtils'
import { CalendarUnitRow } from './CalendarUnitRow'
import type { CalendarZoomLevel } from './types'

interface CalendarGridProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  visibleDates: Date[]
  zoom: CalendarZoomLevel
  onEmptyCellClick: (unit: AccommodationUnit, date: Date) => void
  onReservationClick: (reservation: Reservation, unit: AccommodationUnit) => void
}

export function CalendarGrid({
  units,
  reservations,
  visibleDates,
  zoom,
  onEmptyCellClick,
  onReservationClick,
}: CalendarGridProps) {
  const dayWidth = DAY_WIDTH[zoom]
  const gridWidth = UNIT_LABEL_WIDTH + visibleDates.length * dayWidth
  const isCompactView = zoom === 'month' || zoom === 'week' || zoom === 'day'

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white ring-1 ${
        isCompactView
          ? 'border-slate-200 shadow-sm ring-slate-100'
          : 'border-blue-200/80 shadow-xl shadow-blue-900/5 ring-blue-100'
      }`}
    >
      <div className="overflow-auto">
        <div style={{ minWidth: gridWidth }}>
          <div
            className={`sticky top-0 z-30 grid border-b ${
              isCompactView
                ? 'border-slate-200 bg-slate-50'
                : 'border-blue-800/20 bg-gradient-to-r from-blue-900 to-blue-800'
            }`}
            style={{
              gridTemplateColumns: `${UNIT_LABEL_WIDTH}px repeat(${visibleDates.length}, ${dayWidth}px)`,
            }}
          >
            <div
              className={`sticky left-0 z-40 flex items-center border-r px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                isCompactView
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : 'border-white/10 bg-blue-900 text-blue-100'
              }`}
            >
              Oda
            </div>
            {visibleDates.map((date) => (
              <div
                key={toDateKey(date)}
                className={`border-r px-1 py-3 text-center font-semibold ${
                  isCompactView
                    ? 'border-slate-200 text-[11px] text-slate-600'
                    : 'border-white/10 text-[10px] text-blue-50'
                }`}
                title={formatHeaderDate(date, zoom)}
              >
                {formatHeaderDate(date, zoom)}
              </div>
            ))}
          </div>

          {units.map((unit, index) => (
            <CalendarUnitRow
              key={unit.id}
              unit={unit}
              visibleDates={visibleDates}
              reservations={reservations}
              zoom={zoom}
              isEven={index % 2 === 0}
              onEmptyCellClick={onEmptyCellClick}
              onReservationClick={onReservationClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
