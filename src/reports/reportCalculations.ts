import type { AccommodationUnit, Expense, Reservation } from '../types/database'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { calculateNights } from '../reservations/pricing'
import {
  clampRangeEnd,
  clampRangeStart,
  countDaysInRange,
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
  ortalamaDoluluk: number
}

export interface RoomPerformanceRow {
  unitId: string
  unitName: string
  reservationCount: number
  totalNights: number
  totalRevenue: number
}

export interface OccupancyRow {
  unitId: string
  unitName: string
  occupiedDays: number
  emptyDays: number
  occupancyRate: number
}

export interface FinancialReport {
  toplamTahsilat: number
  bekleyenTahsilat: number
  toplamMasraf: number
  netKar: number
}

export interface MonthlyChartPoint {
  monthKey: string
  label: string
  gelir: number
  masraf: number
  netKar: number
}

export interface ReportData {
  summary: ReportSummary
  roomPerformance: RoomPerformanceRow[]
  topRooms: RoomPerformanceRow[]
  occupancy: OccupancyRow[]
  financial: FinancialReport
  monthlyCharts: MonthlyChartPoint[]
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

function buildMonthlyCharts(
  reservations: Reservation[],
  expenses: Expense[],
  range: ReportDateRange,
): MonthlyChartPoint[] {
  const months = new Map<string, MonthlyChartPoint>()

  function ensureMonth(monthKey: string) {
    if (!months.has(monthKey)) {
      const [year, month] = monthKey.split('-').map(Number)
      const label = new Intl.DateTimeFormat('tr-TR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Istanbul',
      }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)))

      months.set(monthKey, {
        monthKey,
        label,
        gelir: 0,
        masraf: 0,
        netKar: 0,
      })
    }

    return months.get(monthKey)!
  }

  filterReservationsInRange(reservations, range).forEach((reservation) => {
    const monthKey = reservation.giris_tarihi.slice(0, 7)
    const point = ensureMonth(monthKey)
    point.gelir += Number(reservation.toplam_ucret)
  })

  filterExpensesInRange(expenses, range).forEach((expense) => {
    const monthKey = expense.tarih.slice(0, 7)
    const point = ensureMonth(monthKey)
    point.masraf += Number(expense.tutar)
  })

  return [...months.values()]
    .map((point) => ({
      ...point,
      netKar: point.gelir - point.masraf,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

export function buildReportData(
  units: AccommodationUnit[],
  reservations: Reservation[],
  expenses: Expense[],
  range: ReportDateRange,
): ReportData {
  const inRangeReservations = filterReservationsInRange(reservations, range)
  const inRangeExpenses = filterExpensesInRange(expenses, range)
  const periodDays = countDaysInRange(range.start, range.end)

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

  const toplamTahsilat = inRangeReservations.reduce(
    (sum, reservation) => sum + getTotalCollected(reservation),
    0,
  )
  const bekleyenTahsilat = inRangeReservations.reduce(
    (sum, reservation) => sum + getRemainingBalance(reservation),
    0,
  )

  const roomPerformance = units
    .map((unit) => {
      const unitReservations = inRangeReservations.filter(
        (reservation) => reservation.konaklama_birimi_id === unit.id,
      )

      return {
        unitId: unit.id,
        unitName: unit.name,
        reservationCount: unitReservations.length,
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
      }
    })
    .filter(
      (row) => row.reservationCount > 0 || row.totalRevenue > 0 || row.totalNights > 0,
    )
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const occupancy = units.map((unit) => {
    const occupiedDays = inRangeReservations
      .filter((reservation) => reservation.konaklama_birimi_id === unit.id)
      .reduce(
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

    const emptyDays = Math.max(0, periodDays - occupiedDays)
    const occupancyRate = periodDays > 0 ? (occupiedDays / periodDays) * 100 : 0

    return {
      unitId: unit.id,
      unitName: unit.name,
      occupiedDays,
      emptyDays,
      occupancyRate,
    }
  })

  const averageOccupancy =
    occupancy.length > 0
      ? occupancy.reduce((sum, row) => sum + row.occupancyRate, 0) / occupancy.length
      : 0

  return {
    summary: {
      toplamGelir,
      toplamMasraf,
      netKazanc: toplamGelir - toplamMasraf,
      toplamRezervasyon: inRangeReservations.length,
      toplamGeceleme,
      ortalamaDoluluk: averageOccupancy,
    },
    roomPerformance,
    topRooms: roomPerformance.slice(0, 5),
    occupancy,
    financial: {
      toplamTahsilat,
      bekleyenTahsilat,
      toplamMasraf,
      netKar: toplamTahsilat - toplamMasraf,
    },
    monthlyCharts: buildMonthlyCharts(reservations, expenses, range),
  }
}

export function formatReportCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number) {
  return `%${value.toFixed(1)}`
}
