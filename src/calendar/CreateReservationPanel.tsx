import type { CalendarSelection } from './types'
import { formatHeaderDate } from './dateUtils'

interface CreateReservationPanelProps {
  selection: CalendarSelection
  onClose: () => void
}

export function CreateReservationPanel({ selection, onClose }: CreateReservationPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-reservation-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Rezervasyon Oluştur</p>
            <h3 id="create-reservation-title" className="mt-1 text-xl font-semibold text-slate-900">
              Yeni Rezervasyon
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Oda:</span>{' '}
            {selection.unit.name}
          </p>
          <p>
            <span className="font-medium text-slate-900">Seçilen Tarih:</span>{' '}
            {formatHeaderDate(selection.date, 'day')}
          </p>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Rezervasyon formu sonraki fazda eklenecek. Bu panel, boş alana tıklama altyapısını
          doğrulamak için hazırlandı.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}
