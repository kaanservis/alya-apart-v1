import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export function exportRowsToPdf(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(14)
  doc.text(title, 40, 36)

  autoTable(doc, {
    startY: 48,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ''))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: 24, right: 24 },
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

export function formatMoneyExport(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value)
}
