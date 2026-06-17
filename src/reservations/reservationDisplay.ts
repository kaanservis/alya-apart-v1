import { formatTurkeyDateKey } from '../lib/turkeyDate'

export function formatReservationDate(value: string) {
  return formatTurkeyDateKey(value)
}

export function formatReservationShortDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${day}.${month}.${year}`
}
