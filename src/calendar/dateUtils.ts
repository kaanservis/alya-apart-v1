import {
  compareDateKeys,
  dateKeyFromCalendarDate,
  formatTurkeyInstant,
  getSeasonDateRange,
  getTurkeyDateKey,
  getTurkeyTodayCalendarDate,
  parseTurkeyDateKey,
  TURKEY_TIMEZONE,
} from '../lib/turkeyDate'
import type { CalendarZoomLevel } from './types'

export function startOfDay(date: Date): Date {
  return parseTurkeyDateKey(dateKeyFromCalendarDate(date))
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function toDateKey(date: Date): string {
  return dateKeyFromCalendarDate(date)
}

export function parseDateKey(value: string): Date {
  return parseTurkeyDateKey(value)
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKeyFromCalendarDate(a) === dateKeyFromCalendarDate(b)
}

export function getSeasonBounds(year: number): { start: Date; end: Date } {
  const range = getSeasonDateRange(year)
  return {
    start: parseTurkeyDateKey(range.start),
    end: parseTurkeyDateKey(range.end),
  }
}

export function getSeasonBoundsKeys(year: number): { start: string; end: string } {
  return getSeasonDateRange(year)
}

export function getActiveSeasonYear(reference = new Date()): number {
  const refKey = getTurkeyDateKey(reference)
  const year = Number(refKey.slice(0, 4))
  const { start, end } = getSeasonDateRange(year)

  if (compareDateKeys(refKey, start) < 0) {
    return year
  }

  if (compareDateKeys(refKey, end) > 0) {
    return year
  }

  return year
}

export function getTurkeyToday(): Date {
  return getTurkeyTodayCalendarDate()
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  const value = dateKeyFromCalendarDate(date)
  const minKey = dateKeyFromCalendarDate(min)
  const maxKey = dateKeyFromCalendarDate(max)

  if (compareDateKeys(value, minKey) < 0) {
    return min
  }

  if (compareDateKeys(value, maxKey) > 0) {
    return max
  }

  return date
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = []
  let current = startOfDay(start)
  const last = startOfDay(end)

  while (dateKeyFromCalendarDate(current) <= dateKeyFromCalendarDate(last)) {
    days.push(current)
    current = addDays(current, 1)
  }

  return days
}

function getWeekStart(date: Date): Date {
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(date, diff)
}

function getMonthStart(date: Date): Date {
  const key = dateKeyFromCalendarDate(date)
  const [year, month] = key.split('-').map(Number)
  return parseTurkeyDateKey(`${year}-${String(month).padStart(2, '0')}-01`)
}

function getMonthEnd(date: Date): Date {
  const key = dateKeyFromCalendarDate(date)
  const [year, month] = key.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0, 12, 0, 0)).getUTCDate()
  return parseTurkeyDateKey(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
}

export function getVisibleDates(
  zoom: CalendarZoomLevel,
  anchorDate: Date,
  seasonYear: number,
): Date[] {
  const { start: seasonStart, end: seasonEnd } = getSeasonBounds(seasonYear)
  const anchor = clampDate(startOfDay(anchorDate), seasonStart, seasonEnd)

  switch (zoom) {
    case 'season':
      return eachDay(seasonStart, seasonEnd)
    case 'month': {
      const monthStart = clampDate(getMonthStart(anchor), seasonStart, seasonEnd)
      const monthEnd = clampDate(getMonthEnd(anchor), seasonStart, seasonEnd)
      return eachDay(monthStart, monthEnd)
    }
    case 'week': {
      const weekStart = clampDate(getWeekStart(anchor), seasonStart, seasonEnd)
      const weekEnd = clampDate(addDays(weekStart, 6), seasonStart, seasonEnd)
      return eachDay(weekStart, weekEnd)
    }
    case 'day':
      return [anchor]
  }
}

export function shiftAnchorDate(
  zoom: CalendarZoomLevel,
  anchorDate: Date,
  direction: -1 | 1,
  seasonYear: number,
): Date {
  const { start: seasonStart, end: seasonEnd } = getSeasonBounds(seasonYear)

  switch (zoom) {
    case 'season': {
      const newYear = seasonYear + direction
      return parseTurkeyDateKey(`${newYear}-05-15`)
    }
    case 'month': {
      const anchorKey = dateKeyFromCalendarDate(anchorDate)
      const [year, month] = anchorKey.split('-').map(Number)
      const nextMonth = month + direction
      const nextDate = new Date(Date.UTC(year, nextMonth - 1, 1, 12, 0, 0))
      return clampDate(nextDate, seasonStart, seasonEnd)
    }
    case 'week':
      return clampDate(addDays(anchorDate, direction * 7), seasonStart, seasonEnd)
    case 'day':
      return clampDate(addDays(anchorDate, direction), seasonStart, seasonEnd)
  }
}

export function formatHeaderDate(date: Date, zoom: CalendarZoomLevel): string {
  if (zoom === 'day') {
    return formatTurkeyInstant(date, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (zoom === 'week' || zoom === 'season') {
    return formatTurkeyInstant(date, {
      day: 'numeric',
      month: 'short',
    })
  }

  return String(parseTurkeyDateKey(dateKeyFromCalendarDate(date)).getUTCDate())
}

export function formatPeriodLabel(
  zoom: CalendarZoomLevel,
  anchorDate: Date,
  seasonYear: number,
): string {
  const { start, end } = getSeasonDateRange(seasonYear)

  switch (zoom) {
    case 'season':
      return `15 Mayıs ${seasonYear} – 15 Eylül ${seasonYear}`
    case 'month':
      return formatTurkeyInstant(anchorDate, {
        month: 'long',
        year: 'numeric',
      })
    case 'week': {
      const dates = getVisibleDates('week', anchorDate, seasonYear)
      const first = dates[0]
      const last = dates[dates.length - 1]
      const firstLabel = formatTurkeyInstant(first, {
        day: 'numeric',
        month: 'long',
      })
      const lastLabel = formatTurkeyInstant(last, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      return `${firstLabel} – ${lastLabel}`
    }
    case 'day':
      return formatTurkeyInstant(anchorDate, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    default:
      return `${formatTurkeyInstant(parseTurkeyDateKey(start), { dateStyle: 'short' })} – ${formatTurkeyInstant(parseTurkeyDateKey(end), { dateStyle: 'short' })}`
  }
}

export function isDateWithinSeason(date: Date, seasonYear: number): boolean {
  const { start, end } = getSeasonDateRange(seasonYear)
  const value = dateKeyFromCalendarDate(date)
  return compareDateKeys(value, start) >= 0 && compareDateKeys(value, end) <= 0
}

export function reservationOverlapsRange(
  girisTarihi: string,
  cikisTarihi: string,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const startKey = girisTarihi
  const endKey = cikisTarihi
  const rangeStartKey = dateKeyFromCalendarDate(rangeStart)
  const rangeEndKey = dateKeyFromCalendarDate(rangeEnd)
  return compareDateKeys(startKey, rangeEndKey) <= 0 && compareDateKeys(endKey, rangeStartKey) >= 0
}

export { TURKEY_TIMEZONE, getTurkeyDateKey, getTurkeyTodayCalendarDate }
