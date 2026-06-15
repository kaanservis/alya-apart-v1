import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'
import type { AccommodationUnit, Reservation } from '../types/database'
import {
  buildCalendarExportEntries,
  exportCalendarExcel,
  exportCalendarPdf,
} from './calendarExportData'
import { CalendarGrid } from './CalendarGrid'
import { CalendarLegend } from './CalendarLegend'
import { CalendarPlanningToolbar } from './CalendarPlanningToolbar'
import { CalendarSaveConfirmDialog } from './CalendarSaveConfirmDialog'
import { CalendarToolbar } from './CalendarToolbar'
import { saveCalendarPlanningChanges } from './calendarPlanningService'
import { formatRoomMoveConflictMessage } from './calendarPlanningUtils'
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
import { useCalendarPlanning } from './useCalendarPlanning'
import { WorkflowCalendarLegend } from '../workflow/WorkflowCalendarLegend'

interface CalendarViewSectionProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  seasonYear: number
  loading?: boolean
  error?: string | null
  onUpdated?: () => void
  onSaveSuccess?: (message: string) => void
}

export function CalendarViewSection({
  units,
  reservations,
  seasonYear,
  loading = false,
  error = null,
  onUpdated,
  onSaveSuccess,
}: CalendarViewSectionProps) {
  const { user } = useAuth()
  const planningEnabled = Boolean(user && hasPermission(user, 'can_change_dates'))

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
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const draggableReservations = useMemo(
    () => reservations.filter((reservation) => reservation.durum === 'Aktif'),
    [reservations],
  )

  const planning = useCalendarPlanning(draggableReservations, units)

  const calendarReservations = useMemo(() => {
    const draggableIds = new Set(draggableReservations.map((reservation) => reservation.id))
    const readonlyReservations = reservations.filter((reservation) => !draggableIds.has(reservation.id))
    return [...planning.displayReservations, ...readonlyReservations]
  }, [reservations, draggableReservations, planning.displayReservations])

  const visibleDates = useMemo(
    () => getVisibleDates(viewState.zoom, viewState.anchorDate, viewState.seasonYear),
    [viewState.zoom, viewState.anchorDate, viewState.seasonYear],
  )

  const periodLabel = useMemo(
    () => formatPeriodLabel(viewState.zoom, viewState.anchorDate, viewState.seasonYear),
    [viewState.zoom, viewState.anchorDate, viewState.seasonYear],
  )

  const calendarExportEntries = useMemo(
    () => buildCalendarExportEntries(units, planning.displayReservations, visibleDates),
    [units, planning.displayReservations, visibleDates],
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

  function handleSaveClick() {
    setSaveError(null)

    if (planning.pendingCount === 0) {
      return
    }

    if (planning.conflicts.length > 0) {
      const first = planning.conflicts[0]
      setSaveError(
        formatRoomMoveConflictMessage(
          first.change.guestName,
          first.unitName,
          first.change.originalGirisTarihi,
          first.change.originalCikisTarihi,
          first.conflictReservation.ad_soyad,
        ),
      )
      return
    }

    setConfirmStep(1)
  }

  async function handleConfirmSave() {
    if (!user) {
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await saveCalendarPlanningChanges(planning.pendingChanges, user.username)
      planning.clearAfterSave()
      setConfirmStep(0)
      onUpdated?.()
      onSaveSuccess?.('Rezervasyon değişiklikleri başarıyla kaydedildi.')
    } catch (saveFailure) {
      setSaveError(
        saveFailure instanceof Error ? saveFailure.message : 'Değişiklikler kaydedilemedi.',
      )
      setConfirmStep(0)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {planningEnabled && (
        <CalendarPlanningToolbar
          pendingCount={planning.pendingCount}
          canUndo={planning.canUndo}
          saving={saving}
          onSave={handleSaveClick}
          onUndo={planning.undoLast}
          onCancelAll={planning.cancelAll}
        />
      )}

      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </div>
      )}

      {planning.dropError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {planning.dropError}
        </div>
      )}

      {planningEnabled && planning.pendingCount === 0 && (
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-900">
          Aktif rezervasyonları yukarı veya aşağı sürükleyerek yalnızca oda değiştirebilirsiniz. Giriş ve çıkış tarihleri değişmez. Geçmiş rezervasyonlar salt okunurdur. Değişiklikler kaydedilene kadar geçicidir.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || calendarExportEntries.length === 0}
          onClick={() => void exportCalendarPdf(calendarExportEntries, periodLabel)}
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
          reservations={calendarReservations}
          visibleDates={visibleDates}
          zoom={viewState.zoom}
          planningEnabled={planningEnabled}
          pendingReservationIds={planning.pendingReservationIds}
          draggingReservationId={planning.dragState?.reservationId ?? null}
          draggingOriginUnitId={planning.dragState?.originUnitId ?? null}
          dropTarget={planning.dropTarget}
          invalidDropTargetUnitId={planning.invalidDropTargetUnitId}
          onEmptyCellClick={() => setInteraction(null)}
          onReservationClick={(reservation, unit) => {
            if (!planning.dragState) {
              setInteraction({ type: 'details', reservation, unit })
            }
          }}
          onDragStart={(reservation, unitId, pointerId) => {
            planning.startDrag(reservation, unitId, 'move', pointerId)
          }}
          onDropTargetChange={planning.setDropTarget}
          onDragEnd={(reservation, _unitId, target) => {
            planning.endDrag({
              reservation,
              dropTarget: target,
            })
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

      {confirmStep > 0 && (
        <CalendarSaveConfirmDialog
          step={confirmStep as 1 | 2}
          changes={planning.pendingChanges}
          unitMap={planning.unitMap}
          processing={saving}
          onCancel={() => setConfirmStep(0)}
          onContinue={() => setConfirmStep(2)}
          onConfirmSave={() => void handleConfirmSave()}
        />
      )}
    </div>
  )
}
