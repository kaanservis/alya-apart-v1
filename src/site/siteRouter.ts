export type SitePage = 'home' | 'private-room'

export interface SiteLocation {
  page: SitePage
  roomShareSlug?: string
}

export function readSiteLocation(): SiteLocation {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/' || pathname === '') {
    return { page: 'home' }
  }

  const privateMatch = pathname.match(/^\/r\/([^/]+)$/)
  if (privateMatch) {
    return {
      page: 'private-room',
      roomShareSlug: decodeURIComponent(privateMatch[1]).toLowerCase(),
    }
  }

  return { page: 'home' }
}

export function getSiteHomePath() {
  return '/'
}
