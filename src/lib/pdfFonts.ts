import type { jsPDF } from 'jspdf'

const NOTO_SANS_REGULAR = '/fonts/NotoSans-Regular.ttf'
const NOTO_SANS_BOLD = '/fonts/NotoSans-Bold.ttf'
const ROBOTO_REGULAR = '/fonts/Roboto-Regular.ttf'
const ROBOTO_BOLD = '/fonts/Roboto-Bold.ttf'

const FONT_CANDIDATES = {
  regular: [
    { path: NOTO_SANS_REGULAR, vfsName: 'NotoSans-Regular.ttf' },
    { path: ROBOTO_REGULAR, vfsName: 'Roboto-Regular.ttf' },
  ],
  bold: [
    { path: NOTO_SANS_BOLD, vfsName: 'NotoSans-Bold.ttf' },
    { path: ROBOTO_BOLD, vfsName: 'Roboto-Bold.ttf' },
  ],
} as const

export const PDF_FONT_FAMILY = 'AlyaPdfFont'
export const PDF_FONT_NAME = 'Noto Sans'

interface CachedFontBundle {
  regularVfs: string
  regularBase64: string
  boldVfs: string
  boldBase64: string
  source: typeof PDF_FONT_NAME | 'Roboto'
}

let cachedFonts: CachedFontBundle | null = null

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

async function loadFontFile(candidates: readonly { path: string; vfsName: string }[]) {
  for (const candidate of candidates) {
    const response = await fetch(candidate.path)
    if (response.ok) {
      return {
        path: candidate.path,
        vfsName: candidate.vfsName,
        buffer: await response.arrayBuffer(),
      }
    }
  }

  return null
}

async function ensureFontBundleLoaded() {
  if (cachedFonts) {
    return cachedFonts
  }

  const [regular, bold] = await Promise.all([
    loadFontFile(FONT_CANDIDATES.regular),
    loadFontFile(FONT_CANDIDATES.bold),
  ])

  if (!regular || !bold) {
    throw new Error('PDF yazı tipleri yüklenemedi. public/fonts/NotoSans dosyalarını kontrol edin.')
  }

  const usingNoto =
    regular.path === NOTO_SANS_REGULAR && bold.path === NOTO_SANS_BOLD

  cachedFonts = {
    regularVfs: regular.vfsName,
    regularBase64: arrayBufferToBase64(regular.buffer),
    boldVfs: bold.vfsName,
    boldBase64: arrayBufferToBase64(bold.buffer),
    source: usingNoto ? PDF_FONT_NAME : 'Roboto',
  }

  return cachedFonts
}

export async function registerPdfFonts(doc: jsPDF) {
  const fonts = await ensureFontBundleLoaded()

  doc.addFileToVFS(fonts.regularVfs, fonts.regularBase64)
  doc.addFileToVFS(fonts.boldVfs, fonts.boldBase64)
  doc.addFont(fonts.regularVfs, PDF_FONT_FAMILY, 'normal')
  doc.addFont(fonts.boldVfs, PDF_FONT_FAMILY, 'bold')
  doc.setFont(PDF_FONT_FAMILY, 'normal')
}
