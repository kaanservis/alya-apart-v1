import type { AccommodationUnit, Expense, Reservation } from '../types/database'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { calculateNights } from '../reservations/pricing'
import { findActiveReservationForUnit } from '../workflow/unitStatusLogic'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import {
  clampRangeEnd,
  clampRangeStart,
  expenseInRange,
  reservationOverlapsRange,
  type ReportDateRange,
} from './reportDateRanges'

export interface ReportSummary {
  toplamGelir: number
  toplamMasraf: number
  netKazanc: number
  toplamRezervasyon: number
  toplamGeceleme: number
  gunlukDoluOda: number
  toplamOda: number
  gunlukDolulukOrani: number
}

export interface RoomReportRow {
  unitId: string
  unitName: string
  reservationCount: number
  totalGuests: number
  totalNights: number
  totalRevenue: number
  collectedAmount: number
  remainingBalance: number
}

export interface ReportData {
  summary: ReportSummary
  roomReports: RoomReportRow[]
}

function overlapNights(
  girisTarihi: string,
  cikisTarihi: string,
  rangeStart: string,
  rangeEnd: string,
): number {
  if (!reservationOverlapsRange(girisTarihi, cikisTarihi, rangeStart, rangeEnd)) {
    return 0
  }

  const effectiveStart = clampRangeStart(girisTarihi, rangeStart)
  const effectiveEnd = clampRangeEnd(cikisTarihi, rangeEnd)

  return calculateNights(effectiveStart, effectiveEnd)
}

function filterReservationsInRange(reservations: Reservation[], range: ReportDateRange) {
  return reservations.filter((reservation) =>
    reservationOverlapsRange(
      reservation.giris_tarihi,
      reservation.cikis_tarihi,
      range.start,
      range.end,
    ),
  )
}

function filterExpensesInRange(expenses: Expense[], range: ReportDateRange) {
  return expenses.filter((expense) => expenseInRange(expense.tarih, range.start, range.end))
}

function computeDailyOccupancy(units: AccommodationUnit[], reservations: Reservation[]) {
  const today = getTurkeyDateKey()
  const occupiedToday = units.filter((unit) =>
    Boolean(findActiveReservationForUnit(unit.id, reservations, today)),
  ).length

  const totalRooms = units.length
  const gunlukDolulukOrani = totalRooms > 0 ? (occupiedToday / totalRooms) * 100 : 0

  return {
    gunlukDoluOda: occupiedToday,
    toplamOda: totalRooms,
    gunlukDolulukOrani,
  }
}

export function buildReportData(
  units: AccommodationUnit[],
  reservations: Reservation[],
  expenses: Expense[],
  range: ReportDateRange,
): ReportData {
  const inRangeReservations = filterReservationsInRange(reservations, range)
  const inRangeExpenses = filterExpensesInRange(expenses, range)
  const dailyOccupancy = computeDailyOccupancy(units, reservations)

  const toplamGelir = inRangeReservations.reduce(
    (sum, reservation) => sum + Number(reservation.toplam_ucret),
    0,
  )
  const toplamMasraf = inRangeExpenses.reduce((sum, expense) => sum + Number(expense.tutar), 0)
  const toplamGeceleme = inRangeReservations.reduce(
    (sum, reservation) =>
      sum +
      overlapNights(
        reservation.giris_tarihi,
        reservation.cikis_tarihi,
        range.start,
        range.end,
      ),
    0,
  )

  const roomReports = units.map((unit) => {
    const unitReservations = inRangeReservations.filter(
      (reservation) => reservation.konaklama_birimi_id === unit.id,
    )

    return {
      unitId: unit.id,
      unitName: unit.name,
      reservationCount: unitReservations.length,
      totalGuests: unitReservations.reduce(
        (sum, reservation) => sum + Number(reservation.kisi_sayisi),
        0,
      ),
      totalNights: unitReservations.reduce(
        (sum, reservation) =>
          sum +
          overlapNights(
            reservation.giris_tarihi,
            reservation.cikis_tarihi,
            range.start,
            range.end,
          ),
        0,
      ),
      totalRevenue: unitReservations.reduce(
        (sum, reservation) => sum + Number(reservation.toplam_ucret),
        0,
      ),
      collectedAmount: unitReservations.reduce(
        (sum, reservation) => sum + getTotalCollected(reservation),
        0,
      ),
      remainingBalance: unitReservations.reduce(
        (sum, reservation) => sum + getRemainingBalance(reservation),
        0,
      ),
    }
  })

  return {
    summary: {
      toplamGelir,
      toplamMasraf,
      netKazanc: toplamGelir - toplamMasraf,
      toplamRezervasyon: inRangeReservations.length,
      toplamGeceleme,
      ...dailyOccupancy,
    },
    roomReports,
  }
}

export function getRoomReservationsInRange(
  reservations: Reservation[],
  unitId: string,
  range: ReportDateRange,
): Reservation[] {
  return reservations
    .filter(
      (reservation) =>
        reservation.konaklama_birimi_id === unitId &&
        reservationOverlapsRange(
          reservation.giris_tarihi,
          reservation.cikis_tarihi,
          range.start,
          range.end,
        ),
    )
    .sort((a, b) => a.giris_tarihi.localeCompare(b.giris_tarihi, 'tr'))
}

export function getReservationNightsInRange(
  reservation: Reservation,
  range: ReportDateRange,
): number {
  return overlapNights(
    reservation.giris_tarihi,
    reservation.cikis_tarihi,
    range.start,
    range.end,
  )
}

export function formatReportCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number) {
  return `%${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`
}
