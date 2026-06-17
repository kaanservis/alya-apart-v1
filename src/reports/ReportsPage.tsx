import { useMemo, useState } from 'react'
import { useCanViewPrices, useFormatAdminCurrency } from '../auth/useFormatAdminCurrency'
import {
  buildReportData,
  formatPercent,
} from './reportCalculations'
import type { RoomReportRow } from './reportCalculations'
import {
  exportDetailedReportPdf,
  exportReportExcel,
  exportRoomReportPdf,
  exportSeasonReportPdf,
} from './reportExports'
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
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent: string
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm font-medium opacity-80">{hint}</p>}
    </div>
  )
}

export function ReportsPage({ refreshToken }: ReportsPageProps) {
  const formatReportCurrency = useFormatAdminCurrency()
  const canViewPrices = useCanViewPrices()
  const { units, reservations, expenses, loading, error } = useReportsData(refreshToken)
  const [preset, setPreset] = useState<ReportFilterPreset>('season')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportingRoomId, setExportingRoomId] = useState<string | null>(null)

  const range = useMemo(
    () => getReportDateRange(preset, new Date(), customStart, customEnd),
    [preset, customStart, customEnd],
  )

  const report = useMemo(
    () => buildReportData(units, reservations, expenses, range),
    [units, reservations, expenses, range],
  )

  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units])

  async function handleExport(type: 'season' | 'detailed' | 'excel') {
    setExporting(type)
    try {
      if (type === 'season') {
        await exportSeasonReportPdf(report, range, canViewPrices)
      } else if (type === 'detailed') {
        await exportDetailedReportPdf(report, range, reservations, unitMap, canViewPrices)
      } else {
        exportReportExcel(report, range, canViewPrices)
      }
    } finally {
      setExporting(null)
    }
  }

  async function handleRoomPdf(row: RoomReportRow) {
    setExportingRoomId(row.unitId)
    try {
      await exportRoomReportPdf(row, range, reservations, canViewPrices)
    } finally {
      setExportingRoomId(null)
    }
  }

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
              Gelir, masraf, oda performansı ve günlük doluluk özeti.
            </p>
            <p className="mt-2 text-sm font-semibold text-blue-800">{range.label}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || Boolean(exporting)}
              onClick={() => void handleExport('season')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {exporting === 'season' ? 'Hazırlanıyor...' : 'Sezon Raporu PDF'}
            </button>
            <button
              type="button"
              disabled={loading || Boolean(exporting)}
              onClick={() => void handleExport('detailed')}
              className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
            >
              {exporting === 'detailed' ? 'Hazırlanıyor...' : 'Detaylı Rapor PDF'}
            </button>
            <button
              type="button"
              disabled={loading || Boolean(exporting)}
              onClick={() => void handleExport('excel')}
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
              label="Günlük Doluluk"
              value={`${report.summary.gunlukDoluOda} / ${report.summary.toplamOda} Oda Dolu`}
              hint={formatPercent(report.summary.gunlukDolulukOrani)}
              accent="border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50"
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Raporlar</h3>
              <p className="mt-1 text-sm text-slate-600">
                Seçili dönemde oda bazlı gelir, kişi sayısı ve ödeme özeti.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-bold">Oda</th>
                    <th className="px-4 py-3 font-bold">Rezervasyon Sayısı</th>
                    <th className="px-4 py-3 font-bold">Toplam Kişi</th>
                    <th className="px-4 py-3 font-bold">Toplam Gece</th>
                    <th className="px-4 py-3 font-bold">Toplam Ücret</th>
                    <th className="px-4 py-3 font-bold">Tahsil Edilen</th>
                    <th className="px-4 py-3 font-bold">Kalan Bakiye</th>
                    <th className="px-4 py-3 font-bold">PDF Rapor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.roomReports.map((row, index) => (
                    <tr
                      key={row.unitId}
                      className={`border-t border-slate-100 ${
                        index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.unitName}</td>
                      <td className="px-4 py-3">{row.reservationCount}</td>
                      <td className="px-4 py-3">{row.totalGuests}</td>
                      <td className="px-4 py-3">{row.totalNights}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatReportCurrency(row.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-emerald-700">
                        {formatReportCurrency(row.collectedAmount)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-700">
                        {formatReportCurrency(row.remainingBalance)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={Boolean(exportingRoomId)}
                          onClick={() => void handleRoomPdf(row)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {exportingRoomId === row.unitId ? '...' : 'PDF'}
                        </button>
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
