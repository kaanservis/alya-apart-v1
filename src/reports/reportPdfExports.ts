import autoTable from 'jspdf-autotable'
import type { Reservation } from '../types/database'
import { fetchGuestEntriesForReservations } from '../guests/guestService'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import {
  createThemedPdf,
  drawSectionTitle,
  drawStandardFooter,
  drawStandardHeader,
  getPdfMargin,
  getPdfTableStyles,
  pageHeight,
  pageWidth,
  tableFinalY,
} from '../lib/pdfDocument'
import { PDF_FONT_FAMILY } from '../lib/pdfFonts'
import { formatPdfCurrency, formatPdfDate, PDF_THEME } from '../lib/pdfTheme'
import type { ReportData } from './reportCalculations'
import type { ReportDateRange } from './reportDateRanges'

function getSeasonYearLabel(range: ReportDateRange) {
  const match = range.label.match(/\d{4}/)
  return match ? `${match[0]} Sezonu` : range.label
}

function drawSummaryStrip(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  report: ReportData,
  rangeLabel: string,
  startY: number,
  canViewPrices: boolean,
) {
  autoTable(doc, {
    startY,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - PDF_THEME.margin * 2,
    head: [['Dönem', 'Toplam Gelir', 'Toplam Masraf', 'Net Kazanç', 'Rezervasyon', 'Geceleme']],
    body: [
      [
        rangeLabel,
        formatPdfCurrency(report.summary.toplamGelir, canViewPrices),
        formatPdfCurrency(report.summary.toplamMasraf, canViewPrices),
        formatPdfCurrency(report.summary.netKazanc, canViewPrices),
        String(report.summary.toplamRezervasyon),
        String(report.summary.toplamGeceleme),
      ],
    ],
    ...getPdfTableStyles(),
  })
}

function drawRoomTable(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  report: ReportData,
  startY: number,
  canViewPrices: boolean,
) {
  autoTable(doc, {
    startY,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - PDF_THEME.margin * 2,
    head: [
      [
        'Oda',
        'Rezervasyon',
        'Toplam Kişi',
        'Toplam Gece',
        'Toplam Ücret',
        'Tahsil Edilen',
        'Kalan Bakiye',
      ],
    ],
    body: report.roomReports.map((row) => [
      row.unitName,
      String(row.reservationCount),
      String(row.totalGuests),
      String(row.totalNights),
      formatPdfCurrency(row.totalRevenue, canViewPrices),
      formatPdfCurrency(row.collectedAmount, canViewPrices),
      formatPdfCurrency(row.remainingBalance, canViewPrices),
    ]),
    ...getPdfTableStyles({
      rowPageBreak: 'avoid',
    }),
  })
}

function drawRoomSummaryBoxes(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  report: ReportData,
  startY: number,
  canViewPrices: boolean,
) {
  let y = startY

  report.roomReports
    .filter(
      (row) =>
        row.reservationCount > 0 ||
        row.totalRevenue > 0 ||
        row.totalNights > 0 ||
        row.totalGuests > 0,
    )
    .forEach((row) => {
      if (y > pageHeight(doc) - 120) {
        doc.addPage()
        y = PDF_THEME.margin
      }

      doc.setFillColor(...PDF_THEME.zebra)
      doc.setDrawColor(...PDF_THEME.border)
      doc.setLineWidth(0.6)
      doc.roundedRect(PDF_THEME.margin, y, pageWidth(doc) - PDF_THEME.margin * 2, 78, 6, 6, 'FD')

      doc.setFont(PDF_FONT_FAMILY, 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...PDF_THEME.primary)
      doc.text(row.unitName, PDF_THEME.margin + 12, y + 18)

      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...PDF_THEME.text)
      doc.text(`Rezervasyon: ${row.reservationCount}`, PDF_THEME.margin + 12, y + 34)
      doc.text(`Kişi: ${row.totalGuests}`, PDF_THEME.margin + 150, y + 34)
      doc.text(`Geceleme: ${row.totalNights}`, PDF_THEME.margin + 250, y + 34)
      doc.text(`Toplam Ücret: ${formatPdfCurrency(row.totalRevenue, canViewPrices)}`, PDF_THEME.margin + 12, y + 50)
      doc.text(`Tahsil Edilen: ${formatPdfCurrency(row.collectedAmount, canViewPrices)}`, PDF_THEME.margin + 12, y + 64)
      doc.text(`Kalan: ${formatPdfCurrency(row.remainingBalance, canViewPrices)}`, PDF_THEME.margin + 250, y + 64)

      y += 88
    })

  return y
}

