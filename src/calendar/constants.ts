import type { CalendarZoomLevel } from './types'

export const CALENDAR_ZOOM_LEVELS: { value: CalendarZoomLevel; label: string }[] = [
  { value: 'month', label: 'Aylık' },
  { value: 'week', label: 'Haftalık' },
  { value: 'day', label: 'Günlük' },
  { value: 'season', label: 'Sezonluk' },
]

export const SEASON_START_MONTH = 4
export const SEASON_START_DAY = 15
export const SEASON_END_MONTH = 8
export const SEASON_END_DAY = 15

export const UNIT_LABEL_WIDTH = 128

export const DAY_WIDTH: Record<CalendarZoomLevel, number> = {
  season: 10,
  month: 34,
  week: 96,
  day: 480,
}

export const ROW_HEIGHT: Record<CalendarZoomLevel, number> = {
  season: 36,
  month: 44,
  week: 52,
  day: 64,
}
