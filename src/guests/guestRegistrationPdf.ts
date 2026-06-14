import autoTable from 'jspdf-autotable'
import type { Reservation } from '../types/database'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { formatPdfCurrency, formatPdfDate, sanitizePdfFileName } from '../lib/pdfTheme'
import {
  createThemedPdf,
  drawStandardFooter,
  drawStandardHeader,
  getPdfMargin,
  getPdfTableStyles,
  pageWidth,
  tableFinalY,
} from '../lib/pdfDocument'
import { PDF_FONT_FAMILY } from '../lib/pdfFonts'
import { PDF_THEME } from '../lib/pdfTheme'
import { computeTotalGuestCount, fetchGuestEntriesForReservation } from './guestService'
import type { GuestEntryWithPhotos } from './guestTypes'

export const MAX_ROOM_OCCUPANCY = 8

const OCCUPANCY_WARNING = "Bu odada izin verilen maksimum kişi sayısı 8'dir."

function drawSummaryRow(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  startY: number,
  roomName: string,
  reservation: Reservation,
  totalPersonCount: number,
) {
  autoTable(doc, {
    startY,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - PDF_THEME.margin * 2,
    head: [['Oda', 'Rezervasyon Sahibi', 'Giriş Tarihi', 'Çıkış Tarihi', 'Toplam Kişi']],
    body: [
      [
        roomName,
        reservation.ad_soyad,
        formatPdfDate(reservation.giris_tarihi),
        formatPdfDate(reservation.cikis_tarihi),
        String(totalPersonCount),
      ],
    ],
    ...getPdfTableStyles({
      styles: { halign: 'left' },
    }),
  })
}

function buildGuestTableBody(guests: GuestEntryWithPhotos[]) {
  if (guests.length === 0) {
    return [['1', '—', '—', '—']]
  }

  return guests.map((guest, index) => [
    String(index + 1),
    guest.full_name,
    guest.tc_no ?? '—',
    guest.phone ?? '—',
  ])
}

function drawGuestTable(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  startY: number,
  guests: GuestEntryWithPhotos[],
) {
  autoTable(doc, {
    startY,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - PDF_THEME.margin * 2,
    head: [['#', 'Ad Soyad', 'TC Kimlik No', 'Telefon']],
    body: buildGuestTableBody(guests),
    ...getPdfTableStyles({
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 92 },
        3: { cellWidth: 88 },
      },
    }),
  })
}

function drawOccupancyWarning(doc: Awaited<ReturnType<typeof createThemedPdf>>, y: number) {
  doc.setFillColor(...PDF_THEME.warningBg)
  doc.setDrawColor(...PDF_THEME.warning)
  doc.setLineWidth(0.5)
  doc.roundedRect(PDF_THEME.margin, y, pageWidth(doc) - PDF_THEME.margin * 2, 18, 3, 3, 'FD')

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...PDF_THEME.warning)
  doc.text(OCCUPANCY_WARNING, PDF_THEME.margin + 8, y + 12)
}

function drawPaymentRow(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  startY: number,
  reservation: Reservation,
) {
  autoTable(doc, {
    startY,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - PDF_THEME.margin * 2,
    head: [['Toplam Ücret', 'Alınan Ücret', 'Kalan Bakiye']],
    body: [
      [
        formatPdfCurrency(reservation.toplam_ucret),
        formatPdfCurrency(getTotalCollected(reservation)),
        formatPdfCurrency(getRemainingBalance(reservation)),
      ],
    ],
    ...getPdfTableStyles({
      styles: { halign: 'center' },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [...PDF_THEME.text],
      },
      bodyStyles: {
        fontStyle: 'bold',
        fillColor: [255, 255, 255],
      },
    }),
  })
}

export async function exportGuestRegistrationPdf(roomName: string, reservation: Reservation) {
  const allGuests = await fetchGuestEntriesForReservation(reservation.id)
  const totalPersonCount = computeTotalGuestCount(allGuests.length)
  const exceedsOccupancy = totalPersonCount > MAX_ROOM_OCCUPANCY || allGuests.length > MAX_ROOM_OCCUPANCY
  const displayedGuests = allGuests.slice(0, MAX_ROOM_OCCUPANCY)
  const displayedPersonCount = Math.min(totalPersonCount, MAX_ROOM_OCCUPANCY)

  const doc = await createThemedPdf('portrait')
  const startY = drawStandardHeader(doc, {
    documentTitle: 'Konaklama Bilgi Formu',
    documentSubtitle: roomName,
  })

  drawSummaryRow(doc, startY, roomName, reservation, displayedPersonCount)

  let y = tableFinalY(doc) + 10
  drawGuestTable(doc, y, displayedGuests)
  y = tableFinalY(doc) + 8

  if (exceedsOccupancy) {
    drawOccupancyWarning(doc, y)
    y += 24
  }

  drawPaymentRow(doc, y, reservation)
  drawStandardFooter(doc, { signatureLine: 'Misafir İmzası: ________________________________' })

  doc.save(`misafir-listesi-${sanitizePdfFileName(roomName)}.pdf`)
}
