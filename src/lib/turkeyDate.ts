export const TURKEY_TIMEZONE = 'Europe/Istanbul'

const turkeyDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TURKEY_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getTurkeyDateKey(date: Date = new Date()): string {
  return turkeyDateKeyFormatter.format(date)
}

export function getTurkeyDateParts(date: Date = new Date()) {
  const [year, month, day] = getTurkeyDateKey(date).split('-').map(Number)
  return { year, month, day }
}

export function parseTurkeyDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function dateKeyFromCalendarDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTurkeyTodayCalendarDate(): Date {
  return parseTurkeyDateKey(getTurkeyDateKey())
}

export function getSeasonDateRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-05-15`,
    end: `${year}-09-15`,
  }
}

export function getTurkeyMonthDateRange(reference: Date = new Date()): { start: string; end: string } {
  const { year, month } = getTurkeyDateParts(reference)
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year, month, 0, 12, 0, 0)).getUTCDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b)
}

export function formatTurkeyDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  return new Intl.DateTimeFormat('tr-TR', {
    ...options,
    timeZone: TURKEY_TIMEZONE,
  }).format(parseTurkeyDateKey(dateKey))
}

export function formatTurkeyInstant(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat('tr-TR', {
    ...options,
    timeZone: TURKEY_TIMEZONE,
  }).format(date)
}
