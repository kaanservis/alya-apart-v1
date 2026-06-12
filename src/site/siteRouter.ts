export type SitePage = 'home' | 'private-room'

export interface SiteLocation {
  page: SitePage
  roomShareSlug?: string
}

const SITE_BASE = '/site'

export function readSiteLocation(): SiteLocation {
  const pathname = window.location.pathname.replace(/\/+$/, '') || SITE_BASE

  if (pathname === SITE_BASE || pathname === `${SITE_BASE}/`) {
    return { page: 'home' }
  }

  const privateMatch = pathname.match(/^\/site\/r\/([^/]+)$/)
  if (privateMatch) {
    return {
      page: 'private-room',
      roomShareSlug: decodeURIComponent(privateMatch[1]).toLowerCase(),
    }
  }

  return { page: 'home' }
}

export function getSiteHomePath() {
  return SITE_BASE
}
