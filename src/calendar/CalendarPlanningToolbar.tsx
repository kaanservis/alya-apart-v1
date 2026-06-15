import {
  adminActionBtnDanger,
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'

interface CalendarPlanningToolbarProps {
  pendingCount: number
  canUndo: boolean
  saving: boolean
  onSave: () => void
  onUndo: () => void
  onCancelAll: () => void
}

export function CalendarPlanningToolbar({
  pendingCount,
  canUndo,
  saving,
  onSave,
  onUndo,
  onCancelAll,
}: CalendarPlanningToolbarProps) {
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/95 p-3 shadow-sm backdrop-blur-sm max-md:p-2.5">
      <span className="inline-flex items-center rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-950 max-md:text-[10px]">
        {pendingCount} Bekleyen Değişiklik
      </span>

      <div className="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendingCount === 0 || saving}
          onClick={onSave}
          className={`${adminActionBtnPrimary} disabled:opacity-50`}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button
          type="button"
          disabled={!canUndo || saving}
          onClick={onUndo}
          className={`${adminActionBtnSecondary} disabled:opacity-50`}
        >
          Geri Al
        </button>
        <button
          type="button"
          disabled={pendingCount === 0 || saving}
          onClick={onCancelAll}
          className={`${adminActionBtnDanger} disabled:opacity-50`}
        >
          Tümünü İptal Et
        </button>
      </div>
    </div>
  )
}
