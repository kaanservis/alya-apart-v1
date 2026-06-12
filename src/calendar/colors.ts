import type { CalendarCellState } from './types'

export const CALENDAR_CELL_STYLES: Record<CalendarCellState, string> = {
  available:
    'bg-blue-50/80 hover:bg-blue-100 border-blue-100 cursor-pointer',
  occupied: 'bg-rose-100/90 hover:bg-rose-200/90 border-rose-200 cursor-default',
  checkout: 'bg-amber-100/90 hover:bg-amber-200/90 border-amber-200 cursor-default',
  cleaning: 'bg-orange-100/90 hover:bg-orange-200/90 border-orange-200 cursor-default',
}

export const CALENDAR_BAR_STYLES: Record<CalendarCellState, string> = {
  available:
    'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30',
  occupied:
    'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/30',
  checkout:
    'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-amber-500/30',
  cleaning:
    'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 shadow-orange-500/30',
}

export const CALENDAR_LEGEND: { state: CalendarCellState; label: string }[] = [
  { state: 'available', label: 'Müsait' },
  { state: 'occupied', label: 'Dolu' },
  { state: 'checkout', label: 'Çıkış Bekliyor' },
  { state: 'cleaning', label: 'Temizlik Bekliyor' },
]
