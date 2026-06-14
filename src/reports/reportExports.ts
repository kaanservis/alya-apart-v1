import {
  exportRowsToExcel,
  formatMoneyExport,
  type ExportColumn,
  type ExportRow,
} from '../lib/exportData'
import type { ReportData } from './reportCalculations'
import type { ReportDateRange } from './reportDateRanges'

const ROOM_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Oda', key: 'oda' },
  { header: 'Rezervasyon Sayısı', key: 'rezervasyonSayisi' },
  { header: 'Toplam Kişi', key: 'toplamKisi' },
  { header: 'Toplam Gece', key: 'toplamGece' },
  { header: 'Toplam Ücret', key: 'toplamUcret' },
  { header: 'Alınan Ücret', key: 'alinanUcret' },
  { header: 'Kalan Bakiye', key: 'kalanBakiye' },
]

function buildRoomExportRows(report: ReportData): ExportRow[] {
  return report.roomReports.map((row) => ({
    oda: row.unitName,
    rezervasyonSayisi: String(row.reservationCount),
    toplamKisi: String(row.totalGuests),
    toplamGece: String(row.totalNights),
    toplamUcret: formatMoneyExport(row.totalRevenue),
    alinanUcret: formatMoneyExport(row.collectedAmount),
    kalanBakiye: formatMoneyExport(row.remainingBalance),
  }))
}

export function exportReportExcel(report: ReportData, range: ReportDateRange) {
  const summaryRows: ExportRow[] = [
    { oda: 'ÖZET', rezervasyonSayisi: range.label, toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Gelir', rezervasyonSayisi: formatMoneyExport(report.summary.toplamGelir), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Masraf', rezervasyonSayisi: formatMoneyExport(report.summary.toplamMasraf), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Net Kazanç', rezervasyonSayisi: formatMoneyExport(report.summary.netKazanc), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Rezervasyon', rezervasyonSayisi: String(report.summary.toplamRezervasyon), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Geceleme', rezervasyonSayisi: String(report.summary.toplamGeceleme), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: '', rezervasyonSayisi: '', toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
  ]

  exportRowsToExcel(
    `alya-apart-rapor-${range.start}-${range.end}`,
    ROOM_EXPORT_COLUMNS,
    [...summaryRows, ...buildRoomExportRows(report)],
  )
}

export { exportDetailedReportPdf, exportSeasonReportPdf } from './reportPdfExports'
export { exportRoomReportPdf } from './roomReportPdf'
