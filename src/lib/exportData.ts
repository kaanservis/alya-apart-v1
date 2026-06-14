import autoTable from 'jspdf-autotable'
import {
  createThemedPdf,
  drawStandardFooter,
  drawStandardHeader,
  getPdfMargin,
  getPdfTableStyles,
} from './pdfDocument'
import { formatPdfCurrency } from './pdfTheme'

export interface ExportColumn {
  header: string
  key: string
}

export interface ExportRow {
  [key: string]: string | number
}

function downloadBlob(filename: string, content: BlobPart, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportRowsToExcel(
  filename: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const headers = columns.map((column) => column.header)
  const dataRows = rows.map((row) =>
    columns.map((column) => String(row[column.key] ?? '')),
  )

  const bom = '\uFEFF'
  const csv = [headers, ...dataRows]
    .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  downloadBlob(
    filename.endsWith('.xlsx') ? filename : `${filename}.csv`,
    bom + csv,
    'text/csv;charset=utf-8',
  )
}

export async function exportRowsToPdf(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const doc = await createThemedPdf('landscape')
  const startY = drawStandardHeader(doc, {
    documentTitle: title,
    compact: true,
  })

  autoTable(doc, {
    startY,
    margin: getPdfMargin(true),
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ''))),
    ...getPdfTableStyles(),
  })

  drawStandardFooter(doc)
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

export function formatMoneyExport(value: number) {
  return formatPdfCurrency(value)
}
