import { toDateKey } from '../calendar/dateUtils'
import { getTurkeyDateKey, parseTurkeyDateKey } from '../lib/turkeyDate'
import type { AccommodationUnit } from '../types/database'
import type { ReservationFormValues, PricingSource } from './types'
import { EMPTY_RESERVATION_FORM } from './types'
import {
  calculateDailyFromTotal,
  calculateNights,
  calculateTotalFromDaily,
  roundMoney,
} from './pricing'
import { parseAmount } from './validation'

export function openCreateFromCalendarSelection(unit: AccommodationUnit, date: Date) {
  const checkIn = toDateKey(date)
  return {
    initialUnitId: unit.id,
    initialCheckIn: checkIn,
    initialCheckOut: checkIn,
  }
}

export function applyReservationFieldChange(
  current: ReservationFormValues,
  field: keyof ReservationFormValues,
  value: string,
  pricingSource: PricingSource,
): { values: ReservationFormValues; pricingSource: PricingSource } {
  const next: ReservationFormValues = { ...current, [field]: value }
  let nextPricingSource = pricingSource

  if (field === 'gunluk_ucret') {
    nextPricingSource = 'daily'
    const nights = calculateNights(next.giris_tarihi, next.cikis_tarihi)
    const daily = parseAmount(value)

    if (!Number.isNaN(daily) && nights > 0) {
      next.toplam_ucret = String(calculateTotalFromDaily(daily, nights))
    }
  } else if (field === 'toplam_ucret') {
    nextPricingSource = 'total'
    const nights = calculateNights(next.giris_tarihi, next.cikis_tarihi)
    const total = parseAmount(value)

    if (!Number.isNaN(total) && nights > 0) {
      next.gunluk_ucret = String(calculateDailyFromTotal(total, nights))
    }
  } else if (field === 'giris_tarihi' || field === 'cikis_tarihi') {
    const nights = calculateNights(next.giris_tarihi, next.cikis_tarihi)

    if (nights > 0) {
      if (nextPricingSource === 'daily') {
        const daily = parseAmount(next.gunluk_ucret)
        if (!Number.isNaN(daily)) {
          next.toplam_ucret = String(calculateTotalFromDaily(daily, nights))
        }
      } else if (nextPricingSource === 'total') {
        const total = parseAmount(next.toplam_ucret)
        if (!Number.isNaN(total)) {
          next.gunluk_ucret = String(calculateDailyFromTotal(total, nights))
        }
      } else {
        const daily = parseAmount(next.gunluk_ucret)
        const total = parseAmount(next.toplam_ucret)

        if (!Number.isNaN(daily) && daily > 0) {
          next.toplam_ucret = String(calculateTotalFromDaily(daily, nights))
          nextPricingSource = 'daily'
        } else if (!Number.isNaN(total) && total > 0) {
          next.gunluk_ucret = String(calculateDailyFromTotal(total, nights))
          nextPricingSource = 'total'
        }
      }
    }
  }

  return { values: next, pricingSource: nextPricingSource }
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseTurkeyDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildNewReservationFormValues(options?: {
  unitId?: string
  checkIn?: string
  checkOut?: string
}): ReservationFormValues {
  const checkIn = options?.checkIn ?? getTurkeyDateKey()
  const checkOut = options?.checkOut ?? addDaysToDateKey(checkIn, 1)

  return {
    ...EMPTY_RESERVATION_FORM,
    giris_tarihi: checkIn,
    cikis_tarihi: checkOut,
    konaklama_birimi_id: options?.unitId ?? '',
  }
}

export function reservationToFormValues(reservation: {
  ad_soyad: string
  telefon: string
  kisi_sayisi: number
  giris_tarihi: string
  cikis_tarihi: string
  konaklama_birimi_id: string
  gunluk_ucret?: number
  toplam_ucret: number
  kapora?: number
  kapora_tahsil?: number
  giris_te_alinan?: number
  alinan_ucret: number
  notlar: string | null
}): ReservationFormValues {
  const nights = calculateNights(reservation.giris_tarihi, reservation.cikis_tarihi)
  const daily =
    reservation.gunluk_ucret != null && reservation.gunluk_ucret > 0
      ? reservation.gunluk_ucret
      : calculateDailyFromTotal(reservation.toplam_ucret, nights)

  const kaporaTahsil =
    reservation.kapora_tahsil != null
      ? reservation.kapora_tahsil
      : Math.max(0, reservation.alinan_ucret - (reservation.giris_te_alinan ?? 0))
  const girisTeAlinan =
    reservation.giris_te_alinan != null ? reservation.giris_te_alinan : reservation.alinan_ucret

  return {
    ad_soyad: reservation.ad_soyad,
    telefon: reservation.telefon,
    kisi_sayisi: String(reservation.kisi_sayisi),
    giris_tarihi: reservation.giris_tarihi,
    cikis_tarihi: reservation.cikis_tarihi,
    konaklama_birimi_id: reservation.konaklama_birimi_id,
    gunluk_ucret: String(roundMoney(daily)),
    toplam_ucret: String(reservation.toplam_ucret),
    kapora: String(reservation.kapora ?? 0),
    kapora_tahsil: String(kaporaTahsil),
    giris_te_alinan: String(girisTeAlinan),
    notlar: reservation.notlar ?? '',
  }
}
