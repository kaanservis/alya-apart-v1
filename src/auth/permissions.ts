import type { AppTab } from '../app/routes'
import type { AdminPermissions, AdminUser, UserRole } from './types'

export const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
  can_view_prices: 'Fiyatları görebilir',
  can_edit_prices: 'Fiyatları düzenleyebilir',
  can_view_reports: 'Raporları görebilir',
  can_delete_reservations: 'Rezervasyon silebilir',
  can_change_dates: 'Rezervasyon tarihlerini değiştirebilir',
  can_manage_users: 'Kullanıcı yönetebilir',
  can_manage_website: 'Web sitesi yönetimine erişebilir',
  can_view_customer_tc: 'Müşteri TC kimlik no görebilir',
  can_upload_photos: 'Misafir fotoğrafı yükleyebilir',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager: 'Yönetici',
  reception: 'Resepsiyon',
  housekeeping: 'Housekeeping',
}

export const ALL_PERMISSIONS: AdminPermissions = {
  can_view_prices: true,
  can_edit_prices: true,
  can_view_reports: true,
  can_delete_reservations: true,
  can_change_dates: true,
  can_manage_users: true,
  can_manage_website: true,
  can_view_customer_tc: true,
  can_upload_photos: true,
}

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, AdminPermissions> = {
  super_admin: ALL_PERMISSIONS,
  manager: {
    can_view_prices: true,
    can_edit_prices: true,
    can_view_reports: true,
    can_delete_reservations: true,
    can_change_dates: true,
    can_manage_users: false,
    can_manage_website: false,
    can_view_customer_tc: true,
    can_upload_photos: true,
  },
  reception: {
    can_view_prices: false,
    can_edit_prices: false,
    can_view_reports: false,
    can_delete_reservations: false,
    can_change_dates: false,
    can_manage_users: false,
    can_manage_website: false,
    can_view_customer_tc: true,
    can_upload_photos: true,
  },
  housekeeping: {
    can_view_prices: false,
    can_edit_prices: false,
    can_view_reports: false,
    can_delete_reservations: false,
    can_change_dates: false,
    can_manage_users: false,
    can_manage_website: false,
    can_view_customer_tc: false,
    can_upload_photos: false,
  },
}

export function isSuperAdmin(user: AdminUser | null | undefined) {
  return user?.role === 'super_admin'
}

export function hasPermission(user: AdminUser | null | undefined, key: keyof AdminPermissions) {
  if (!user) {
    return false
  }

  if (isSuperAdmin(user)) {
    return true
  }

  return user[key]
}

export function canAccessTab(user: AdminUser | null | undefined, tab: AppTab) {
  if (!user) {
    return false
  }

  if (isSuperAdmin(user)) {
    return true
  }

  switch (tab) {
    case 'reports':
    case 'backup':
      return user.can_view_reports
    case 'website':
      return user.can_manage_website
    case 'users':
      return false
    default:
      return true
  }
}

export function getDefaultTabForUser(user: AdminUser): AppTab {
  if (canAccessTab(user, 'dashboard')) {
    return 'dashboard'
  }

  const tabs: AppTab[] = [
    'dashboard',
    'calendar',
    'reservations',
    'customers',
    'history',
    'cash',
    'expenses',
    'reports',
    'rooms',
    'website',
    'settings',
    'backup',
    'users',
  ]

  return tabs.find((tab) => canAccessTab(user, tab)) ?? 'dashboard'
}
