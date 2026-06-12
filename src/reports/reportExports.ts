import {
  exportRowsToExcel,
  exportRowsToPdf,
  formatMoneyExport,
  type ExportColumn,
  type ExportRow,
} from '../lib/exportData'
import type { ReportData } from './reportCalculations'
import { formatPercent, formatReportCurrency } from './reportCalculations'
import type { ReportDateRange } from './reportDateRanges'

function buildReportExportRows(report: ReportData, rangeLabel: string): ExportRow[] {
  const rows: ExportRow[] = [
    { bolum: 'Özet', metrik: 'Dönem', deger: rangeLabel },
    { bolum: 'Özet', metrik: 'Toplam Gelir', deger: formatReportCurrency(report.summary.toplamGelir) },
    { bolum: 'Özet', metrik: 'Toplam Masraf', deger: formatReportCurrency(report.summary.toplamMasraf) },
    { bolum: 'Özet', metrik: 'Net Kazanç', deger: formatReportCurrency(report.summary.netKazanc) },
    { bolum: 'Özet', metrik: 'Toplam Rezervasyon', deger: String(report.summary.toplamRezervasyon) },
    { bolum: 'Özet', metrik: 'Toplam Geceleme', deger: String(report.summary.toplamGeceleme) },
    {
      bolum: 'Özet',
      metrik: 'Ortalama Doluluk',
      deger: formatPercent(report.summary.ortalamaDoluluk),
    },
  ]

  report.roomPerformance.forEach((row) => {
    rows.push({
      bolum: 'Oda Performansı',
      metrik: row.unitName,
      deger: `${row.reservationCount} rez. | ${row.totalNights} gece | ${formatReportCurrency(row.totalRevenue)}`,
    })
  })

  report.occupancy.forEach((row) => {
    rows.push({
      bolum: 'Doluluk',
      metrik: row.unitName,
      deger: `${row.occupiedDays} dolu / ${row.emptyDays} boş | ${formatPercent(row.occupancyRate)}`,
    })
  })

  rows.push(
    {
      bolum: 'Finansal',
      metrik: 'Toplam Tahsilat',
      deger: formatReportCurrency(report.financial.toplamTahsilat),
    },
    {
      bolum: 'Finansal',
      metrik: 'Bekleyen Tahsilat',
      deger: formatReportCurrency(report.financial.bekleyenTahsilat),
    },
    {
      bolum: 'Finansal',
      metrik: 'Toplam Masraf',
      deger: formatReportCurrency(report.financial.toplamMasraf),
    },
    {
      bolum: 'Finansal',
      metrik: 'Net Kar',
      deger: formatReportCurrency(report.financial.netKar),
    },
  )

  report.monthlyCharts.forEach((point) => {
    rows.push({
      bolum: 'Aylık',
      metrik: point.label,
      deger: `Gelir ${formatMoneyExport(point.gelir)} | Masraf ${formatMoneyExport(point.masraf)} | Net ${formatMoneyExport(point.netKar)}`,
    })
  })

  return rows
}

const REPORT_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Bölüm', key: 'bolum' },
  { header: 'Metrik', key: 'metrik' },
  { header: 'Değer', key: 'deger' },
]

export function exportReportPdf(report: ReportData, range: ReportDateRange) {
  exportRowsToPdf(
    'rapor',
    `ALYA APART Raporu — ${range.label}`,
    REPORT_EXPORT_COLUMNS,
    buildReportExportRows(report, range.label),
  )
}

export function exportReportExcel(report: ReportData, range: ReportDateRange) {
  exportRowsToExcel(
    'rapor',
    REPORT_EXPORT_COLUMNS,
    buildReportExportRows(report, range.label),
  )
}
