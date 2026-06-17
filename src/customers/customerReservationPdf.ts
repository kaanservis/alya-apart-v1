import autoTable from 'jspdf-autotable'
import type { PaymentRecord, Reservation } from '../types/database'
import { formatPdfMoneyByPermission } from '../auth/formatMoney'
import {
  createThemedPdf,
  getPdfMargin,
  pageWidth,
  tableFinalY,
} from '../lib/pdfDocument'
import { PDF_FONT_FAMILY } from '../lib/pdfFonts'
import { formatPdfDate, formatPdfToday } from '../lib/pdfTheme'
import { calculateNights } from '../reservations/pricing'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { fetchReservationPaymentState } from '../reservations/tahsilatService'
import type { GuestEntryWithPhotos } from '../guests/guestTypes'

interface ExportCustomerReservationPdfOptions {
  canViewPrices: boolean
  canViewTc: boolean
}

function sanitizeReservationPdfPart(value: string) {
  return value
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_]+/gu, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export function buildCustomerReservationPdfFileName(roomName: string, guestName: string) {
  const roomPart = sanitizeReservationPdfPart(roomName) || 'ODA'
  const guestPart = sanitizeReservationPdfPart(guestName) || 'MISAFIR'
  return `Rezervasyon_${roomPart}_${guestPart}.pdf`
}

function formatPdfMoney(value: number, canViewPrices: boolean) {
  return formatPdfMoneyByPermission(value, canViewPrices)
}

function formatPdfTc(value: string | null | undefined, canViewTc: boolean) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return '—'
  }

  if (!canViewTc) {
    return '***********'
  }

  return trimmed
}

function drawSectionTitle(
  doc: Awaited<ReturnType<typeof createThemedPdf>>,
  y: number,
  title: string,
) {
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 109)
  doc.text(title, getPdfMargin().left, y)
}

function drawDivider(doc: Awaited<ReturnType<typeof createThemedPdf>>, y: number) {
  const margin = getPdfMargin().left
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageWidth(doc) - margin, y)
}

function resolveDailyRate(reservation: Reservation, nights: number) {
  if (reservation.gunluk_ucret != null && reservation.gunluk_ucret > 0) {
    return Number(reservation.gunluk_ucret)
  }

  if (nights <= 0) {
    return 0
  }

  return Number(reservation.toplam_ucret) / nights
}

export async function exportCustomerReservationPdf(
  reservation: Reservation,
  unitName: string,
  guests: GuestEntryWithPhotos[],
  options: ExportCustomerReservationPdfOptions,
) {
  const paymentState = await fetchReservationPaymentState(reservation.id)
  const summary = paymentState.summary
  const payments = paymentState.payments
  const nights = calculateNights(reservation.giris_tarihi, reservation.cikis_tarihi)
  const dailyRate = resolveDailyRate(reservation, nights)

  const doc = await createThemedPdf('portrait')
  const margin = getPdfMargin().left

  let y = margin

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('ALYA APART', pageWidth(doc) / 2, y, { align: 'center' })
  y += 20

  doc.setFontSize(12)
  doc.text('REZERVASYON BİLGİ FORMU', pageWidth(doc) / 2, y, { align: 'center' })
  y += 18

  drawDivider(doc, y)
  y += 18

  autoTable(doc, {
    startY: y,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - margin * 2,
    theme: 'plain',
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: 9,
      cellPadding: 4,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: 'bold', textColor: [100, 116, 139] },
      1: { cellWidth: 'auto' },
    },
    body: [
      ['Rezervasyon Sahibi', reservation.ad_soyad],
      ['Telefon', reservation.telefon],
      ['Oda', unitName],
      ['Giriş Tarihi', formatPdfDate(reservation.giris_tarihi)],
      ['Çıkış Tarihi', formatPdfDate(reservation.cikis_tarihi)],
      ['Gün Sayısı', String(nights)],
      ['Kişi Sayısı', String(reservation.kisi_sayisi)],
      ['Günlük Ücret', formatPdfMoney(dailyRate, options.canViewPrices)],
      ['Toplam Ücret', formatPdfMoney(Number(reservation.toplam_ucret), options.canViewPrices)],
      ['Tahsil Edilen', formatPdfMoney(summary.totalCollected, options.canViewPrices)],
      ['Kalan Bakiye', formatPdfMoney(summary.remainingBalance, options.canViewPrices)],
    ],
  })

  y = tableFinalY(doc) + 14
  drawDivider(doc, y)
  y += 16

  drawSectionTitle(doc, y, 'ÖDEME GEÇMİŞİ')
  y += 10

  autoTable(doc, {
    startY: y,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - margin * 2,
    head: [['Tarih', 'Tutar', 'Açıklama', 'İşlemi Yapan']],
    body:
      payments.length > 0
        ? payments.map((record: PaymentRecord) => [
            formatReservationDate(record.payment_date),
            formatPdfMoney(Number(record.amount), options.canViewPrices),
            record.note?.trim() || '—',
            record.recorded_by?.trim() || '—',
          ])
        : [['—', '—', 'Henüz ödeme kaydı yok', '—']],
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: 9,
      cellPadding: 4,
      textColor: [15, 23, 42],
    },
    headStyles: {
      font: PDF_FONT_FAMILY,
      fontStyle: 'bold',
      fillColor: [30, 58, 109],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'grid',
  })

  y = tableFinalY(doc) + 14
  drawDivider(doc, y)
  y += 16

  drawSectionTitle(doc, y, 'KONAKLAYAN MİSAFİRLER')
  y += 10

  const guestRows =
    guests.length > 0
      ? guests.map((guest, index) => [
          String(index + 1),
          guest.full_name,
          formatPdfTc(guest.tc_no, options.canViewTc),
        ])
      : [['—', 'Kayıt bulunmuyor', '—']]

  autoTable(doc, {
    startY: y,
    margin: getPdfMargin(),
    tableWidth: pageWidth(doc) - margin * 2,
    head: [['#', 'Ad Soyad', 'TC Kimlik No']],
    body: guestRows,
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: 9,
      cellPadding: 4,
      textColor: [15, 23, 42],
    },
    headStyles: {
      font: PDF_FONT_FAMILY,
      fontStyle: 'bold',
      fillColor: [30, 58, 109],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'grid',
  })

  y = tableFinalY(doc) + 18
  drawDivider(doc, y)
  y += 14

  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`PDF Oluşturulma Tarihi: ${formatPdfToday()}`, margin, y)

  doc.save(buildCustomerReservationPdfFileName(unitName, reservation.ad_soyad))
}
