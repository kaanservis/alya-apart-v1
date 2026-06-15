import { useAuth } from './AuthContext'
import { LoginPage } from './LoginPage'

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-blue-100 bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}
