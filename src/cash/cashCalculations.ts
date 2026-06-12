import { calculateDepositSummary, getTotalCollected } from '../reservations/depositCalculations'
import { formatTurkeyDateKey, getTurkeyDateKey } from '../lib/turkeyDate'
import type { AccommodationUnit, Reservation } from '../types/database'
import type {
  ActiveReservationRow,
  CashFilter,
  CashSummary,
  PaymentHistoryEntry,
  PaymentRecord,
} from './types'
import {
  filterActiveReservations,
  filterPaymentRecordsByDate,
  filterReservationsForCashSummary,
} from './cashFilters'

export function calculateCashSummary(reservations: Reservation[]): CashSummary {
  const depositSummary = calculateDepositSummary(reservations)

  const summary = reservations.reduce(
    (accumulator, reservation) => {
      accumulator.toplamTahsilEdilecek += Number(reservation.toplam_ucret)
      accumulator.toplamTahsilEdilen += getTotalCollected(reservation)
      accumulator.toplamKalanBakiye += Number(reservation.kalan_bakiye)
      return accumulator
    },
    {
      toplamTahsilEdilecek: 0,
      toplamTahsilEdilen: 0,
      toplamKalanBakiye: 0,
      toplamKapora: 0,
      bekleyenKaporalar: 0,
    },
  )

  return {
    ...summary,
    toplamKapora: depositSummary.toplamKapora,
    bekleyenKaporalar: depositSummary.bekleyenKaporalar,
  }
}

export function buildActiveReservationRows(
  reservations: Reservation[],
  units: AccommodationUnit[],
  filter: CashFilter,
): ActiveReservationRow[] {
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name]))
  const activeReservations = filterActiveReservations(reservations, filter)

  return activeReservations
    .map((reservation) => ({
      id: reservation.id,
      guestName: reservation.ad_soyad,
      unitName: unitMap.get(reservation.konaklama_birimi_id) ?? '—',
      girisTarihi: reservation.giris_tarihi,
      cikisTarihi: reservation.cikis_tarihi,
      toplamUcret: Number(reservation.toplam_ucret),
      alinanUcret: Number(reservation.alinan_ucret),
      kalanBakiye: Number(reservation.kalan_bakiye),
    }))
    .sort((a, b) => a.girisTarihi.localeCompare(b.girisTarihi))
}

export function buildPaymentHistoryEntries(
  paymentRecords: PaymentRecord[],
  reservations: Reservation[],
  units: AccommodationUnit[],
  filter: CashFilter,
): PaymentHistoryEntry[] {
  const reservationMap = new Map(reservations.map((reservation) => [reservation.id, reservation]))
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name]))
  const filteredRecords = filterPaymentRecordsByDate(paymentRecords, filter)

  if (filteredRecords.length > 0) {
    return filteredRecords
      .map((record) => {
        const reservation = reservationMap.get(record.reservation_id)
        return {
          id: record.id,
          guestName: reservation?.ad_soyad ?? 'Bilinmeyen Misafir',
          unitName: reservation
            ? (unitMap.get(reservation.konaklama_birimi_id) ?? '—')
            : '—',
          amount: Number(record.amount),
          paymentDate: record.payment_date,
          note: record.note,
        }
      })
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
  }

  const summaryReservations = filterReservationsForCashSummary(reservations, filter).filter(
    (reservation) => Number(reservation.alinan_ucret) > 0,
  )

  return summaryReservations
    .map((reservation) => ({
      id: `fallback-${reservation.id}`,
      guestName: reservation.ad_soyad,
      unitName: unitMap.get(reservation.konaklama_birimi_id) ?? '—',
      amount: Number(reservation.alinan_ucret),
      paymentDate: getTurkeyDateKey(new Date(reservation.updated_at)),
      note: 'Rezervasyon tahsilat kaydı',
    }))
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
}

export function getFilteredCashSummary(
  reservations: Reservation[],
  filter: CashFilter,
): CashSummary {
  const filtered = filterReservationsForCashSummary(reservations, filter)
  return calculateCashSummary(filtered)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  return formatTurkeyDateKey(value)
}
