import { useMemo, useState } from 'react'
import { CalendarGrid } from './CalendarGrid'
import { CalendarLegend } from './CalendarLegend'
import { CalendarToolbar } from './CalendarToolbar'
import { CreateReservationPanel } from './CreateReservationPanel'
import { ReservationDetailsPanel } from './ReservationDetailsPanel'
import {
  clampDate,
  getActiveSeasonYear,
  getSeasonBounds,
  getTurkeyToday,
  getVisibleDates,
  shiftAnchorDate,
} from './dateUtils'
import type { CalendarInteraction, CalendarViewState } from './types'
import { useCalendarData } from './useCalendarData'

export function CalendarPage() {
  const [viewState, setViewState] = useState<CalendarViewState>(() => {
    const today = getTurkeyToday()
    const seasonYear = getActiveSeasonYear(today)
    const { start, end } = getSeasonBounds(seasonYear)

    return {
      zoom: 'month',
      anchorDate: clampDate(today, start, end),
      seasonYear,
    }
  })
  const [interaction, setInteraction] = useState<CalendarInteraction | null>(null)

  const { units, reservations, loading, error } = useCalendarData(viewState.seasonYear)

  const visibleDates = useMemo(
    () => getVisibleDates(viewState.zoom, viewState.anchorDate, viewState.seasonYear),
    [viewState.zoom, viewState.anchorDate, viewState.seasonYear],
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
    const seasonYear = getActiveSeasonYear(today)
    const { start, end } = getSeasonBounds(seasonYear)

    setViewState({
      zoom: viewState.zoom,
      anchorDate: clampDate(today, start, end),
      seasonYear,
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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-500">Faz 2 · Takvim</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            ALYA APART TAKİP SİSTEMİ
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Odaları dikey, tarihleri yatay görünümde takip edin. Sezon aralığı: 15
            Mayıs – 15 Eylül.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <CalendarToolbar
          viewState={viewState}
          onZoomChange={handleZoomChange}
          onNavigate={handleNavigate}
          onToday={handleToday}
          onSeasonYearChange={handleSeasonYearChange}
        />

        <CalendarLegend />

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Takvim verileri yükleniyor...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!loading && units.length > 0 && (
          <CalendarGrid
            units={units}
            reservations={reservations}
            visibleDates={visibleDates}
            zoom={viewState.zoom}
            onEmptyCellClick={(unit, date) => {
              setInteraction({ type: 'create', unit, date })
            }}
            onReservationClick={(reservation, unit) => {
              setInteraction({ type: 'details', reservation, unit })
            }}
          />
        )}
      </main>

      {interaction?.type === 'create' && (
        <CreateReservationPanel
          selection={interaction}
          onClose={() => setInteraction(null)}
        />
      )}

      {interaction?.type === 'details' && (
        <ReservationDetailsPanel
          selection={interaction}
          onClose={() => setInteraction(null)}
        />
      )}
    </div>
  )
}
