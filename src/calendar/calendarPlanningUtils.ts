import type { AccommodationUnit, Reservation } from '../types/database'
import { findConflictingReservation } from '../reservations/validation'
import { formatReservationDate } from '../reservations/reservationDisplay'

export interface CalendarPendingChange {
  reservationId: string
  guestName: string
  originalUnitId: string
  originalGirisTarihi: string
  originalCikisTarihi: string
  draftUnitId: string
  draftGirisTarihi: string
  draftCikisTarihi: string
}

export type CalendarDragMode = 'move'

export interface CalendarDragState {
  reservationId: string
  mode: CalendarDragMode
  pointerId: number
  originUnitId: string
}

export interface CalendarDropTarget {
  unitId: string
}

export interface CalendarPlanningConflict {
  change: CalendarPendingChange
  conflictReservation: Reservation
  unitName: string
}

export function isReservationRoomDraggable(reservation: Reservation): boolean {
  return reservation.durum === 'Aktif'
}

export function isReservationReadOnly(reservation: Reservation): boolean {
  return !isReservationRoomDraggable(reservation)
}

export function applyPendingChanges(
  reservations: Reservation[],
  pendingChanges: Map<string, CalendarPendingChange>,
): Reservation[] {
  if (pendingChanges.size === 0) {
    return reservations
  }

  return reservations.map((reservation) => {
    const pending = pendingChanges.get(reservation.id)
    if (!pending) {
      return reservation
    }

    return {
      ...reservation,
      konaklama_birimi_id: pending.draftUnitId,
      giris_tarihi: pending.draftGirisTarihi,
      cikis_tarihi: pending.draftCikisTarihi,
    }
  })
}

export function buildPendingChange(
  reservation: Reservation,
  existing: CalendarPendingChange | undefined,
  draft: {
    unitId: string
    girisTarihi: string
    cikisTarihi: string
  },
): CalendarPendingChange {
  return {
    reservationId: reservation.id,
    guestName: reservation.ad_soyad,
    originalUnitId: existing?.originalUnitId ?? reservation.konaklama_birimi_id,
    originalGirisTarihi: existing?.originalGirisTarihi ?? reservation.giris_tarihi,
    originalCikisTarihi: existing?.originalCikisTarihi ?? reservation.cikis_tarihi,
    draftUnitId: draft.unitId,
    draftGirisTarihi: draft.girisTarihi,
    draftCikisTarihi: draft.cikisTarihi,
  }
}

export function isPendingChangeDirty(change: CalendarPendingChange): boolean {
  return change.originalUnitId !== change.draftUnitId
}

export function findRoomMoveConflict(
  reservations: Reservation[],
  targetUnitId: string,
  girisTarihi: string,
  cikisTarihi: string,
  excludeReservationId: string,
): Reservation | undefined {
  return findConflictingReservation(
    reservations,
    targetUnitId,
    girisTarihi,
    cikisTarihi,
    excludeReservationId,
  )
}

export function findPlanningConflicts(
  baseReservations: Reservation[],
  pendingChanges: Map<string, CalendarPendingChange>,
  units: AccommodationUnit[],
): CalendarPlanningConflict[] {
  const effective = applyPendingChanges(baseReservations, pendingChanges)
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name]))
  const conflicts: CalendarPlanningConflict[] = []

  for (const change of pendingChanges.values()) {
    if (!isPendingChangeDirty(change)) {
      continue
    }

    const conflict = findRoomMoveConflict(
      effective,
      change.draftUnitId,
      change.originalGirisTarihi,
      change.originalCikisTarihi,
      change.reservationId,
    )

    if (conflict) {
      conflicts.push({
        change,
        conflictReservation: conflict,
        unitName: unitMap.get(change.draftUnitId) ?? '—',
      })
    }
  }

  return conflicts
}

export function formatDateRange(girisTarihi: string, cikisTarihi: string): string {
  return `${formatReservationDate(girisTarihi)} - ${formatReservationDate(cikisTarihi)}`
}

export function formatRoomMoveConflictMessage(
  guestName: string,
  targetUnitName: string,
  girisTarihi: string,
  cikisTarihi: string,
  conflictGuestName: string,
): string {
  return `${guestName} rezervasyonu ${targetUnitName} odasına taşınamaz. Aynı tarihlerde (${formatDateRange(girisTarihi, cikisTarihi)}) ${conflictGuestName} adlı başka bir rezervasyon bulunuyor.`
}

export function formatRoomMoveConfirmMessage(
  change: CalendarPendingChange,
  unitMap: Map<string, string>,
): string {
  const oldRoom = unitMap.get(change.originalUnitId) ?? '—'
  const newRoom = unitMap.get(change.draftUnitId) ?? '—'

  return `${change.guestName} isimli rezervasyonun
${oldRoom} → ${newRoom} olarak değiştirilecektir.

Giriş Tarihi: ${formatReservationDate(change.originalGirisTarihi)} (DEĞİŞMEYECEK)
Çıkış Tarihi: ${formatReservationDate(change.originalCikisTarihi)} (DEĞİŞMEYECEK)`
}
