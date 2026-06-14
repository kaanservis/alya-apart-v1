export { PDF_FONT_FAMILY, PDF_FONT_NAME, registerPdfFonts } from '../lib/pdfFonts'

export async function loadOptionalLogoDataUrl() {
  try {
    const response = await fetch('/favicon.svg')
    if (!response.ok) {
      return null
    }

    const svgText = await response.text()
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(svgBlob)

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = reject
        element.src = objectUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = 120
      canvas.height = 120
      const context = canvas.getContext('2d')

      if (!context) {
        return null
      }

      context.drawImage(image, 0, 0, 120, 120)
      return canvas.toDataURL('image/png')
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch {
    return null
  }
}
