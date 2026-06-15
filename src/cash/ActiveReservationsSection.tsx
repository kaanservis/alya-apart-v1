import type { ActiveReservationRow } from './types'
import { useAuth } from '../auth/AuthContext'
import {
  adminMobileCard,
  adminMobileCardLabel,
  adminMobileCardList,
  adminMobileCardValue,
  adminSectionCard,
  adminSectionTitle,
} from '../components/admin/adminMobileStyles'
import { formatCurrency, formatDate } from './cashCalculations'

interface ActiveReservationsSectionProps {
  rows: ActiveReservationRow[]
}

export function ActiveReservationsSection({ rows }: ActiveReservationsSectionProps) {
  const { hasPermission } = useAuth()
  const canViewPrices = hasPermission('can_view_prices')

  return (
    <section className={adminSectionCard}>
      <div className="border-b border-slate-200 px-3 py-3 max-md:py-2.5 sm:px-5 sm:py-4">
        <h2 className={adminSectionTitle}>Aktif Rezervasyonlar</h2>
        <p className="mt-0.5 text-xs text-slate-500 max-md:text-[11px] sm:mt-1 sm:text-sm">
          Seçilen filtreye göre aktif rezervasyonların ödeme durumu.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-3 py-6 text-xs text-slate-500 max-md:py-5 sm:px-5 sm:py-8 sm:text-sm">
          Bu filtre için aktif rezervasyon bulunamadı.
        </p>
      ) : (
        <>
          <div className={adminMobileCardList}>
            {rows.map((row) => (
              <div key={row.id} className={adminMobileCard}>
                <p className="truncate text-sm font-bold text-slate-900">{row.guestName}</p>
                <p className="mt-0.5 text-xs font-medium text-blue-800">{row.unitName}</p>
                <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <dt className={adminMobileCardLabel}>Giriş</dt>
                    <dd className="text-xs text-slate-800">{formatDate(row.girisTarihi)}</dd>
                  </div>
                  <div>
                    <dt className={adminMobileCardLabel}>Çıkış</dt>
                    <dd className="text-xs text-slate-800">{formatDate(row.cikisTarihi)}</dd>
                  </div>
                  <div>
                    <dt className={adminMobileCardLabel}>Toplam</dt>
                    <dd className={adminMobileCardValue}>
                      {formatCurrency(row.toplamUcret, canViewPrices)}
                    </dd>
                  </div>
                  <div>
                    <dt className={adminMobileCardLabel}>Alınan</dt>
                    <dd className="text-xs font-semibold text-emerald-700">
                      {formatCurrency(row.alinanUcret, canViewPrices)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className={adminMobileCardLabel}>Kalan</dt>
                    <dd className="text-xs font-semibold text-amber-700">
                      {formatCurrency(row.kalanBakiye, canViewPrices)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                    <td className="px-4 py-3 text-slate-900">
                      {formatCurrency(row.toplamUcret, canViewPrices)}
                    </td>
                    <td className="px-4 py-3 text-emerald-700">
                      {formatCurrency(row.alinanUcret, canViewPrices)}
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-700">
                      {formatCurrency(row.kalanBakiye, canViewPrices)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
