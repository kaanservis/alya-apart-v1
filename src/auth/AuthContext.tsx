import { ADMIN_ENTRY_PATH } from '../app/appSection'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginAdmin } from './authService'
import { hasPermission, isSuperAdmin } from './permissions'
import { clearAdminSession, loadAdminSession, saveAdminSession } from './sessionStorage'
import type { AdminPermissions, AdminUser } from './types'

interface AuthContextValue {
  user: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (key: keyof AdminPermissions) => boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function redirectToAdminDashboard() {
  const target = ADMIN_ENTRY_PATH

  if (window.location.pathname.startsWith('/admin')) {
    if (window.location.href.endsWith(target) || window.location.hash === '#/dashboard') {
      return
    }

    window.history.replaceState({}, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }

  window.location.assign(target)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = loadAdminSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const loggedInUser = await loginAdmin(username, password)
    saveAdminSession(loggedInUser)
    setUser(loggedInUser)
    redirectToAdminDashboard()
  }, [])

  const logout = useCallback(() => {
    clearAdminSession()
    setUser(null)
    window.history.replaceState({}, '', ADMIN_ENTRY_PATH)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      hasPermission: (key) => hasPermission(user, key),
      isSuperAdmin: isSuperAdmin(user),
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useAuthOptional() {
  return useContext(AuthContext)
}
