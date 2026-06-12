export type AppSection = 'site' | 'admin'

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

export function bootstrapAppRoute() {
  const { pathname, hash } = window.location

  if (pathname.startsWith('/site') || pathname.startsWith('/admin')) {
    return
  }

  const hashPath = hash.replace(/^#\/?/, '').split('?')[0]

  if (hashPath && ADMIN_TAB_PATHS.some((tab) => hashPath.startsWith(tab))) {
    const normalizedHash = hash.startsWith('#') ? hash : `#/${hashPath}`
    window.history.replaceState({}, '', `/admin${normalizedHash}`)
    return
  }

  window.history.replaceState({}, '', '/site')
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
    window.history.replaceState({}, '', '/admin')
  }
}
