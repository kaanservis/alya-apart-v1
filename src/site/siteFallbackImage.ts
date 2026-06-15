const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="Görsel yok">
  <rect width="1200" height="800" fill="#e2e8f0"/>
  <rect x="420" y="260" width="360" height="280" rx="24" fill="#cbd5e1"/>
  <circle cx="520" cy="360" r="36" fill="#94a3b8"/>
  <path d="M420 500 L620 380 L760 460 L900 340 L780 540 Z" fill="#94a3b8"/>
  <text x="600" y="620" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="28">Görsel yok</text>
</svg>`

export const FALLBACK_COVER_IMAGE = `data:image/svg+xml,${encodeURIComponent(FALLBACK_SVG)}`

export function resolveImageUrl(url: string | null | undefined) {
  if (!url || !url.trim()) {
    return FALLBACK_COVER_IMAGE
  }

  return url
}
