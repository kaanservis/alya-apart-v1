import type { AccommodationUnit, Reservation } from '../types/database'
import { DAY_WIDTH, ROW_HEIGHT, UNIT_LABEL_WIDTH } from './constants'
import {
  CALENDAR_CELL_DROP_INVALID_STYLE,
  CALENDAR_CELL_DROP_TARGET_STYLE,
  CALENDAR_CELL_STYLES,
} from './colors'
import { toDateKey } from './dateUtils'
import type { CalendarDropTarget } from './calendarPlanningUtils'
import { buildUnitRowData, getCellState, isDateReserved } from './reservationLogic'
import { ReservationBar } from './ReservationBar'
import type { CalendarZoomLevel } from './types'

interface CalendarUnitRowProps {
  unit: AccommodationUnit
  visibleDates: Date[]
  reservations: Reservation[]
  zoom: CalendarZoomLevel
  isEven?: boolean
  planningEnabled?: boolean
  pendingReservationIds?: Set<string>
  draggingReservationId?: string | null
  draggingOriginUnitId?: string | null
  dropTarget?: CalendarDropTarget | null
  invalidDropTargetUnitId?: string | null
  onEmptyCellClick: (unit: AccommodationUnit, date: Date) => void
  onReservationClick: (reservation: Reservation, unit: AccommodationUnit) => void
  onDragStart?: (reservation: Reservation, pointerId: number) => void
  onRowDragEnter?: (unitId: string) => void
}

export function CalendarUnitRow({
  unit,
  visibleDates,
  reservations,
  zoom,
  isEven = false,
  planningEnabled = false,
  pendingReservationIds,
  draggingReservationId,
  draggingOriginUnitId,
  dropTarget,
  invalidDropTargetUnitId,
  onEmptyCellClick,
  onReservationClick,
  onDragStart,
  onRowDragEnter,
}: CalendarUnitRowProps) {
  const dayWidth = DAY_WIDTH[zoom]
  const rowHeight = ROW_HEIGHT[zoom]
  const rowData = buildUnitRowData(unit, reservations, visibleDates)
  const reservedIndexes = new Set<number>()

  rowData.segments.forEach((segment) => {
    for (let index = segment.startIndex; index < segment.startIndex + segment.span; index += 1) {
      reservedIndexes.add(index)
    }
  })

  const isDropTargetRow =
    Boolean(draggingReservationId) &&
    dropTarget?.unitId === unit.id &&
    draggingOriginUnitId !== unit.id
  const isInvalidDropTargetRow = invalidDropTargetUnitId === unit.id

  return (
    <div
      data-calendar-row="true"
      data-unit-id={unit.id}
      className={`relative grid border-b border-blue-100/80 ${isEven ? 'bg-white' : 'bg-slate-50/50'} ${
        isInvalidDropTargetRow ? 'bg-red-50/70' : isDropTargetRow ? 'bg-emerald-50/70' : ''
      }`}
      style={{
        gridTemplateColumns: `${UNIT_LABEL_WIDTH}px repeat(${visibleDates.length}, ${dayWidth}px)`,
        minHeight: rowHeight,
      }}
      onPointerEnter={() => {
        if (planningEnabled && draggingReservationId) {
          onRowDragEnter?.(unit.id)
        }
      }}
    >
      <div className="sticky left-0 z-20 flex items-center border-r border-blue-100 bg-blue-50/90 px-4 text-sm font-bold text-blue-900 backdrop-blur-sm">
        {unit.name}
      </div>

      {visibleDates.map((date, index) => {
        const reservation = isDateReserved(unit.id, date, reservations)
        const cellState = getCellState(unit, date, reservations)
        const isReserved = reservedIndexes.has(index)
        const isDropTargetCell = isDropTargetRow

        let cellClass = isReserved
          ? 'cursor-default bg-transparent'
          : CALENDAR_CELL_STYLES[cellState]

        if (isInvalidDropTargetRow) {
          cellClass = `${CALENDAR_CELL_DROP_INVALID_STYLE} cursor-not-allowed`
        } else if (isDropTargetCell) {
          cellClass = `${CALENDAR_CELL_DROP_TARGET_STYLE} cursor-copy`
        } else if (planningEnabled && draggingReservationId && !isReserved) {
          cellClass = `${CALENDAR_CELL_STYLES.available} ring-1 ring-inset ring-emerald-200`
        }

        return (
          <button
            key={`${unit.id}-${toDateKey(date)}`}
            type="button"
            data-calendar-cell="true"
            data-unit-id={unit.id}
            data-date-index={index}
            aria-label={`${unit.name} - ${toDateKey(date)}`}
            className={`relative border-r border-blue-50 transition-colors ${cellClass}`}
            style={{ minHeight: rowHeight }}
            onClick={() => {
              if (!reservation) {
                onEmptyCellClick(unit, date)
              }
            }}
            onPointerEnter={() => {
              if (planningEnabled && draggingReservationId) {
                onRowDragEnter?.(unit.id)
              }
            }}
            onDragOver={(event) => {
              if (planningEnabled && draggingReservationId) {
                event.preventDefault()
                onRowDragEnter?.(unit.id)
              }
            }}
          />
        )
      })}

      <div
        className="pointer-events-none absolute inset-y-0"
        style={{ left: UNIT_LABEL_WIDTH, right: 0 }}
      >
        <div className="pointer-events-none relative h-full">
          {rowData.segments.map((segment) => (
            <ReservationBar
              key={segment.reservation.id}
              segment={segment}
              unitName={unit.name}
              dayWidth={dayWidth}
              rowHeight={rowHeight}
              zoom={zoom}
              planningEnabled={planningEnabled}
              isPending={pendingReservationIds?.has(segment.reservation.id)}
              isDragging={draggingReservationId === segment.reservation.id}
              onSelect={(reservation) => onReservationClick(reservation, unit)}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
