import type { PaymentHistoryEntry } from './types'
import { formatCurrency, formatDate } from './cashCalculations'

interface PaymentHistorySectionProps {
  entries: PaymentHistoryEntry[]
}

export function PaymentHistorySection({ entries }: PaymentHistorySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Tahsilat Geçmişi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rezervasyon ödemeleri güncellendiğinde tahsilat kayıtları otomatik oluşur.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">
          Bu filtre için tahsilat kaydı bulunamadı.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">Misafir Adı</th>
                <th className="px-4 py-3 font-semibold">Oda</th>
                <th className="px-4 py-3 font-semibold">Tutar</th>
                <th className="px-4 py-3 font-semibold">Not</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-slate-700">{formatDate(entry.paymentDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.guestName}</td>
                  <td className="px-4 py-3 text-slate-700">{entry.unitName}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{entry.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
