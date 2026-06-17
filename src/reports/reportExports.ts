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
  { header: 'Tahsil Edilen', key: 'alinanUcret' },
  { header: 'Kalan Bakiye', key: 'kalanBakiye' },
]

function buildRoomExportRows(report: ReportData, canViewPrices = true): ExportRow[] {
  return report.roomReports.map((row) => ({
    oda: row.unitName,
    rezervasyonSayisi: String(row.reservationCount),
    toplamKisi: String(row.totalGuests),
    toplamGece: String(row.totalNights),
    toplamUcret: formatMoneyExport(row.totalRevenue, canViewPrices),
    alinanUcret: formatMoneyExport(row.collectedAmount, canViewPrices),
    kalanBakiye: formatMoneyExport(row.remainingBalance, canViewPrices),
  }))
}

export function exportReportExcel(report: ReportData, range: ReportDateRange, canViewPrices = true) {
  const summaryRows: ExportRow[] = [
    { oda: 'ÖZET', rezervasyonSayisi: range.label, toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Gelir', rezervasyonSayisi: formatMoneyExport(report.summary.toplamGelir, canViewPrices), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Masraf', rezervasyonSayisi: formatMoneyExport(report.summary.toplamMasraf, canViewPrices), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Net Kazanç', rezervasyonSayisi: formatMoneyExport(report.summary.netKazanc, canViewPrices), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Rezervasyon', rezervasyonSayisi: String(report.summary.toplamRezervasyon), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: 'Toplam Geceleme', rezervasyonSayisi: String(report.summary.toplamGeceleme), toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
    { oda: '', rezervasyonSayisi: '', toplamKisi: '', toplamGece: '', toplamUcret: '', alinanUcret: '', kalanBakiye: '' },
  ]

  exportRowsToExcel(
    `alya-apart-rapor-${range.start}-${range.end}`,
    ROOM_EXPORT_COLUMNS,
    [...summaryRows, ...buildRoomExportRows(report, canViewPrices)],
  )
}

export { exportDetailedReportPdf, exportSeasonReportPdf } from './reportPdfExports'
export { exportRoomReportPdf } from './roomReportPdf'
