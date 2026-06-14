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

export function getTabFromPath(pathname: string): AppTab {
  const normalized = pathname.replace(/^#\/?/, '').split('?')[0]
  const route = APP_ROUTES.find((entry) => entry.path.slice(1) === normalized)
  return route?.id ?? DEFAULT_TAB
}

export function getPathForTab(tab: AppTab): string {
  const route = APP_ROUTES.find((entry) => entry.id === tab)
  return route?.path ?? APP_ROUTES[0].path
}

export function readTabFromLocation(): AppTab {
  if (window.location.pathname.startsWith('/admin')) {
    const hashPath = window.location.hash.replace(/^#\/?/, '').split('?')[0]
    if (!hashPath) {
      return DEFAULT_TAB
    }
  }

  return getTabFromPath(window.location.hash || getPathForTab(DEFAULT_TAB))
}

export function writeTabToLocation(tab: AppTab) {
  ensureAdminPath()
  const path = getPathForTab(tab)
  if (window.location.hash.replace(/^#\/?/, '').split('?')[0] !== path.slice(1)) {
    window.location.hash = path
  }
}
