import type {
  AccommodationUnit,
  Reservation,
  ReservationStatus,
  RoomDisplayStatus,
} from '../types/database'
import { findActiveReservationForUnit, getTodayKey, normalizeUnitStatus } from './unitStatusLogic'

export function isOperationalReservation(reservation: Pick<Reservation, 'durum'>) {
  return reservation.durum === 'Aktif'
}

export function isArchivedReservationStatus(durum: ReservationStatus) {
  return durum === 'Geçmiş' || durum === 'İptal' || durum === 'No Show'
}

export function isOdaKabulYapildi(reservation: Pick<Reservation, 'oda_kabul_yapildi'>) {
  return reservation.oda_kabul_yapildi === true
}

export function computeRoomDisplayStatus(
  unit: AccommodationUnit,
  activeReservation: Reservation | undefined,
  today = getTodayKey(),
): RoomDisplayStatus {
  const unitStatus = normalizeUnitStatus(unit.status)

  if (unitStatus === 'Temizlik Bekliyor') {
    return 'Temizlik Bekliyor'
  }

  if (!activeReservation || !isOperationalReservation(activeReservation)) {
    return 'Boş'
  }

  if (activeReservation.cikis_tarihi === today) {
    return 'Çıkış Bugün'
  }

  if (
    activeReservation.giris_tarihi === today &&
    !isOdaKabulYapildi(activeReservation)
  ) {
    return 'Bugün Giriş'
  }

  if (activeReservation.giris_tarihi <= today) {
    return 'Dolu'
  }

  return 'Boş'
}

export function computeRoomDisplayStatusForUnit(
  unit: AccommodationUnit,
  reservations: Reservation[],
  today = getTodayKey(),
): RoomDisplayStatus {
  const activeReservation = findActiveReservationForUnit(unit.id, reservations, today)
  return computeRoomDisplayStatus(unit, activeReservation, today)
}

export function canShowOdaKabulButton(
  displayStatus: RoomDisplayStatus,
  activeReservation?: Reservation,
) {
  return (
    displayStatus === 'Bugün Giriş' &&
    Boolean(activeReservation) &&
    !isOdaKabulYapildi(activeReservation!)
  )
}

export function getReservationStatusLabel(durum: ReservationStatus) {
  switch (durum) {
    case 'Aktif':
      return 'Aktif'
    case 'Geçmiş':
      return 'Geçmiş'
    case 'İptal':
      return 'İptal'
    case 'No Show':
      return 'No Show'
    default:
      return durum
  }
}
