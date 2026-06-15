import { compareDateKeys, getTurkeyDateKey } from '../lib/turkeyDate'
import type { Reservation } from '../types/database'
import { normalizeTcDigits } from '../reservations/formInputHelpers'
import type { GuestEntryWithPhotos } from './guestTypes'

export type GuestRegistrationStatus = 'future' | 'pending' | 'complete'

export function isCheckInEligible(reservation: Pick<Reservation, 'giris_tarihi'>) {
  const todayKey = getTurkeyDateKey()
  return compareDateKeys(reservation.giris_tarihi, todayKey) <= 0
}

export function hasGuestIdPhoto(
  guest: GuestEntryWithPhotos,
  photoType: 'front_id' | 'back_id',
) {
  return guest.photos.some((photo) => photo.photo_type === photoType)
}

export function isGuestEntryRegistrationComplete(guest: GuestEntryWithPhotos) {
  const tcDigits = normalizeTcDigits(guest.tc_no ?? '')
  return (
    guest.full_name.trim().length > 0 &&
    tcDigits.length === 11 &&
    hasGuestIdPhoto(guest, 'front_id') &&
    hasGuestIdPhoto(guest, 'back_id')
  )
}

export function getGuestRegistrationStatus(
  reservation: Pick<Reservation, 'giris_tarihi' | 'kisi_sayisi'>,
  guests: GuestEntryWithPhotos[],
): GuestRegistrationStatus {
  if (!isCheckInEligible(reservation)) {
    return 'future'
  }

  const completeCount = guests.filter(isGuestEntryRegistrationComplete).length
  if (completeCount >= reservation.kisi_sayisi) {
    return 'complete'
  }

  return 'pending'
}

export function getCheckInReservation(
  activeReservation?: Reservation,
  nextReservation?: Reservation,
): Reservation | undefined {
  if (activeReservation && isCheckInEligible(activeReservation)) {
    return activeReservation
  }

  if (nextReservation && isCheckInEligible(nextReservation)) {
    return nextReservation
  }

  return undefined
}
