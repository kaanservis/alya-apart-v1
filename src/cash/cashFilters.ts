import {
  getSeasonDateRange,
  getTurkeyDateKey,
  getTurkeyMonthDateRange,
} from '../lib/turkeyDate'
import type { Reservation } from '../types/database'
import type { CashFilter } from './types'

function reservationOverlapsRange(
  reservation: Reservation,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  return reservation.giris_tarihi <= rangeEnd && reservation.cikis_tarihi >= rangeStart
}

export function getFilterDateRange(filter: CashFilter, reference = new Date()) {
  const todayKey = getTurkeyDateKey(reference)

  if (filter === 'today') {
    return { start: todayKey, end: todayKey }
  }

  if (filter === 'month') {
    return getTurkeyMonthDateRange(reference)
  }

  const year = Number(getTurkeyDateKey(reference).slice(0, 4))
  return getSeasonDateRange(year)
}

export function filterActiveReservations(
  reservations: Reservation[],
  filter: CashFilter,
  reference = new Date(),
): Reservation[] {
  const { start, end } = getFilterDateRange(filter, reference)

  return reservations.filter(
    (reservation) =>
      reservation.durum === 'Aktif' && reservationOverlapsRange(reservation, start, end),
  )
}

export function filterReservationsForCashSummary(
  reservations: Reservation[],
  filter: CashFilter,
  reference = new Date(),
): Reservation[] {
  const { start, end } = getFilterDateRange(filter, reference)

  return reservations.filter((reservation) => reservationOverlapsRange(reservation, start, end))
}

export function filterPaymentRecordsByDate<T extends { payment_date: string }>(
  records: T[],
  filter: CashFilter,
  reference = new Date(),
): T[] {
  const { start, end } = getFilterDateRange(filter, reference)
  return records.filter((record) => record.payment_date >= start && record.payment_date <= end)
}

export function getFilterLabel(filter: CashFilter, reference = new Date()): string {
  const { start, end } = getFilterDateRange(filter, reference)

  if (filter === 'today') {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(reference)
  }

  if (filter === 'month') {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      month: 'long',
      year: 'numeric',
    }).format(reference)
  }

  return `${start.split('-').reverse().join('.')} – ${end.split('-').reverse().join('.')}`
}
