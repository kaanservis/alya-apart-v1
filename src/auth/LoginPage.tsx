import { useState } from 'react'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(username.trim(), password)
    } catch (loginError) {
      console.error('[auth] Login page error:', loginError)
      setError(loginError instanceof Error ? loginError.message : 'Giriş başarısız.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white">
            AA
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ALYA APART Yönetim</h1>
          <p className="mt-2 text-sm text-slate-600">Kullanıcı adı ve şifrenizle giriş yapın.</p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Kullanıcı Adı</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Şifre</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
              required
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
