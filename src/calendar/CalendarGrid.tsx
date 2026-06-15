import { useCallback, useEffect, useRef } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { DAY_WIDTH, UNIT_LABEL_WIDTH } from './constants'
import { formatHeaderDate, toDateKey } from './dateUtils'
import { CalendarUnitRow } from './CalendarUnitRow'
import type { CalendarDropTarget } from './calendarPlanningUtils'
import type { CalendarZoomLevel } from './types'

interface CalendarGridProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  visibleDates: Date[]
  zoom: CalendarZoomLevel
  planningEnabled?: boolean
  pendingReservationIds?: Set<string>
  draggingReservationId?: string | null
  draggingOriginUnitId?: string | null
  dropTarget?: CalendarDropTarget | null
  invalidDropTargetUnitId?: string | null
  onEmptyCellClick: (unit: AccommodationUnit, date: Date) => void
  onReservationClick: (reservation: Reservation, unit: AccommodationUnit) => void
  onDragStart?: (reservation: Reservation, unitId: string, pointerId: number) => void
  onDropTargetChange?: (target: CalendarDropTarget | null) => void
  onDragEnd?: (
    reservation: Reservation,
    unitId: string,
    dropTarget: CalendarDropTarget | null,
  ) => void
}

export function CalendarGrid({
  units,
  reservations,
  visibleDates,
  zoom,
  planningEnabled = false,
  pendingReservationIds,
  draggingReservationId,
  draggingOriginUnitId,
  dropTarget,
  invalidDropTargetUnitId,
  onEmptyCellClick,
  onReservationClick,
  onDragStart,
  onDropTargetChange,
  onDragEnd,
}: CalendarGridProps) {
  const dayWidth = DAY_WIDTH[zoom]
  const gridWidth = UNIT_LABEL_WIDTH + visibleDates.length * dayWidth
  const isCompactView = zoom === 'month' || zoom === 'week' || zoom === 'day'

  const dragContextRef = useRef<{
    reservation: Reservation
    unitId: string
  } | null>(null)

  const onDropTargetChangeRef = useRef(onDropTargetChange)
  const onDragEndRef = useRef(onDragEnd)
  const dropTargetRef = useRef(dropTarget)

  useEffect(() => {
    onDropTargetChangeRef.current = onDropTargetChange
    onDragEndRef.current = onDragEnd
  }, [onDropTargetChange, onDragEnd])

  useEffect(() => {
    dropTargetRef.current = dropTarget
  }, [dropTarget])

  const resolveDropTarget = useCallback((clientX: number, clientY: number): CalendarDropTarget | null => {
    const element = document.elementFromPoint(clientX, clientY)
    const row = element?.closest('[data-calendar-row]') as HTMLElement | null

    if (row?.dataset.unitId) {
      return { unitId: row.dataset.unitId }
    }

    const cell = element?.closest('[data-calendar-cell]') as HTMLElement | null
    if (cell?.dataset.unitId) {
      return { unitId: cell.dataset.unitId }
    }

    return null
  }, [])

  useEffect(() => {
    if (!planningEnabled || !draggingReservationId) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      event.preventDefault()
      const target = resolveDropTarget(event.clientX, event.clientY)
      onDropTargetChangeRef.current?.(target)
    }

    function finishDrag(event: PointerEvent) {
      if (!dragContextRef.current) {
        return
      }

      const target =
        resolveDropTarget(event.clientX, event.clientY) ??
        dropTargetRef.current ??
        null

      onDragEndRef.current?.(
        dragContextRef.current.reservation,
        dragContextRef.current.unitId,
        target,
      )
      dragContextRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [draggingReservationId, planningEnabled, resolveDropTarget])

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
              planningEnabled={planningEnabled}
              pendingReservationIds={pendingReservationIds}
              draggingReservationId={draggingReservationId}
              draggingOriginUnitId={draggingOriginUnitId}
              dropTarget={dropTarget}
              invalidDropTargetUnitId={invalidDropTargetUnitId}
              onEmptyCellClick={onEmptyCellClick}
              onReservationClick={onReservationClick}
              onDragStart={(reservation, pointerId) => {
                dragContextRef.current = {
                  reservation,
                  unitId: unit.id,
                }
                onDragStart?.(reservation, unit.id, pointerId)
              }}
              onRowDragEnter={(unitId) => onDropTargetChange?.({ unitId })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
