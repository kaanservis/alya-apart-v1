import type { Reservation } from '../types/database'
import { CALENDAR_BAR_STYLES } from './colors'
import type { CalendarZoomLevel, ReservationSegment } from './types'

interface ReservationBarProps {
  segment: ReservationSegment
  dayWidth: number
  rowHeight: number
  zoom: CalendarZoomLevel
  onSelect: (reservation: Reservation) => void
}

export function ReservationBar({
  segment,
  dayWidth,
  rowHeight,
  zoom,
  onSelect,
}: ReservationBarProps) {
  const left = segment.startIndex * dayWidth + 4
  const width = segment.span * dayWidth - 8
  const top = 7
  const height = rowHeight - 14

  return (
    <button
      type="button"
      aria-label={`${segment.reservation.ad_soyad} rezervasyonu`}
      className={`absolute z-10 overflow-hidden rounded-lg border border-white/20 px-2.5 text-left text-white shadow-md transition-all duration-150 hover:scale-[1.02] hover:shadow-lg ${CALENDAR_BAR_STYLES[segment.color]}`}
      style={{ left, width, top, height }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(segment.reservation)
      }}
    >
      {zoom !== 'season' && (
        <span className="block truncate text-xs font-bold leading-tight">
          {segment.reservation.ad_soyad}
        </span>
      )}
      {zoom === 'week' || zoom === 'day' ? (
        <span className="block truncate text-[10px] font-medium text-white/90">
          {segment.reservation.kisi_sayisi} kişi
        </span>
      ) : null}
    </button>
  )
}
