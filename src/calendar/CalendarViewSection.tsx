import { useMemo, useState } from 'react'
import {
  buildCalendarExportEntries,
  exportCalendarExcel,
  exportCalendarPdf,
} from './calendarExportData'
import { CalendarGrid } from './CalendarGrid'
import { CalendarLegend } from './CalendarLegend'
import { CalendarToolbar } from './CalendarToolbar'
import {
  clampDate,
  formatPeriodLabel,
  getActiveSeasonYear,
  getSeasonBounds,
  getTurkeyToday,
  getVisibleDates,
  shiftAnchorDate,
} from './dateUtils'
import { ReservationDetailsPanel } from './ReservationDetailsPanel'
import type { CalendarInteraction, CalendarViewState } from './types'
import type { AccommodationUnit, Reservation } from '../types/database'
import { WorkflowCalendarLegend } from '../workflow/WorkflowCalendarLegend'

interface CalendarViewSectionProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  seasonYear: number
  loading?: boolean
  error?: string | null
}

export function CalendarViewSection({
  units,
  reservations,
  seasonYear,
  loading = false,
  error = null,
}: CalendarViewSectionProps) {
  const [viewState, setViewState] = useState<CalendarViewState>(() => {
    const today = getTurkeyToday()
    const { start, end } = getSeasonBounds(seasonYear)

    return {
      zoom: 'month',
      anchorDate: clampDate(today, start, end),
      seasonYear,
    }
  })
  const [interaction, setInteraction] = useState<CalendarInteraction | null>(null)

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.durum === 'Aktif'),
    [reservations],
  )

  const visibleDates = useMemo(
    () => getVisibleDates(viewState.zoom, viewState.anchorDate, viewState.seasonYear),
    [viewState.zoom, viewState.anchorDate, viewState.seasonYear],
  )

  const periodLabel = useMemo(
    () => formatPeriodLabel(viewState.zoom, viewState.anchorDate, viewState.seasonYear),
    [viewState.zoom, viewState.anchorDate, viewState.seasonYear],
  )

  const calendarExportEntries = useMemo(
    () => buildCalendarExportEntries(units, activeReservations, visibleDates),
    [units, activeReservations, visibleDates],
  )

  function handleZoomChange(zoom: CalendarViewState['zoom']) {
    setViewState((current) => ({ ...current, zoom }))
  }

  function handleNavigate(direction: -1 | 1) {
    setViewState((current) => ({
      ...current,
      anchorDate: shiftAnchorDate(
        current.zoom,
        current.anchorDate,
        direction,
        current.seasonYear,
      ),
    }))
  }

  function handleToday() {
    const today = getTurkeyToday()
    const activeSeasonYear = getActiveSeasonYear(today)
    const { start, end } = getSeasonBounds(activeSeasonYear)

    setViewState({
      zoom: viewState.zoom,
      anchorDate: clampDate(today, start, end),
      seasonYear: activeSeasonYear,
    })
  }

  function handleSeasonYearChange(year: number) {
    const { start, end } = getSeasonBounds(year)
    setViewState((current) => ({
      ...current,
      seasonYear: year,
      anchorDate: clampDate(current.anchorDate, start, end),
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || calendarExportEntries.length === 0}
          onClick={() => exportCalendarPdf(calendarExportEntries, periodLabel)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          PDF Dışa Aktar
        </button>
        <button
          type="button"
          disabled={loading || calendarExportEntries.length === 0}
          onClick={() => exportCalendarExcel(calendarExportEntries, periodLabel)}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Excel Dışa Aktar
        </button>
      </div>

      <CalendarToolbar
        viewState={viewState}
        onZoomChange={handleZoomChange}
        onNavigate={handleNavigate}
        onToday={handleToday}
        onSeasonYearChange={handleSeasonYearChange}
      />

      {viewState.zoom === 'season' ? <WorkflowCalendarLegend show /> : <CalendarLegend />}

      {loading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Takvim verileri yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          {error}
        </div>
      )}

      {!loading && units.length > 0 && (
        <CalendarGrid
          units={units}
          reservations={activeReservations}
          visibleDates={visibleDates}
          zoom={viewState.zoom}
          onEmptyCellClick={() => {
            setInteraction(null)
          }}
          onReservationClick={(reservation, unit) => {
            setInteraction({ type: 'details', reservation, unit })
          }}
        />
      )}

      {!loading && units.length === 0 && !error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Oda bulunamadı. Önce oda kayıtlarını Supabase&apos;e ekleyin.
        </div>
      )}

      {interaction?.type === 'details' && (
        <ReservationDetailsPanel selection={interaction} onClose={() => setInteraction(null)} />
      )}
    </div>
  )
}
