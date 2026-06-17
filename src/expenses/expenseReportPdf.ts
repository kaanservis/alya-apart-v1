import autoTable from 'jspdf-autotable'
import {
  createThemedPdf,
  getPdfMargin,
  getPdfTableStyles,
  pageWidth,
  tableFinalY,
} from '../lib/pdfDocument'
import { PDF_FONT_FAMILY } from '../lib/pdfFonts'
import { PDF_THEME, sanitizePdfFileName } from '../lib/pdfTheme'
import {
  calculateExpenseTotal,
  formatExpensePdfCurrency,
  formatExpenseReportTimestamp,
  formatExpenseShortDate,
} from './expenseCalculations'
import type { Expense } from './types'

export async function exportExpenseReportPdf(expenses: Expense[], canViewPrices = true) {
  const doc = await createThemedPdf('portrait')
  const margin = PDF_THEME.margin
  const contentWidth = pageWidth(doc) - margin * 2
  const reportTimestamp = formatExpenseReportTimestamp()
  const total = calculateExpenseTotal(expenses)

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...PDF_THEME.primary)
  doc.text('ALYA APART MASRAF RAPORU', pageWidth(doc) / 2, margin + 10, { align: 'center' })

  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...PDF_THEME.text)
  doc.text(`Rapor Tarihi : ${reportTimestamp}`, margin, margin + 32)

  const tableBody =
    expenses.length === 0
      ? [['—', '—', 'Kayıt bulunmuyor', '—']]
      : expenses.map((expense, index) => [
          String(index + 1),
          formatExpenseShortDate(expense.tarih),
          expense.aciklama,
          formatExpensePdfCurrency(Number(expense.tutar), canViewPrices),
        ])

  autoTable(doc, {
    startY: margin + 44,
    margin: getPdfMargin(),
    tableWidth: contentWidth,
    head: [['Sıra', 'Tarih', 'Açıklama', 'Tutar']],
    body: tableBody,
    ...getPdfTableStyles({
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fontSize: 8.5, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 36, halign: 'center' },
        1: { cellWidth: 72, halign: 'center' },
        2: { cellWidth: contentWidth - 36 - 72 - 88 },
        3: { cellWidth: 88, halign: 'right' },
      },
    }),
  })

  let summaryY = tableFinalY(doc) + 14

  doc.setDrawColor(...PDF_THEME.border)
  doc.setLineWidth(0.6)
  doc.line(margin, summaryY, pageWidth(doc) - margin, summaryY)

  summaryY += 16
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF_THEME.text)
  doc.text(`TOPLAM MASRAF : ${formatExpensePdfCurrency(total, canViewPrices)}`, pageWidth(doc) - margin, summaryY, {
    align: 'right',
  })

  summaryY += 10
  doc.line(margin, summaryY, pageWidth(doc) - margin, summaryY)

  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF_THEME.muted)
  doc.text(
    'ALYA APART Yönetim Sistemi tarafından oluşturulmuştur.',
    pageWidth(doc) / 2,
    summaryY + 18,
    { align: 'center' },
  )

  doc.save(`${sanitizePdfFileName('ALYA-APART-Masraf-Raporu')}.pdf`)
}
