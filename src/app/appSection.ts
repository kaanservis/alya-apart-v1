export type AppSection = 'site' | 'admin'

export const ADMIN_ENTRY_PATH = '/admin#/dashboard'

const ADMIN_TAB_PATHS = [
  'dashboard',
  'calendar',
  'reservations',
  'customers',
  'history',
  'cash',
  'expenses',
  'reports',
  'rooms',
  'settings',
  'backup',
]

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

export function bootstrapAppRoute() {
  const pathname = normalizePathname(window.location.pathname)
  const { hash } = window.location

  if (pathname === '/site') {
    window.history.replaceState({}, '', '/')
    return
  }

  const legacyRoomMatch = window.location.pathname.match(/^\/site\/r\/([^/]+)\/?$/)
  if (legacyRoomMatch) {
    window.history.replaceState({}, '', `/r/${legacyRoomMatch[1]}`)
    return
  }

  if (pathname.startsWith('/admin')) {
    const hashPath = hash.replace(/^#\/?/, '').split('?')[0]
    if (!hashPath) {
      window.history.replaceState({}, '', ADMIN_ENTRY_PATH)
    }
    return
  }

  const directTab = pathname.replace(/^\//, '').split('/')[0]
  if (ADMIN_TAB_PATHS.includes(directTab)) {
    window.history.replaceState({}, '', `/admin#/${directTab}`)
    return
  }

  const hashPath = hash.replace(/^#\/?/, '').split('?')[0]
  if (
    hashPath &&
    ADMIN_TAB_PATHS.some((tab) => hashPath.startsWith(tab)) &&
    !pathname.startsWith('/admin')
  ) {
    const normalizedHash = hash.startsWith('#') ? hash : `#/${hashPath}`
    window.history.replaceState({}, '', `/admin${normalizedHash}`)
  }
}

export function readAppSection(): AppSection {
  bootstrapAppRoute()

  if (window.location.pathname.startsWith('/admin')) {
    return 'admin'
  }

  return 'site'
}

export function ensureAdminPath() {
  if (!window.location.pathname.startsWith('/admin')) {
    window.history.replaceState({}, '', ADMIN_ENTRY_PATH)
    return
  }

  const hashPath = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  if (!hashPath) {
    window.history.replaceState({}, '', ADMIN_ENTRY_PATH)
  }
}
