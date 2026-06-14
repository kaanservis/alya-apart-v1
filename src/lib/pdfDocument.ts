import { jsPDF } from 'jspdf'
import type { UserOptions } from 'jspdf-autotable'
import { PDF_FONT_FAMILY, registerPdfFonts } from './pdfFonts'
import { PDF_BRAND, PDF_THEME } from './pdfTheme'

export interface PdfHeaderOptions {
  documentTitle: string
  documentSubtitle?: string
  rightText?: string
  compact?: boolean
}

export interface PdfFooterOptions {
  signatureLine?: string
}

export async function createThemedPdf(orientation: 'portrait' | 'landscape' = 'portrait') {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  await registerPdfFonts(doc)
  return doc
}

export function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth()
}

export function pageHeight(doc: jsPDF) {
  return doc.internal.pageSize.getHeight()
}

export function tableFinalY(doc: jsPDF) {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

export function getPdfMargin(compact = false) {
  const margin = compact ? PDF_THEME.marginCompact : PDF_THEME.margin
  return {
    left: margin,
    right: margin,
    top: margin,
    bottom: margin,
  }
}

export function getPdfTableStyles(overrides?: Partial<UserOptions>): Partial<UserOptions> {
  const base: Partial<UserOptions> = {
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: 8,
      cellPadding: 3,
      textColor: [...PDF_THEME.text],
      lineColor: [...PDF_THEME.border],
      lineWidth: 0.35,
      overflow: 'linebreak',
    },
    headStyles: {
      font: PDF_FONT_FAMILY,
      fontStyle: 'bold',
      fillColor: [...PDF_THEME.primary],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [...PDF_THEME.zebra],
    },
    theme: 'grid',
  }

  if (!overrides) {
    return base
  }

  return {
    ...base,
    ...overrides,
    styles: { ...base.styles, ...overrides.styles },
    headStyles: { ...base.headStyles, ...overrides.headStyles },
    bodyStyles: overrides.bodyStyles
      ? { ...(base.bodyStyles ?? {}), ...overrides.bodyStyles }
      : base.bodyStyles,
    alternateRowStyles: overrides.alternateRowStyles
      ? { ...base.alternateRowStyles, ...overrides.alternateRowStyles }
      : base.alternateRowStyles,
    columnStyles: overrides.columnStyles ?? base.columnStyles,
  }
}

export function drawStandardHeader(doc: jsPDF, options: PdfHeaderOptions) {
  const headerHeight = options.compact ? PDF_THEME.headerHeightCompact : PDF_THEME.headerHeight
  const margin = options.compact ? PDF_THEME.marginCompact : PDF_THEME.margin

  doc.setFillColor(...PDF_THEME.primary)
  doc.rect(0, 0, pageWidth(doc), headerHeight, 'F')

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(options.compact ? 15 : 17)
  doc.setTextColor(255, 255, 255)
  doc.text(PDF_BRAND.title, margin, options.compact ? 18 : 22)

  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(options.compact ? 8 : 9)
  doc.text(PDF_BRAND.subtitle, margin, options.compact ? 30 : 36)

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(options.compact ? 10 : 12)
  doc.text(options.documentTitle, margin, options.compact ? 42 : 50)

  if (options.documentSubtitle) {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(8)
    doc.text(options.documentSubtitle, margin, options.compact ? 54 : 60)
  }

  if (options.rightText) {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(8)
    doc.text(options.rightText, pageWidth(doc) - margin, options.compact ? 18 : 22, {
      align: 'right',
    })
  }

  return headerHeight + 8
}

export function drawStandardFooter(doc: jsPDF, options: PdfFooterOptions = {}) {
  const totalPages = doc.getNumberOfPages()
  const margin = PDF_THEME.margin

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)

    doc.setDrawColor(...PDF_THEME.border)
    doc.setLineWidth(0.5)
    doc.line(margin, PDF_THEME.footerY - 8, pageWidth(doc) - margin, PDF_THEME.footerY - 8)

    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...PDF_THEME.primary)
    doc.text(PDF_BRAND.title, pageWidth(doc) / 2, PDF_THEME.footerY + 4, { align: 'center' })

    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...PDF_THEME.muted)
    doc.text(PDF_BRAND.phone, pageWidth(doc) / 2, PDF_THEME.footerY + 16, { align: 'center' })

    if (options.signatureLine) {
      doc.setFontSize(8)
      doc.setTextColor(...PDF_THEME.text)
      doc.text(options.signatureLine, margin, PDF_THEME.footerY + 34)
    }
  }
}

export function drawSectionTitle(doc: jsPDF, y: number, title: string, compact = false) {
  const margin = compact ? PDF_THEME.marginCompact : PDF_THEME.margin
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(compact ? 10 : 11)
  doc.setTextColor(...PDF_THEME.primary)
  doc.text(title, margin, y)
  return y + (compact ? 8 : 10)
}

export function drawPaymentBoxes(
  doc: jsPDF,
  startY: number,
  items: Array<{ label: string; value: string }>,
  compact = false,
) {
  const margin = compact ? PDF_THEME.marginCompact : PDF_THEME.margin
  const innerWidth = pageWidth(doc) - margin * 2
  const gap = 6
  const boxWidth = (innerWidth - gap * (items.length - 1)) / items.length
  const boxHeight = compact ? 26 : 34
  const fills = [PDF_THEME.paymentTotal, PDF_THEME.paymentPaid, PDF_THEME.paymentDue]

  items.forEach((item, index) => {
    const x = margin + index * (boxWidth + gap)
    const fill = fills[index] ?? PDF_THEME.zebra
    doc.setFillColor(fill[0], fill[1], fill[2])
    doc.setDrawColor(...PDF_THEME.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'FD')

    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(compact ? 6.5 : 7)
    doc.setTextColor(...PDF_THEME.muted)
    doc.text(item.label, x + 6, startY + (compact ? 9 : 12))

    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(compact ? 8 : 9)
    doc.setTextColor(...PDF_THEME.text)
    doc.text(item.value, x + 6, startY + (compact ? 20 : 26))
  })

  return startY + boxHeight
}
