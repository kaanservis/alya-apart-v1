import { formatTurkeyDateKey } from '../lib/turkeyDate'
import { ReservationCariHesapSection } from '../reservations/ReservationCariHesapSection'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { getRemainingBalance } from '../reservations/depositCalculations'
import type { ReservationSelection } from './types'

interface ReservationDetailsPanelProps {
  selection: ReservationSelection
  onClose: () => void
  onUpdated?: () => void
}

function formatDate(value: string) {
  return formatTurkeyDateKey(value)
}

export function ReservationDetailsPanel({
  selection,
  onClose,
  onUpdated,
}: ReservationDetailsPanelProps) {
  const { reservation, unit } = selection

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-details-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Rezervasyon Detayı</p>
            <h3 id="reservation-details-title" className="mt-1 text-xl font-semibold text-slate-900">
              {reservation.ad_soyad}
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

        <dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Oda</dt>
            <dd className="font-medium text-slate-900">{unit.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Telefon</dt>
            <dd className="font-medium text-slate-900">{reservation.telefon}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Kişi Sayısı</dt>
            <dd className="font-medium text-slate-900">{reservation.kisi_sayisi}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Durum</dt>
            <dd className="font-medium text-slate-900">{reservation.durum}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Giriş Tarihi</dt>
            <dd className="font-medium text-slate-900">{formatDate(reservation.giris_tarihi)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Çıkış Tarihi</dt>
            <dd className="font-medium text-slate-900">{formatDate(reservation.cikis_tarihi)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Not</dt>
            <dd className="font-medium text-slate-900">{reservation.notlar ?? '—'}</dd>
          </div>
        </dl>

        <section className="mt-5">
          <ReservationCariHesapSection
            reservation={reservation}
            sectionTitle=""
            showTopSummary={false}
            onUpdated={() => onUpdated?.()}
          />
        </section>

        <section className="mt-5 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 p-4">
          <WhatsAppGuestActions
            phone={reservation.telefon}
            adSoyad={reservation.ad_soyad}
            kalanBakiye={getRemainingBalance(reservation)}
          />
        </section>

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
