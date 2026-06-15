import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import {
  applyPendingChanges,
  buildPendingChange,
  findPlanningConflicts,
  findRoomMoveConflict,
  formatRoomMoveConflictMessage,
  isPendingChangeDirty,
  isReservationRoomDraggable,
  type CalendarDragMode,
  type CalendarDragState,
  type CalendarDropTarget,
  type CalendarPendingChange,
  type CalendarPlanningConflict,
} from './calendarPlanningUtils'

const CALENDAR_PLANNING_DEBUG = import.meta.env.DEV

interface UndoEntry {
  reservationId: string
  previousChange: CalendarPendingChange | null
}

interface ApplyDropParams {
  reservation: Reservation
  dropTarget: CalendarDropTarget
}

function logPlanning(message: string, detail?: unknown) {
  if (!CALENDAR_PLANNING_DEBUG) {
    return
  }

  if (detail !== undefined) {
    console.log(message, detail)
  } else {
    console.log(message)
  }
}

export function useCalendarPlanning(
  baseReservations: Reservation[],
  units: AccommodationUnit[],
) {
  const [pendingMap, setPendingMap] = useState<Map<string, CalendarPendingChange>>(new Map())
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [dragState, setDragState] = useState<CalendarDragState | null>(null)
  const [dropTarget, setDropTargetState] = useState<CalendarDropTarget | null>(null)
  const [dropError, setDropError] = useState<string | null>(null)

  const dragStateRef = useRef<CalendarDragState | null>(null)
  const dropTargetRef = useRef<CalendarDropTarget | null>(null)
  const baseReservationsRef = useRef(baseReservations)

  useEffect(() => {
    baseReservationsRef.current = baseReservations
  }, [baseReservations])

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  const setDropTarget = useCallback((target: CalendarDropTarget | null) => {
    dropTargetRef.current = target
    setDropTargetState(target)
    if (target) {
      logPlanning('drag over', target)
    }
  }, [])

  const pendingChanges = useMemo(() => Array.from(pendingMap.values()), [pendingMap])
  const dirtyChanges = useMemo(
    () => pendingChanges.filter(isPendingChangeDirty),
    [pendingChanges],
  )
  const pendingCount = dirtyChanges.length

  const displayReservations = useMemo(
    () => applyPendingChanges(baseReservations, pendingMap),
    [baseReservations, pendingMap],
  )

  const displayReservationsRef = useRef(displayReservations)
  useEffect(() => {
    displayReservationsRef.current = displayReservations
  }, [displayReservations])

  const pendingReservationIds = useMemo(
    () => new Set(dirtyChanges.map((change) => change.reservationId)),
    [dirtyChanges],
  )

  const conflicts = useMemo(
    () => findPlanningConflicts(baseReservations, pendingMap, units),
    [baseReservations, pendingMap, units],
  )

  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units])

  const invalidDropTargetUnitId = useMemo(() => {
    if (!dragState || !dropTarget) {
      return null
    }

    const reservation = displayReservations.find((item) => item.id === dragState.reservationId)
    if (!reservation || dropTarget.unitId === reservation.konaklama_birimi_id) {
      return null
    }

    const conflict = findRoomMoveConflict(
      displayReservations,
      dropTarget.unitId,
      reservation.giris_tarihi,
      reservation.cikis_tarihi,
      reservation.id,
    )

    return conflict ? dropTarget.unitId : null
  }, [displayReservations, dragState, dropTarget])

  const commitChange = useCallback(
    (
      baseReservation: Reservation,
      draft: { unitId: string; girisTarihi: string; cikisTarihi: string },
    ) => {
      setPendingMap((current) => {
        const existing = current.get(baseReservation.id) ?? null
        setUndoStack((stack) => [
          ...stack,
          { reservationId: baseReservation.id, previousChange: existing },
        ])

        const built = buildPendingChange(baseReservation, existing ?? undefined, draft)
        const next = new Map(current)

        if (!isPendingChangeDirty(built)) {
          next.delete(baseReservation.id)
          return next
        }

        logPlanning('pending change added', built)
        next.set(baseReservation.id, built)
        return next
      })
    },
    [],
  )

  const startDrag = useCallback(
    (
      reservation: Reservation,
      unitId: string,
      mode: CalendarDragMode,
      pointerId: number,
    ) => {
      if (!isReservationRoomDraggable(reservation) || mode !== 'move') {
        return
      }

      setDropError(null)

      const nextDragState: CalendarDragState = {
        reservationId: reservation.id,
        mode,
        pointerId,
        originUnitId: unitId,
      }

      dragStateRef.current = nextDragState
      setDragState(nextDragState)
      logPlanning('drag start', {
        reservationId: reservation.id,
        guestName: reservation.ad_soyad,
        unitId,
        mode,
      })
    },
    [],
  )

  const applyDrop = useCallback(
    ({ reservation, dropTarget: target }: ApplyDropParams) => {
      const activeDrag = dragStateRef.current
      if (!activeDrag || activeDrag.reservationId !== reservation.id) {
        logPlanning('drop ignored — drag state missing', {
          reservationId: reservation.id,
          activeDrag,
        })
        return
      }

      const baseReservation =
        baseReservationsRef.current.find((item) => item.id === reservation.id) ?? reservation
      const effective =
        displayReservationsRef.current.find((item) => item.id === reservation.id) ?? reservation

      logPlanning('drop fired', {
        reservationId: reservation.id,
        target,
        mode: activeDrag.mode,
      })

      if (target.unitId === effective.konaklama_birimi_id) {
        logPlanning('drop ignored — same room')
        return
      }

      const conflict = findRoomMoveConflict(
        displayReservationsRef.current,
        target.unitId,
        effective.giris_tarihi,
        effective.cikis_tarihi,
        reservation.id,
      )

      if (conflict) {
        const targetUnitName = unitMap.get(target.unitId) ?? '—'
        setDropError(
          formatRoomMoveConflictMessage(
            effective.ad_soyad,
            targetUnitName,
            effective.giris_tarihi,
            effective.cikis_tarihi,
            conflict.ad_soyad,
          ),
        )
        return
      }

      commitChange(baseReservation, {
        unitId: target.unitId,
        girisTarihi: effective.giris_tarihi,
        cikisTarihi: effective.cikis_tarihi,
      })
    },
    [commitChange, unitMap],
  )

  const endDrag = useCallback(
    (params: {
      reservation: Reservation
      dropTarget: CalendarDropTarget | null
    }) => {
      const resolvedTarget = params.dropTarget ?? dropTargetRef.current

      if (dragStateRef.current && resolvedTarget) {
        applyDrop({
          reservation: params.reservation,
          dropTarget: resolvedTarget,
        })
      } else {
        logPlanning('drop missed — no target row', {
          reservationId: params.reservation.id,
          dropTarget: resolvedTarget,
        })
      }

      dragStateRef.current = null
      dropTargetRef.current = null
      setDragState(null)
      setDropTargetState(null)
    },
    [applyDrop],
  )

  const undoLast = useCallback(() => {
    setDropError(null)
    setUndoStack((current) => {
      if (current.length === 0) {
        return current
      }

      const entry = current[current.length - 1]
      setPendingMap((pending) => {
        const next = new Map(pending)

        if (!entry.previousChange || !isPendingChangeDirty(entry.previousChange)) {
          next.delete(entry.reservationId)
        } else {
          next.set(entry.reservationId, entry.previousChange)
        }

        return next
      })

      return current.slice(0, -1)
    })
  }, [])

  const cancelAll = useCallback(() => {
    setPendingMap(new Map())
    setUndoStack([])
    setDropError(null)
    dragStateRef.current = null
    dropTargetRef.current = null
    setDragState(null)
    setDropTargetState(null)
  }, [])

  const clearAfterSave = useCallback(() => {
    setPendingMap(new Map())
    setUndoStack([])
    setDropError(null)
    dragStateRef.current = null
    dropTargetRef.current = null
    setDragState(null)
    setDropTargetState(null)
  }, [])

  return {
    displayReservations,
    pendingMap,
    pendingChanges: dirtyChanges,
    pendingCount,
    pendingReservationIds,
    conflicts,
    unitMap,
    dragState,
    dropTarget,
    invalidDropTargetUnitId,
    dropError,
    setDropTarget,
    startDrag,
    endDrag,
    undoLast,
    cancelAll,
    clearAfterSave,
    canUndo: undoStack.length > 0,
  }
}

export type { CalendarPlanningConflict, CalendarPendingChange, CalendarDropTarget }
