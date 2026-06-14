import autoTable from 'jspdf-autotable'
import type { Reservation } from '../types/database'
import { fetchGuestEntriesForReservations } from '../guests/guestService'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import {
  createThemedPdf,
  drawPaymentBoxes,
  drawSectionTitle,
  drawStandardFooter,
  drawStandardHeader,
  getPdfMargin,
  getPdfTableStyles,
  pageWidth,
  tableFinalY,
} from '../lib/pdfDocument'
import { PDF_FONT_FAMILY } from '../lib/pdfFonts'
import { formatPdfCurrency, formatPdfDate, formatPdfToday, sanitizePdfFileName, PDF_THEME } from '../lib/pdfTheme'
import type { ReportDateRange } from './reportDateRanges'
import type { RoomReportRow } from './reportCalculations'
import { getReservationNightsInRange, getRoomReservationsInRange } from './reportCalculations'

type GuestSubRow = {
  content: string
  colSpan: number
  styles: Record<string, unknown>
}

function buildCompactOccupantBlock(
  reservation: Reservation,
  guests: GuestEntryWithPhotos[],
) {
  const names = [reservation.ad_soyad, ...guests.map((guest) => guest.full_name)]
  return `Konaklayanlar:\n${names.map((name) => `• ${name}`).join('\n')}`
}

function buildRoomReservationsTableBody(
  roomReservations: Reservation[],
  guestMap: Map<string, GuestEntryWithPhotos[]>,
  range: ReportDateRange,
) {
  const body: Array<Array<string | GuestSubRow>> = []

  roomReservations.forEach((reservation) => {
    const guests = guestMap.get(reservation.id) ?? []
    const nights = getReservationNightsInRange(reservation, range)

    body.push([
      reservation.ad_soyad,
      reservation.telefon,
      formatPdfDate(reservation.giris_tarihi),
      formatPdfDate(reservation.cikis_tarihi),
      String(reservation.kisi_sayisi),
      String(nights),
      formatPdfCurrency(reservation.toplam_ucret),
      formatPdfCurrency(getTotalCollected(reservation)),
      formatPdfCurrency(getRemainingBalance(reservation)),
    ])

    body.push([
      {
        content: buildCompactOccupantBlock(reservation, guests),
        colSpan: 9,
        styles: {
          font: PDF_FONT_FAMILY,
          fontSize: 6.5,
          cellPadding: { top: 1, right: 3, bottom: 2, left: 3 },
          fillColor: [252, 252, 253],
          textColor: [...PDF_THEME.muted],
          fontStyle: 'normal',
        },
      },
    ])
  })

  return body
}

export async function exportRoomReportPdf(
  room: RoomReportRow,
  range: ReportDateRange,
  reservations: Reservation[],
) {
  const roomReservations = getRoomReservationsInRange(reservations, room.unitId, range)
  const guestMap = await fetchGuestEntriesForReservations(
    roomReservations.map((reservation) => reservation.id),
  )

  const doc = await createThemedPdf('portrait')
  let startY = drawStandardHeader(doc, {
    documentTitle: 'ODA RAPORU',
    documentSubtitle: `${room.unitName} — ${range.label}`,
    rightText: formatPdfToday(),
    compact: true,
  })

  autoTable(doc, {
    startY,
    margin: getPdfMargin(true),
    tableWidth: pageWidth(doc) - PDF_THEME.marginCompact * 2,
    head: [['Oda', 'Rapor Tarihi', 'Dönem']],
    body: [[room.unitName, formatPdfToday(), range.label]],
    ...getPdfTableStyles({
      styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.3 },
      headStyles: { fontSize: 6.5, cellPadding: 2 },
    }),
  })

  let y = tableFinalY(doc) + 6

  autoTable(doc, {
    startY: y,
    margin: getPdfMargin(true),
    tableWidth: pageWidth(doc) - PDF_THEME.marginCompact * 2,
    head: [['Rezervasyon', 'Kişi', 'Gece', 'Toplam Ücret', 'Tahsil Edilen', 'Kalan Bakiye']],
    body: [
      [
        String(room.reservationCount),
        String(room.totalGuests),
        String(room.totalNights),
        formatPdfCurrency(room.totalRevenue),
        formatPdfCurrency(room.collectedAmount),
        formatPdfCurrency(room.remainingBalance),
      ],
    ],
    ...getPdfTableStyles({
      styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.3, halign: 'center' },
      headStyles: { fontSize: 6.5, cellPadding: 2 },
    }),
  })

  y = tableFinalY(doc) + 6
  y = drawPaymentBoxes(
    doc,
    y,
    [
      { label: 'Toplam Ücret', value: formatPdfCurrency(room.totalRevenue) },
      { label: 'Ödenen', value: formatPdfCurrency(room.collectedAmount) },
      { label: 'Kalan', value: formatPdfCurrency(room.remainingBalance) },
    ],
    true,
  ) + 8

  if (roomReservations.length === 0) {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...PDF_THEME.muted)
    doc.text('Bu dönemde bu oda için rezervasyon bulunmuyor.', PDF_THEME.marginCompact, y + 8)
  } else {
    y = drawSectionTitle(doc, y, 'Rezervasyon Detayları', true)

    autoTable(doc, {
      startY: y,
      margin: getPdfMargin(true),
      tableWidth: pageWidth(doc) - PDF_THEME.marginCompact * 2,
      head: [
        [
          'Rezervasyon Sahibi',
          'Telefon',
          'Giriş',
          'Çıkış',
          'Kişi',
          'Gece',
          'Toplam Ücret',
          'Ödenen',
          'Kalan',
        ],
      ],
      body: buildRoomReservationsTableBody(roomReservations, guestMap, range),
      ...getPdfTableStyles({
        styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.3 },
        headStyles: { fontSize: 6.5, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { cellWidth: 54 },
          2: { cellWidth: 42, halign: 'center' },
          3: { cellWidth: 42, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 58, halign: 'right' },
          7: { cellWidth: 52, halign: 'right' },
          8: { cellWidth: 48, halign: 'right' },
        },
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
      }),
    })
  }

  drawStandardFooter(doc)
  doc.save(`${sanitizePdfFileName(room.unitName)}-Raporu.pdf`)
}
