export type UserRole = 'super_admin' | 'manager' | 'reception' | 'housekeeping'

export interface AdminPermissions {
  can_view_prices: boolean
  can_edit_prices: boolean
  can_view_reports: boolean
  can_delete_reservations: boolean
  can_change_dates: boolean
  can_manage_users: boolean
  can_manage_website: boolean
  can_view_customer_tc: boolean
  can_upload_photos: boolean
}

export interface AdminUser extends AdminPermissions {
  id: string
  username: string
  role: UserRole
  active: boolean
  created_at: string
}

export interface AdminSession {
  user: AdminUser
  loggedInAt: string
}

export interface AdminUserInput {
  username: string
  password: string
  role: UserRole
  active: boolean
  permissions: AdminPermissions
}

export interface AdminUserUpdateInput extends AdminUserInput {
  id: string
  password: string
}
