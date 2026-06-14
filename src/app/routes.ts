export type AppTab =
  | 'dashboard'
  | 'calendar'
  | 'reservations'
  | 'customers'
  | 'history'
  | 'cash'
  | 'expenses'
  | 'reports'
  | 'rooms'
  | 'website'
  | 'settings'
  | 'backup'

export interface AppRoute {
  id: AppTab
  path: string
  label: string
  menuLabel: string
}

export const APP_ROUTES: AppRoute[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Kontrol Paneli',
    menuLabel: 'Kontrol Paneli',
  },
  {
    id: 'calendar',
    path: '/calendar',
    label: 'Takvim',
    menuLabel: 'Takvim',
  },
  {
    id: 'reservations',
    path: '/reservations',
    label: 'Rezervasyonlar',
    menuLabel: 'Rezervasyonlar',
  },
  {
    id: 'customers',
    path: '/customers',
    label: 'Müşteriler',
    menuLabel: 'Müşteriler',
  },
  {
    id: 'history',
    path: '/history',
    label: 'Rezervasyon Geçmişi',
    menuLabel: 'Geçmiş',
  },
  {
    id: 'cash',
    path: '/cash',
    label: 'Kasa',
    menuLabel: 'Kasa',
  },
  {
    id: 'expenses',
    path: '/expenses',
    label: 'Masraflar',
    menuLabel: 'Masraflar',
  },
  {
    id: 'reports',
    path: '/reports',
    label: 'Raporlar',
    menuLabel: 'Raporlar',
  },
  {
    id: 'rooms',
    path: '/rooms',
    label: 'Odalar',
    menuLabel: 'Odalar',
  },
  {
    id: 'website',
    path: '/website',
    label: 'Web Sitesi Yönetimi',
    menuLabel: '🌐 Web Sitesi Yönetimi',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Ayarlar',
    menuLabel: 'Ayarlar',
  },
  {
    id: 'backup',
    path: '/backup',
    label: 'Yedekleme',
    menuLabel: 'Yedekleme',
  },
]

import { ensureAdminPath } from './appSection'

const DEFAULT_TAB: AppTab = 'dashboard'

function normalizeTabSegment(pathname: string): string {
  return pathname.replace(/^#\/?/, '').replace(/^\//, '').split('?')[0]
}

export function getTabFromPath(pathname: string): AppTab {
  const normalized = normalizeTabSegment(pathname)
  const route = APP_ROUTES.find((entry) => entry.path.slice(1) === normalized)
  return route?.id ?? DEFAULT_TAB
}

export function getPathForTab(tab: AppTab): string {
  const route = APP_ROUTES.find((entry) => entry.id === tab)
  return route?.path ?? APP_ROUTES[0].path
}

export function readTabFromLocation(): AppTab {
  if (window.location.pathname.startsWith('/admin')) {
    const hashPath = normalizeTabSegment(window.location.hash)
    if (!hashPath) {
      return DEFAULT_TAB
    }
    return getTabFromPath(window.location.hash)
  }

  return getTabFromPath(window.location.hash || getPathForTab(DEFAULT_TAB))
}

export function writeTabToLocation(tab: AppTab) {
  ensureAdminPath()
  const path = getPathForTab(tab)
  const tabSegment = path.slice(1)
  if (normalizeTabSegment(window.location.hash) !== tabSegment) {
    window.location.hash = `#/${tabSegment}`
  }
}
