import { ROLE_DEFAULT_PERMISSIONS } from './permissions'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { AdminPermissions, AdminUser, AdminUserInput, AdminUserUpdateInput, UserRole } from './types'

function assertClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }
  return supabase
}

const VALID_ROLES: UserRole[] = ['super_admin', 'manager', 'reception', 'housekeeping']

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole)
}

export interface AdminRpcResult {
  success?: boolean | string
  error?: string
  user_id?: string
  username?: string
  role?: string
  user?: Record<string, unknown> | string
  users?: Record<string, unknown>[]
}

export function parseAdminRpcResult(data: unknown): AdminRpcResult | null {
  if (data == null) {
    return null
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as AdminRpcResult
    } catch {
      return null
    }
  }

  if (typeof data === 'object') {
    return data as AdminRpcResult
  }

  return null
}

export function isAdminRpcSuccess(result: AdminRpcResult | null | undefined) {
  return result?.success === true || result?.success === 'true'
}

function normalizeNestedUser(value: AdminRpcResult['user']): Record<string, unknown> | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>
      return typeof parsed === 'object' && parsed ? parsed : null
    } catch {
      return null
    }
  }

  return value
}

export function mapAdminUser(raw: Record<string, unknown>): AdminUser {
  const role = isUserRole(raw.role) ? raw.role : 'reception'
  const defaults = ROLE_DEFAULT_PERMISSIONS[role]

  return {
    id: String(raw.id ?? raw.user_id ?? ''),
    username: String(raw.username ?? ''),
    role,
    active: raw.active !== false,
    can_view_prices: typeof raw.can_view_prices === 'boolean' ? raw.can_view_prices : defaults.can_view_prices,
    can_edit_prices: typeof raw.can_edit_prices === 'boolean' ? raw.can_edit_prices : defaults.can_edit_prices,
    can_view_reports: typeof raw.can_view_reports === 'boolean' ? raw.can_view_reports : defaults.can_view_reports,
    can_delete_reservations:
      typeof raw.can_delete_reservations === 'boolean'
        ? raw.can_delete_reservations
        : defaults.can_delete_reservations,
    can_change_dates: typeof raw.can_change_dates === 'boolean' ? raw.can_change_dates : defaults.can_change_dates,
    can_manage_users: typeof raw.can_manage_users === 'boolean' ? raw.can_manage_users : defaults.can_manage_users,
    can_manage_website: typeof raw.can_manage_website === 'boolean' ? raw.can_manage_website : defaults.can_manage_website,
    can_view_customer_tc:
      typeof raw.can_view_customer_tc === 'boolean' ? raw.can_view_customer_tc : defaults.can_view_customer_tc,
    can_upload_photos: typeof raw.can_upload_photos === 'boolean' ? raw.can_upload_photos : defaults.can_upload_photos,
    created_at: String(raw.created_at ?? ''),
  }
}

function mapAdminUserFromLoginResult(result: AdminRpcResult): AdminUser {
  const nestedUser = normalizeNestedUser(result.user)

  const raw: Record<string, unknown> = nestedUser ?? {
    id: result.user_id,
    username: result.username,
    role: result.role,
    active: true,
  }

  if (!raw.id && result.user_id) {
    raw.id = result.user_id
  }

  if (!raw.username && result.username) {
    raw.username = result.username
  }

  if (!raw.role && result.role) {
    raw.role = result.role
  }

  const user = mapAdminUser(raw)

  if (!user.id || !user.username) {
    throw new Error('Giriş yanıtı geçersiz: kullanıcı bilgileri eksik.')
  }

  return user
}

function permissionsToRpc(permissions: AdminPermissions) {
  return {
    p_can_view_prices: permissions.can_view_prices,
    p_can_edit_prices: permissions.can_edit_prices,
    p_can_view_reports: permissions.can_view_reports,
    p_can_delete_reservations: permissions.can_delete_reservations,
    p_can_change_dates: permissions.can_change_dates,
    p_can_manage_users: permissions.can_manage_users,
    p_can_manage_website: permissions.can_manage_website,
    p_can_view_customer_tc: permissions.can_view_customer_tc,
    p_can_upload_photos: permissions.can_upload_photos,
  }
}

async function callAdminRpc(
  fn:
    | 'authenticate_admin'
    | 'list_admin_users'
    | 'create_admin_user'
    | 'update_admin_user'
    | 'delete_admin_user',
  args: Record<string, unknown>,
) {
  const client = assertClient()
  const { data, error } = await client.rpc(fn, args as never)

  if (error) {
    console.error('[auth] RPC error:', fn, error.message, args)
    throw new Error(error.message)
  }

  return parseAdminRpcResult(data)
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser> {
  const result = await callAdminRpc('authenticate_admin', {
    p_username: username.trim(),
    p_password: password,
  })

  if (!isAdminRpcSuccess(result)) {
    console.error('[auth] Login failed:', result)
    throw new Error(result?.error ?? 'Giriş başarısız.')
  }

  return mapAdminUserFromLoginResult(result!)
}

export async function fetchAdminUsers(callerId: string): Promise<AdminUser[]> {
  const result = await callAdminRpc('list_admin_users', {
    p_caller_id: callerId,
  })

  if (!isAdminRpcSuccess(result)) {
    throw new Error(result?.error ?? 'Kullanıcılar yüklenemedi.')
  }

  return (result?.users ?? []).map((row) => mapAdminUser(row))
}

export async function createAdminUser(callerId: string, input: AdminUserInput): Promise<AdminUser> {
  const result = await callAdminRpc('create_admin_user', {
    p_caller_id: callerId,
    p_username: input.username.trim(),
    p_password: input.password,
    p_role: input.role,
    p_active: input.active,
    ...permissionsToRpc(input.permissions),
  })

  const nestedUser = normalizeNestedUser(result?.user)
  if (!isAdminRpcSuccess(result) || !nestedUser) {
    throw new Error(result?.error ?? 'Kullanıcı oluşturulamadı.')
  }

  return mapAdminUser(nestedUser)
}

export async function updateAdminUser(callerId: string, input: AdminUserUpdateInput): Promise<AdminUser> {
  const result = await callAdminRpc('update_admin_user', {
    p_caller_id: callerId,
    p_user_id: input.id,
    p_username: input.username.trim(),
    p_password: input.password.trim() === '' ? null : input.password,
    p_role: input.role,
    p_active: input.active,
    ...permissionsToRpc(input.permissions),
  })

  const nestedUser = normalizeNestedUser(result?.user)
  if (!isAdminRpcSuccess(result) || !nestedUser) {
    throw new Error(result?.error ?? 'Kullanıcı güncellenemedi.')
  }

  return mapAdminUser(nestedUser)
}

export async function deleteAdminUser(callerId: string, userId: string): Promise<void> {
  const result = await callAdminRpc('delete_admin_user', {
    p_caller_id: callerId,
    p_user_id: userId,
  })

  if (!isAdminRpcSuccess(result)) {
    throw new Error(result?.error ?? 'Kullanıcı silinemedi.')
  }
}
