import { getActiveSeasonYear } from '../calendar/dateUtils'
import {
  compareDateKeys,
  getSeasonDateRange,
  getTurkeyDateKey,
  getTurkeyMonthDateRange,
  parseTurkeyDateKey,
} from '../lib/turkeyDate'

export type ReportFilterPreset = 'today' | 'week' | 'month' | 'season' | 'custom'

export interface ReportDateRange {
  start: string
  end: string
  label: string
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseTurkeyDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekDateRange(reference = new Date()): { start: string; end: string } {
  const todayKey = getTurkeyDateKey(reference)
  const today = parseTurkeyDateKey(todayKey)
  const dayOfWeek = today.getUTCDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const start = addDaysToDateKey(todayKey, mondayOffset)
  const end = addDaysToDateKey(start, 6)

  return { start, end }
}

export function getReportDateRange(
  preset: ReportFilterPreset,
  reference = new Date(),
  customStart?: string,
  customEnd?: string,
): ReportDateRange {
  const todayKey = getTurkeyDateKey(reference)

  if (preset === 'today') {
    return { start: todayKey, end: todayKey, label: 'Bugün' }
  }

  if (preset === 'week') {
    const { start, end } = getWeekDateRange(reference)
    return { start, end, label: 'Bu Hafta' }
  }

  if (preset === 'month') {
    const { start, end } = getTurkeyMonthDateRange(reference)
    return { start, end, label: 'Bu Ay' }
  }

  if (preset === 'season') {
    const year = getActiveSeasonYear(reference)
    const { start, end } = getSeasonDateRange(year)
    return { start, end, label: `Sezon ${year}` }
  }

  const start = customStart && customEnd && customStart <= customEnd ? customStart : todayKey
  const end = customStart && customEnd && customStart <= customEnd ? customEnd : todayKey

  return {
    start,
    end,
    label: `${start.split('-').reverse().join('.')} – ${end.split('-').reverse().join('.')}`,
  }
}

export function reservationOverlapsRange(
  girisTarihi: string,
  cikisTarihi: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  return girisTarihi <= rangeEnd && cikisTarihi >= rangeStart
}

export function expenseInRange(tarih: string, rangeStart: string, rangeEnd: string): boolean {
  return tarih >= rangeStart && tarih <= rangeEnd
}

export function countDaysInRange(rangeStart: string, rangeEnd: string): number {
  if (rangeEnd < rangeStart) {
    return 0
  }

  const start = parseTurkeyDateKey(rangeStart)
  const end = parseTurkeyDateKey(rangeEnd)
  const diffMs = end.getTime() - start.getTime()

  return Math.floor(diffMs / 86_400_000) + 1
}

export function clampRangeStart(giris: string, rangeStart: string): string {
  return compareDateKeys(giris, rangeStart) > 0 ? giris : rangeStart
}

export function clampRangeEnd(cikis: string, rangeEnd: string): string {
  return compareDateKeys(cikis, rangeEnd) < 0 ? cikis : rangeEnd
}