function buildOccupantList(
  reservation: Reservation,
  guests: GuestEntryWithPhotos[],
) {
  const names = [reservation.ad_soyad, ...guests.map((guest) => guest.full_name)]
  return names.map((name) => `- ${name}`).join('\n')
}

export async function exportSeasonReportPdf(
  report: ReportData,
  range: ReportDateRange,
  canViewPrices = true,
) {
  const doc = await createThemedPdf('portrait')
  const startY = drawStandardHeader(doc, {
    documentTitle: 'SEZON RAPORU',
    documentSubtitle: getSeasonYearLabel(range),
  })

  drawSummaryStrip(doc, report, range.label, startY, canViewPrices)
  let y = tableFinalY(doc) + 16

  y = drawSectionTitle(doc, y, 'Oda Özet Tablosu')
  drawRoomTable(doc, report, y, canViewPrices)
  y = tableFinalY(doc) + 18

  y = drawSectionTitle(doc, y, 'Oda Bazlı Özet')
  drawRoomSummaryBoxes(doc, report, y, canViewPrices)

  drawStandardFooter(doc)
  doc.save(`alya-apart-sezon-raporu-${range.start}-${range.end}.pdf`)
}

export async function exportDetailedReportPdf(
  report: ReportData,
  range: ReportDateRange,
  reservations: Reservation[],
  unitMap: Map<string, string>,
  canViewPrices = true,
) {
  const inRangeReservations = reservations
    .filter(
      (reservation) =>
        reservation.giris_tarihi <= range.end && reservation.cikis_tarihi >= range.start,
    )
    .sort((a, b) => a.giris_tarihi.localeCompare(b.giris_tarihi, 'tr'))

  const guestMap = await fetchGuestEntriesForReservations(
    inRangeReservations.map((reservation) => reservation.id),
  )

  const doc = await createThemedPdf('portrait')
  const startY = drawStandardHeader(doc, {
    documentTitle: 'DETAYLI REZERVASYON RAPORU',
    documentSubtitle: range.label,
  })

  drawSummaryStrip(doc, report, range.label, startY, canViewPrices)
  let y = tableFinalY(doc) + 18

  inRangeReservations.forEach((reservation, index) => {
    if (y > pageHeight(doc) - 150) {
      doc.addPage()
      y = PDF_THEME.margin
    }

    const guests = guestMap.get(reservation.id) ?? []
    const occupants = buildOccupantList(reservation, guests)
    const roomName = unitMap.get(reservation.konaklama_birimi_id) ?? '—'

    autoTable(doc, {
      startY: y,
      margin: getPdfMargin(),
      tableWidth: pageWidth(doc) - PDF_THEME.margin * 2,
      head: [[`Rezervasyon ${index + 1}`, roomName]],
      body: [
        ['Rezervasyon Sahibi', reservation.ad_soyad],
        ['Telefon', reservation.telefon],
        ['Giriş Tarihi', formatPdfDate(reservation.giris_tarihi)],
        ['Çıkış Tarihi', formatPdfDate(reservation.cikis_tarihi)],
        ['Konaklayanlar', occupants],
        ['Toplam Kişi', String(reservation.kisi_sayisi)],
        ['Toplam Ücret', formatPdfCurrency(reservation.toplam_ucret, canViewPrices)],
        ['Ödenen Tutar', formatPdfCurrency(getTotalCollected(reservation), canViewPrices)],
        ['Kalan Bakiye', formatPdfCurrency(getRemainingBalance(reservation), canViewPrices)],
      ],
      ...getPdfTableStyles({
        styles: { fontSize: 8.5 },
        columnStyles: {
          0: { cellWidth: 110, fontStyle: 'bold', fillColor: [...PDF_THEME.zebra] },
          1: { cellWidth: 'auto' },
        },
        rowPageBreak: 'avoid',
      }),
    })

    y = tableFinalY(doc) + 12
  })

  drawStandardFooter(doc)
  doc.save(`alya-apart-detayli-rapor-${range.start}-${range.end}.pdf`)
}
