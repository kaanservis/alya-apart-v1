import type { AccommodationUnit, Reservation } from '../types/database'

export type CalendarZoomLevel = 'season' | 'month' | 'week' | 'day'

export type CalendarCellState = 'available' | 'occupied' | 'checkout' | 'cleaning'

export interface CalendarViewState {
  zoom: CalendarZoomLevel
  anchorDate: Date
  seasonYear: number
}

export interface CalendarSelection {
  type: 'create'
  unit: AccommodationUnit
  date: Date
}

export interface ReservationSelection {
  type: 'details'
  reservation: Reservation
  unit: AccommodationUnit
}

export type CalendarInteraction = CalendarSelection | ReservationSelection

export interface ReservationSegment {
  reservation: Reservation
  startIndex: number
  span: number
  color: CalendarCellState
}

export interface CalendarUnitRowData {
  unit: AccommodationUnit
  segments: ReservationSegment[]
}
