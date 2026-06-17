import type { AccommodationUnit, Reservation, ReservationStatus } from '../types/database'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import type { ReservationFormErrors, ReservationFormValues } from './types'

export function calculateRemainingBalance(toplam: number, alinan: number): number {
  return Math.max(0, toplam - alinan)
}

export function parseAmount(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) {
    return NaN
  }

  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : NaN
}

/**
 * Returns true when `dateKey` falls inside [girisTarihi, cikisTarihi).
 * Check-out day is exclusive — the room is available for a new check-in that day.
 */
export function isDateOccupiedByReservation(
  dateKey: string,
  girisTarihi: string,
  cikisTarihi: string,
): boolean {
  return dateKey >= girisTarihi && dateKey < cikisTarihi
}

/**
 * Two reservations conflict when their occupied date ranges overlap.
 * Overlap exists when: (newCheckIn < existingCheckOut) AND (newCheckOut > existingCheckIn).
 * Same-day turnover (new check-in on existing check-out) is allowed.
 */
export function datesOverlap(
  girisA: string,
  cikisA: string,
  girisB: string,
  cikisB: string,
): boolean {
  return girisA < cikisB && cikisA > girisB
}

export function findConflictingReservation(
  reservations: Reservation[],
  unitId: string,
  girisTarihi: string,
  cikisTarihi: string,
  excludeReservationId?: string,
): Reservation | undefined {
  return reservations.find(
    (reservation) =>
      reservation.id !== excludeReservationId &&
      reservation.konaklama_birimi_id === unitId &&
      reservation.durum === 'Aktif' &&
      datesOverlap(girisTarihi, cikisTarihi, reservation.giris_tarihi, reservation.cikis_tarihi),
  )
}

export function getAvailableUnits(
  units: AccommodationUnit[],
  reservations: Reservation[],
  girisTarihi: string,
  cikisTarihi: string,
  excludeReservationId?: string,
): AccommodationUnit[] {
  if (!girisTarihi || !cikisTarihi || cikisTarihi < girisTarihi) {
    return units
  }

  return units.filter(
    (unit) =>
      !findConflictingReservation(
        reservations,
        unit.id,
        girisTarihi,
        cikisTarihi,
        excludeReservationId,
      ),
  )
}

export function deriveReservationStatus(cikisTarihi: string, today = new Date()): ReservationStatus {
  const todayKey = getTurkeyDateKey(today)
  return cikisTarihi < todayKey ? 'Geçmiş' : 'Aktif'
}

export function validateReservationForm(
  values: ReservationFormValues,
  reservations: Reservation[],
  units: AccommodationUnit[],
  excludeReservationId?: string,
): ReservationFormErrors {
  const errors: ReservationFormErrors = {}

  if (!values.ad_soyad.trim()) {
    errors.ad_soyad = 'Ad soyad zorunludur.'
  }

  if (!values.telefon.trim()) {
    errors.telefon = 'Telefon zorunludur.'
  }

  const kisiSayisi = Number(values.kisi_sayisi)
  if (!Number.isInteger(kisiSayisi) || kisiSayisi <= 0) {
    errors.kisi_sayisi = 'Kişi sayısı en az 1 olmalıdır.'
  }

  if (!values.giris_tarihi) {
    errors.giris_tarihi = 'Giriş tarihi zorunludur.'
  }

  if (!values.cikis_tarihi) {
    errors.cikis_tarihi = 'Çıkış tarihi zorunludur.'
  }

  if (values.giris_tarihi && values.cikis_tarihi && values.cikis_tarihi < values.giris_tarihi) {
    errors.cikis_tarihi = 'Çıkış tarihi giriş tarihinden önce olamaz.'
  }

  if (!values.konaklama_birimi_id) {
    errors.konaklama_birimi_id = 'Oda seçiniz.'
  }

  const toplamUcret = parseAmount(values.toplam_ucret)
  const gunlukUcret = parseAmount(values.gunluk_ucret)

  if (Number.isNaN(gunlukUcret) || gunlukUcret < 0) {
    errors.gunluk_ucret = 'Geçerli bir günlük ücret giriniz.'
  }

  if (Number.isNaN(toplamUcret) || toplamUcret < 0) {
    errors.toplam_ucret = 'Geçerli bir toplam ücret giriniz.'
  }

  if (
    values.giris_tarihi &&
    values.cikis_tarihi &&
    values.cikis_tarihi >= values.giris_tarihi &&
    values.konaklama_birimi_id
  ) {
    const availableUnits = getAvailableUnits(
      units,
      reservations,
      values.giris_tarihi,
      values.cikis_tarihi,
      excludeReservationId,
    )

    const isUnitAvailable = availableUnits.some((unit) => unit.id === values.konaklama_birimi_id)

    if (!isUnitAvailable) {
      const conflict = findConflictingReservation(
        reservations,
        values.konaklama_birimi_id,
        values.giris_tarihi,
        values.cikis_tarihi,
        excludeReservationId,
      )

      errors.conflict = conflict
        ? `${conflict.ad_soyad} adlı rezervasyon ile tarih çakışması var. Kayıt yapılamaz.`
        : 'Seçilen oda bu tarihler için müsait değil.'
    }
  }

  return errors
}

export function hasFormErrors(errors: ReservationFormErrors): boolean {
  return Object.keys(errors).length > 0
}
