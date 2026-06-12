import type { AccommodationUnit, Reservation, UnitStatus } from '../types/database'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import { getUnitDisplayOrder, sortAccommodationUnitsByDisplayOrder } from '../lib/unitOrder'

export function getTodayKey(): string {
  return getTurkeyDateKey()
}

export function normalizeUnitStatus(status: string): UnitStatus {
  if (status === 'Çıkış Bugün') {
    return 'Çıkış Bekliyor'
  }

  return status as UnitStatus
}

export function findActiveReservationForUnit(
  unitId: string,
  reservations: Reservation[],
  today = getTodayKey(),
): Reservation | undefined {
  return reservations.find(
    (reservation) =>
      reservation.konaklama_birimi_id === unitId &&
      reservation.durum === 'Aktif' &&
      reservation.giris_tarihi <= today &&
      reservation.cikis_tarihi >= today,
  )
}

export function computeExpectedUnitStatus(
  unit: AccommodationUnit,
  reservations: Reservation[],
  today = getTodayKey(),
): UnitStatus {
  const currentStatus = normalizeUnitStatus(unit.status)

  if (currentStatus === 'Temizlik Bekliyor') {
    return 'Temizlik Bekliyor'
  }

  const activeReservation = findActiveReservationForUnit(unit.id, reservations, today)

  if (!activeReservation) {
    return 'Boş'
  }

  if (activeReservation.cikis_tarihi === today) {
    return 'Çıkış Bekliyor'
  }

  return 'Dolu'
}

export function findNextReservationForUnit(
  unitId: string,
  reservations: Reservation[],
  today = getTodayKey(),
): Reservation | undefined {
  const active = findActiveReservationForUnit(unitId, reservations, today)

  return reservations
    .filter((reservation) => {
      if (reservation.konaklama_birimi_id !== unitId || reservation.durum !== 'Aktif') {
        return false
      }

      if (active && reservation.id === active.id) {
        return false
      }

      if (active) {
        return reservation.giris_tarihi >= active.cikis_tarihi
      }

      return reservation.giris_tarihi > today
    })
    .sort((a, b) => a.giris_tarihi.localeCompare(b.giris_tarihi))[0]
}

export function findLastGuestForUnit(
  unitId: string,
  reservations: Reservation[],
): Reservation | undefined {
  return reservations
    .filter(
      (reservation) =>
        reservation.konaklama_birimi_id === unitId && reservation.durum === 'Geçmiş',
    )
    .sort((a, b) => b.cikis_tarihi.localeCompare(a.cikis_tarihi, 'tr'))[0]
}

export function getCleaningRequiredUnits(units: AccommodationUnit[]): AccommodationUnit[] {
  return sortAccommodationUnitsByDisplayOrder(
    units.filter((unit) => normalizeUnitStatus(unit.status) === 'Temizlik Bekliyor'),
  )
}

export interface CheckoutPendingGuest {
  reservation: Reservation
  unit: AccommodationUnit
}

export function getCheckoutPendingGuests(
  units: AccommodationUnit[],
  reservations: Reservation[],
  today = getTodayKey(),
): CheckoutPendingGuest[] {
  const unitMap = new Map(units.map((unit) => [unit.id, unit]))

  return reservations
    .filter(
      (reservation) =>
        reservation.durum === 'Aktif' && reservation.cikis_tarihi === today,
    )
    .map((reservation) => ({
      reservation,
      unit: unitMap.get(reservation.konaklama_birimi_id)!,
    }))
    .filter((entry) => Boolean(entry.unit))
    .sort(
      (a, b) => getUnitDisplayOrder(a.unit) - getUnitDisplayOrder(b.unit),
    )
}

export interface UnitStatusCounts {
  bos: number
  dolu: number
  cikisBekliyor: number
  temizlikBekliyor: number
}

export function getUnitStatusCounts(units: AccommodationUnit[]): UnitStatusCounts {
  return units.reduce<UnitStatusCounts>(
    (counts, unit) => {
      switch (normalizeUnitStatus(unit.status)) {
        case 'Boş':
          counts.bos += 1
          break
        case 'Dolu':
          counts.dolu += 1
          break
        case 'Çıkış Bekliyor':
          counts.cikisBekliyor += 1
          break
        case 'Temizlik Bekliyor':
          counts.temizlikBekliyor += 1
          break
      }
      return counts
    },
    { bos: 0, dolu: 0, cikisBekliyor: 0, temizlikBekliyor: 0 },
  )
}
