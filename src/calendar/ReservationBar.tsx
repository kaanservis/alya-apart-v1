import { useCallback, useEffect, useRef, useState } from 'react'
import type { Reservation } from '../types/database'
import {
  CALENDAR_BAR_PAST_STYLE,
  CALENDAR_BAR_PENDING_STYLE,
  CALENDAR_BAR_STYLES,
} from './colors'
import { isReservationReadOnly } from './calendarPlanningUtils'
import { ReservationPreviewCard } from './ReservationPreviewCard'
import type { CalendarZoomLevel, ReservationSegment } from './types'

interface ReservationBarProps {
  segment: ReservationSegment
  unitName: string
  dayWidth: number
  rowHeight: number
  zoom: CalendarZoomLevel
  isPending?: boolean
  isDragging?: boolean
  planningEnabled?: boolean
  onSelect: (reservation: Reservation) => void
  onDragStart?: (reservation: Reservation, pointerId: number) => void
}

function usePrefersHoverPreview() {
  const [prefersHover, setPrefersHover] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  })

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')

    function handleChange(event: MediaQueryListEvent) {
      setPrefersHover(event.matches)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return prefersHover
}

export function ReservationBar({
  segment,
  unitName,
  dayWidth,
  rowHeight,
  zoom,
  isPending = false,
  isDragging = false,
  planningEnabled = false,
  onSelect,
  onDragStart,
}: ReservationBarProps) {
  const prefersHover = usePrefersHoverPreview()
  const barRef = useRef<HTMLDivElement>(null)
  const dragMovedRef = useRef(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const isReadOnly = isReservationReadOnly(segment.reservation)
  const isDraggable = planningEnabled && !isReadOnly && Boolean(onDragStart)

  const left = segment.startIndex * dayWidth + 4
  const width = segment.span * dayWidth - 8
  const top = 7
  const height = rowHeight - 14

  const barStyle = isPending
    ? CALENDAR_BAR_PENDING_STYLE
    : isReadOnly
      ? CALENDAR_BAR_PAST_STYLE
      : CALENDAR_BAR_STYLES[segment.color]

  const openPreview = useCallback(() => {
    if (!barRef.current || isDragging) {
      return
    }

    setAnchorRect(barRef.current.getBoundingClientRect())
    setPreviewOpen(true)
  }, [isDragging])

  const closePreview = useCallback(() => {
    setPreviewOpen(false)
    setAnchorRect(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      closePreview()
    }
  }, [closePreview, isDragging])

  function handleDragStart(event: React.PointerEvent) {
    if (!isDraggable || !onDragStart) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    dragMovedRef.current = false
    onDragStart(segment.reservation, event.pointerId)
  }

  function handleBarPointerMove() {
    if (isDraggable) {
      dragMovedRef.current = true
    }
  }

  function handleBarClick(event: React.MouseEvent) {
    event.stopPropagation()

    if (prefersHover) {
      if (!isDraggable || !dragMovedRef.current) {
        onSelect(segment.reservation)
      }
      return
    }

    if (previewOpen) {
      closePreview()
      return
    }

    openPreview()
  }

  return (
    <>
      <div
        ref={barRef}
        className={`absolute z-10 ${
          isDragging ? 'pointer-events-none opacity-45' : 'pointer-events-auto opacity-100'
        }`}
        style={{ left, width, top, height }}
        onMouseEnter={() => {
          if (prefersHover) {
            openPreview()
          }
        }}
        onMouseLeave={() => {
          if (prefersHover) {
            closePreview()
          }
        }}
      >
        <button
          type="button"
          aria-label={`${segment.reservation.ad_soyad} rezervasyonu`}
          className={`relative h-full w-full overflow-hidden rounded-lg border border-white/20 px-2.5 text-left text-white shadow-md transition-all duration-150 hover:shadow-lg ${barStyle} ${
            isDraggable
              ? 'cursor-grab active:cursor-grabbing'
              : isReadOnly
                ? 'cursor-default'
                : 'hover:scale-[1.02]'
          }`}
          onClick={handleBarClick}
          onPointerMove={handleBarPointerMove}
          onPointerDown={(event) => {
            if (isDraggable && event.button === 0) {
              dragMovedRef.current = false
              handleDragStart(event)
            }
          }}
        >
          {isPending && (
            <span
              className="absolute right-1 top-1 text-[10px]"
              title="Kaydedilmedi"
              aria-label="Kaydedilmedi"
            >
              ⚠
            </span>
          )}
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
      </div>

      {previewOpen && anchorRect && (
        <ReservationPreviewCard
          reservation={segment.reservation}
          unitName={unitName}
          anchorRect={anchorRect}
          showBackdrop={!prefersHover}
          onClose={closePreview}
        />
      )}
    </>
  )
}
