import type { AccommodationUnit, Reservation } from '../types/database'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import { isDateOccupiedByReservation } from '../reservations/validation'
import { addDays, parseDateKey, reservationOverlapsRange, toDateKey } from './dateUtils'
import type { CalendarCellState, CalendarUnitRowData, ReservationSegment } from './types'

export function getReservationColor(
  reservation: Reservation,
  unit: AccommodationUnit,
  today = new Date(),
): CalendarCellState {
  const todayKey = getTurkeyDateKey(today)
  const checkoutDate = parseDateKey(reservation.cikis_tarihi)

  if (reservation.cikis_tarihi === todayKey && reservation.durum === 'Aktif') {
    return 'checkout'
  }

  if (unit.status === 'Temizlik Bekliyor' && reservation.durum === 'Aktif') {
    const dayAfterCheckout = toDateKey(addDays(checkoutDate, 1))
    if (todayKey === dayAfterCheckout || todayKey === reservation.cikis_tarihi) {
      return 'cleaning'
    }
  }

  if (unit.status === 'Temizlik Bekliyor' && reservation.durum === 'Geçmiş') {
    return 'cleaning'
  }

  return 'occupied'
}

export function isDateReserved(
  unitId: string,
  date: Date,
  reservations: Reservation[],
): Reservation | undefined {
  const dateKey = toDateKey(date)

  return reservations.find(
    (reservation) =>
      reservation.konaklama_birimi_id === unitId &&
      reservation.durum === 'Aktif' &&
      isDateOccupiedByReservation(dateKey, reservation.giris_tarihi, reservation.cikis_tarihi),
  )
}

export function getCellState(
  unit: AccommodationUnit,
  date: Date,
  reservations: Reservation[],
  today = new Date(),
): CalendarCellState {
  const activeReservation = isDateReserved(unit.id, date, reservations)

  if (activeReservation) {
    return getReservationColor(activeReservation, unit, today)
  }

  const previousDay = addDays(date, -1)
  const previousCheckout = reservations.find(
    (reservation) =>
      reservation.konaklama_birimi_id === unit.id &&
      reservation.cikis_tarihi === toDateKey(previousDay),
  )

  if (previousCheckout && unit.status === 'Temizlik Bekliyor') {
    return 'cleaning'
  }

  return 'available'
}

export function buildUnitRowData(
  unit: AccommodationUnit,
  reservations: Reservation[],
  visibleDates: Date[],
): CalendarUnitRowData {
  const rangeStart = visibleDates[0]
  const rangeEnd = visibleDates[visibleDates.length - 1]

  const segments: ReservationSegment[] = reservations
    .filter(
      (reservation) =>
        reservation.konaklama_birimi_id === unit.id &&
        reservationOverlapsRange(
          reservation.giris_tarihi,
          reservation.cikis_tarihi,
          rangeStart,
          rangeEnd,
        ),
    )
    .flatMap((reservation) => {
      const reservationStart = parseDateKey(reservation.giris_tarihi)
      const lastOccupiedDay = addDays(parseDateKey(reservation.cikis_tarihi), -1)

      if (toDateKey(lastOccupiedDay) < reservation.giris_tarihi) {
        return []
      }

      const reservationEnd = lastOccupiedDay
      const segmentStart = reservationStart < rangeStart ? rangeStart : reservationStart
      const segmentEnd = reservationEnd > rangeEnd ? rangeEnd : reservationEnd
      const startIndex = visibleDates.findIndex((date) => toDateKey(date) === toDateKey(segmentStart))
      const endIndex = visibleDates.findIndex((date) => toDateKey(date) === toDateKey(segmentEnd))

      if (startIndex < 0 || endIndex < startIndex) {
        return []
      }

      return [
        {
          reservation,
          startIndex,
          span: endIndex - startIndex + 1,
          color: getReservationColor(reservation, unit),
        },
      ]
    })

  return { unit, segments }
}
