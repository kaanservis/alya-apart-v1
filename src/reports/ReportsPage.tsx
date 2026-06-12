import { useMemo, useState } from 'react'
import {
  buildReportData,
  formatPercent,
  formatReportCurrency,
} from './reportCalculations'
import { exportReportExcel, exportReportPdf } from './reportExports'
import { ReportBarChart } from './ReportBarChart'
import {
  getReportDateRange,
  type ReportFilterPreset,
} from './reportDateRanges'
import { useReportsData } from './useReportsData'

interface ReportsPageProps {
  refreshToken: number
}

const FILTER_OPTIONS: { value: ReportFilterPreset; label: string }[] = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
  { value: 'season', label: 'Sezon' },
  { value: 'custom', label: 'Özel Tarih Aralığı' },
]

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
    </div>
  )
}

export function ReportsPage({ refreshToken }: ReportsPageProps) {
  const { units, reservations, expenses, loading, error } = useReportsData(refreshToken)
  const [preset, setPreset] = useState<ReportFilterPreset>('season')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range = useMemo(
    () => getReportDateRange(preset, new Date(), customStart, customEnd),
    [preset, customStart, customEnd],
  )

  const report = useMemo(
    () => buildReportData(units, reservations, expenses, range),
    [units, reservations, expenses, range],
  )

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm ring-1 ring-blue-50 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              İşletme Analizi
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Raporlar</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sezon ve dönemsel gelir, masraf ve doluluk istatistikleri.
            </p>
            <p className="mt-2 text-sm font-semibold text-blue-800">{range.label}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!report}
              onClick={() => report && exportReportPdf(report, range)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              PDF İndir
            </button>
            <button
              type="button"
              disabled={!report}
              onClick={() => report && exportReportExcel(report, range)}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Excel İndir
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPreset(option.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                preset === option.value
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Başlangıç</span>
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-600 focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Bitiş</span>
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-600 focus:ring-2"
              />
            </label>
          </div>
        )}
      </section>

      {loading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Raporlar yükleniyor...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              label="Toplam Gelir"
              value={formatReportCurrency(report.summary.toplamGelir)}
              accent="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
            />
            <SummaryCard
              label="Toplam Masraf"
              value={formatReportCurrency(report.summary.toplamMasraf)}
              accent="border-rose-200 bg-gradient-to-br from-rose-50 to-red-50"
            />
            <SummaryCard
              label="Net Kazanç"
              value={formatReportCurrency(report.summary.netKazanc)}
              accent="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
            />
            <SummaryCard
              label="Toplam Rezervasyon"
              value={String(report.summary.toplamRezervasyon)}
              accent="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50"
            />
            <SummaryCard
              label="Toplam Geceleme"
              value={String(report.summary.toplamGeceleme)}
              accent="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
            />
            <SummaryCard
              label="Ortalama Doluluk"
              value={formatPercent(report.summary.ortalamaDoluluk)}
              accent="border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Finansal Rapor</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-emerald-700">
                    Toplam Tahsilat
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">
                    {formatReportCurrency(report.financial.toplamTahsilat)}
                  </dd>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-amber-700">
                    Bekleyen Tahsilat
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">
                    {formatReportCurrency(report.financial.bekleyenTahsilat)}
                  </dd>
                </div>
                <div className="rounded-xl bg-rose-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-rose-700">
                    Toplam Masraf
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">
                    {formatReportCurrency(report.financial.toplamMasraf)}
                  </dd>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <dt className="text-xs font-semibold uppercase text-blue-700">Net Kar</dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">
                    {formatReportCurrency(report.financial.netKar)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">En Çok Kazandıran Odalar</h3>
              {report.topRooms.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Bu dönemde veri yok.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {report.topRooms.map((room, index) => (
                    <li
                      key={room.unitId}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-900">{room.unitName}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">
                        {formatReportCurrency(room.totalRevenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <ReportBarChart
              title="Aylık Gelir"
              points={report.monthlyCharts.map((point) => ({
                label: point.label,
                value: point.gelir,
              }))}
              colorClass="bg-emerald-500"
              formatValue={formatReportCurrency}
            />
            <ReportBarChart
              title="Aylık Masraf"
              points={report.monthlyCharts.map((point) => ({
                label: point.label,
                value: point.masraf,
              }))}
              colorClass="bg-rose-500"
              formatValue={formatReportCurrency}
            />
            <ReportBarChart
              title="Aylık Net Kar"
              points={report.monthlyCharts.map((point) => ({
                label: point.label,
                value: point.netKar,
              }))}
              colorClass="bg-blue-600"
              formatValue={formatReportCurrency}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Oda Performansı</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-bold">Oda</th>
                    <th className="px-4 py-3 font-bold">Rezervasyon Sayısı</th>
                    <th className="px-4 py-3 font-bold">Toplam Geceleme</th>
                    <th className="px-4 py-3 font-bold">Toplam Gelir</th>
                  </tr>
                </thead>
                <tbody>
                  {report.roomPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        Bu dönemde oda performans verisi yok.
                      </td>
                    </tr>
                  ) : (
                    report.roomPerformance.map((row) => (
                      <tr key={row.unitId} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.unitName}</td>
                        <td className="px-4 py-3">{row.reservationCount}</td>
                        <td className="px-4 py-3">{row.totalNights}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">
                          {formatReportCurrency(row.totalRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Doluluk Raporu</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-bold">Oda</th>
                    <th className="px-4 py-3 font-bold">Dolu Gün</th>
                    <th className="px-4 py-3 font-bold">Boş Gün</th>
                    <th className="px-4 py-3 font-bold">Doluluk Oranı</th>
                  </tr>
                </thead>
                <tbody>
                  {report.occupancy.map((row) => (
                    <tr key={row.unitId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.unitName}</td>
                      <td className="px-4 py-3">{row.occupiedDays}</td>
                      <td className="px-4 py-3">{row.emptyDays}</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">
                        {formatPercent(row.occupancyRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
