import {
  adminActionBtnPrimary,
  adminActionBtnSecondary,
} from '../components/admin/adminMobileStyles'
import {
  formatRoomMoveConfirmMessage,
  type CalendarPendingChange,
} from './calendarPlanningUtils'

interface CalendarSaveConfirmDialogProps {
  step: 1 | 2
  changes: CalendarPendingChange[]
  unitMap: Map<string, string>
  processing: boolean
  onCancel: () => void
  onContinue: () => void
  onConfirmSave: () => void
}

export function CalendarSaveConfirmDialog({
  step,
  changes,
  unitMap,
  processing,
  onCancel,
  onContinue,
  onConfirmSave,
}: CalendarSaveConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-md:p-4"
      >
        {step === 1 ? (
          <>
            <h3 className="text-lg font-bold text-slate-900">Yapılacak Oda Değişiklikleri</h3>
            <div className="mt-4 space-y-4">
              {changes.map((change) => (
                <div
                  key={change.reservationId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-800"
                >
                  {formatRoomMoveConfirmMessage(change, unitMap)}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onCancel} className={adminActionBtnSecondary}>
                İptal
              </button>
              <button type="button" onClick={onContinue} className={adminActionBtnPrimary}>
                Devam Et
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-900">Son Onay</h3>
            <div className="mt-4 space-y-4">
              {changes.length === 1 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-800">
                  {formatRoomMoveConfirmMessage(changes[0], unitMap)}
                </p>
              ) : (
                changes.map((change) => (
                  <div
                    key={change.reservationId}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-800"
                  >
                    {formatRoomMoveConfirmMessage(change, unitMap)}
                  </div>
                ))
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              Bu işlem veritabanına kaydedilecektir. Onaylıyor musunuz?
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={onCancel}
                className={adminActionBtnSecondary}
              >
                Hayır
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={onConfirmSave}
                className={adminActionBtnPrimary}
              >
                {processing ? 'Kaydediliyor...' : 'Evet, Kaydet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
