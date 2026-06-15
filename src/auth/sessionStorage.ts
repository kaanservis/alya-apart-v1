import type { AdminSession, AdminUser } from './types'
import { mapAdminUser } from './authService'

const SESSION_KEY = 'alya-apart-admin-session'

export function saveAdminSession(user: AdminUser) {
  const session: AdminSession = {
    user,
    loggedInAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('[auth] Session save failed:', error)
    throw new Error('Oturum kaydedilemedi. Tarayıcı depolama alanı kapalı olabilir.')
  }
}

export function loadAdminSession(): AdminSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AdminSession
    if (!parsed?.user?.id || !parsed.user.username) {
      return null
    }

    return {
      ...parsed,
      user: mapAdminUser(parsed.user as unknown as Record<string, unknown>),
    }
  } catch (error) {
    console.error('[auth] Session load failed:', error)
    return null
  }
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY)
}
