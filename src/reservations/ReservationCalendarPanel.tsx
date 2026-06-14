import { useMemo, useState } from 'react'
import {
  buildCalendarExportEntries,
  exportCalendarExcel,
  exportCalendarPdf,
} from '../calendar/calendarExportData'
import { CalendarGrid } from '../calendar/CalendarGrid'
import { CalendarToolbar } from '../calendar/CalendarToolbar'
import {
  clampDate,
  formatPeriodLabel,
  getActiveSeasonYear,
  getSeasonBounds,
  getTurkeyToday,
  getVisibleDates,
  shiftAnchorDate,
} from '../calendar/dateUtils'
import type { CalendarViewState } from '../calendar/types'
import type { AccommodationUnit, Reservation } from '../types/database'
import { openCreateFromCalendarSelection } from './formState'
import { ReservationFormPanel } from './ReservationFormPanel'
import { WorkflowCalendarLegend } from '../workflow/WorkflowCalendarLegend'

interface FormPanelState {
  mode: 'create' | 'edit'
  initialUnitId?: string
  initialCheckIn?: string
  initialCheckOut?: string
  editReservation?: Reservation
}

interface ReservationCalendarPanelProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  seasonYear: number
  onUpdated: () => void
  loading?: boolean
  error?: string | null
}

export function ReservationCalendarPanel({
  units,
  reservations,
  seasonYear,
  onUpdated,
  loading = false,
  error = null,
}: ReservationCalendarPanelProps) {
  const [viewState, setViewState] = useState<CalendarViewState>(() => {
    const today = getTurkeyToday()

    return {
      zoom: 'month',
      anchorDate: today,
      seasonYear,
    }
  })
  const [formPanel, setFormPanel] = useState<FormPanelState | null>(null)
  const [formKey, setFormKey] = useState(0)

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

  function handleSaved() {
    onUpdated()
    setFormPanel(null)
    setFormKey((current) => current + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || calendarExportEntries.length === 0}
            onClick={() => void exportCalendarPdf(calendarExportEntries, periodLabel)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            PDF Export
          </button>
          <button
            type="button"
            disabled={loading || calendarExportEntries.length === 0}
            onClick={() => exportCalendarExcel(calendarExportEntries, periodLabel)}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Excel Export
          </button>
        </div>

        <button
          type="button"
          disabled={loading || units.length === 0}
          onClick={() => setFormPanel({ mode: 'create' })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-700/25 transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
        >
          + Yeni Rezervasyon
        </button>
      </div>

      {formPanel && units.length > 0 && (
        <ReservationFormPanel
          key={`${formKey}-${formPanel.mode}-${formPanel.editReservation?.id ?? 'new'}`}
          units={units}
          reservations={reservations}
          mode={formPanel.mode}
          editReservation={formPanel.editReservation}
          initialUnitId={formPanel.initialUnitId}
          initialCheckIn={formPanel.initialCheckIn}
          initialCheckOut={formPanel.initialCheckOut}
          onSaved={handleSaved}
          onCancel={() => setFormPanel(null)}
        />
      )}

      <CalendarToolbar
        viewState={viewState}
        onZoomChange={handleZoomChange}
        onNavigate={handleNavigate}
        onToday={handleToday}
        onSeasonYearChange={handleSeasonYearChange}
      />

      <WorkflowCalendarLegend show={viewState.zoom === 'season'} />

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
          onEmptyCellClick={(unit, date) => {
            setFormPanel({ mode: 'create', ...openCreateFromCalendarSelection(unit, date) })
          }}
          onReservationClick={(reservation, _unit) => {
            setFormPanel({ mode: 'edit', editReservation: reservation })
          }}
        />
      )}

      {!loading && units.length === 0 && !error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Oda bulunamadı. Önce oda kayıtlarını Supabase&apos;e ekleyin.
        </div>
      )}
    </div>
  )
}
