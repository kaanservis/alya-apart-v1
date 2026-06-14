import type { ActiveReservationRow } from './types'
import { formatCurrency, formatDate } from './cashCalculations'

interface ActiveReservationsSectionProps {
  rows: ActiveReservationRow[]
}

export function ActiveReservationsSection({ rows }: ActiveReservationsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Aktif Rezervasyonlar</h2>
        <p className="mt-1 text-sm text-slate-500">
          Seçilen filtreye göre aktif rezervasyonların ödeme durumu.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">
          Bu filtre için aktif rezervasyon bulunamadı.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Misafir Adı</th>
                <th className="px-4 py-3 font-semibold">Oda</th>
                <th className="px-4 py-3 font-semibold">Giriş</th>
                <th className="px-4 py-3 font-semibold">Çıkış</th>
                <th className="px-4 py-3 font-semibold">Toplam Ücret</th>
                <th className="px-4 py-3 font-semibold">Alınan Ücret</th>
                <th className="px-4 py-3 font-semibold">Kalan Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.guestName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.unitName}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(row.girisTarihi)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(row.cikisTarihi)}</td>
                  <td className="px-4 py-3 text-slate-900">{formatCurrency(row.toplamUcret)}</td>
                  <td className="px-4 py-3 text-emerald-700">{formatCurrency(row.alinanUcret)}</td>
                  <td className="px-4 py-3 font-medium text-amber-700">
                    {formatCurrency(row.kalanBakiye)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
