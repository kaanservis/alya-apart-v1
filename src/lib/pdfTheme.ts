import { formatTurkeyDateKey, getTurkeyDateKey } from './turkeyDate'

export const PDF_BRAND = {
  title: 'ALYA APART',
  subtitle: 'Avşa Adası - Yiğitler Köyü',
  phone: '0553 460 6678',
} as const

export const PDF_THEME = {
  primary: [30, 58, 109] as const,
  primaryHex: '#1e3a6d',
  border: [203, 213, 225] as const,
  text: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  zebra: [248, 250, 252] as const,
  warning: [180, 83, 9] as const,
  warningBg: [255, 251, 235] as const,
  paymentTotal: [239, 246, 255] as const,
  paymentPaid: [240, 253, 244] as const,
  paymentDue: [255, 251, 235] as const,
  margin: 28,
  marginCompact: 24,
  headerHeight: 64,
  headerHeightCompact: 50,
  footerY: 778,
} as const

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPdfCurrency(value: number) {
  const formatted = currencyFormatter.format(Number(value))
  return formatted.replace(/\s?TL\b/u, '₺').replace(/\u00A0/g, ' ')
}

export function formatPdfDate(dateKey: string) {
  return formatTurkeyDateKey(dateKey)
}

export function formatPdfToday() {
  return formatPdfDate(getTurkeyDateKey())
}

export function sanitizePdfFileName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
