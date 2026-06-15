import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  PERMISSION_LABELS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
} from '../auth/permissions'
import type { AdminPermissions, AdminUser, AdminUserInput, UserRole } from '../auth/types'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '../auth/authService'

const ROLE_OPTIONS: UserRole[] = ['super_admin', 'manager', 'reception', 'housekeeping']

interface UserFormState {
  username: string
  password: string
  role: UserRole
  active: boolean
  permissions: AdminPermissions
}

function buildFormState(user?: AdminUser): UserFormState {
  if (user) {
    return {
      username: user.username,
      password: '',
      role: user.role,
      active: user.active,
      permissions: {
        can_view_prices: user.can_view_prices,
        can_edit_prices: user.can_edit_prices,
        can_view_reports: user.can_view_reports,
        can_delete_reservations: user.can_delete_reservations,
        can_change_dates: user.can_change_dates,
        can_manage_users: user.can_manage_users,
        can_manage_website: user.can_manage_website,
        can_view_customer_tc: user.can_view_customer_tc,
        can_upload_photos: user.can_upload_photos,
      },
    }
  }

  return {
    username: '',
    password: '',
    role: 'reception',
    active: true,
    permissions: { ...ROLE_DEFAULT_PERMISSIONS.reception },
  }
}

export function UserManagementPage() {
  const { user: currentUser, isSuperAdmin } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UserFormState>(() => buildFormState())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const permissionKeys = useMemo(
    () => Object.keys(PERMISSION_LABELS) as (keyof AdminPermissions)[],
    [],
  )

  const loadUsers = useCallback(async () => {
    if (!currentUser) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const rows = await fetchAdminUsers(currentUser.id)
      setUsers(rows)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Kullanıcılar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  function openCreateForm() {
    setEditingUser(null)
    setForm(buildFormState())
    setShowForm(true)
    setMessage(null)
    setError(null)
  }

  function openEditForm(user: AdminUser) {
    setEditingUser(user)
    setForm(buildFormState(user))
    setShowForm(true)
    setMessage(null)
    setError(null)
  }

  function handleRoleChange(role: UserRole) {
    setForm((current) => ({
      ...current,
      role,
      permissions: { ...ROLE_DEFAULT_PERMISSIONS[role] },
    }))
  }

  function togglePermission(key: keyof AdminPermissions) {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [key]: !current.permissions[key],
      },
    }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

    if (!currentUser) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const payload: AdminUserInput = {
      username: form.username,
      password: form.password,
      role: form.role,
      active: form.active,
      permissions: form.permissions,
    }

    try {
      if (editingUser) {
        await updateAdminUser(currentUser.id, {
          ...payload,
          id: editingUser.id,
        })
        setMessage('Kullanıcı güncellendi.')
      } else {
        await createAdminUser(currentUser.id, payload)
        setMessage('Kullanıcı oluşturuldu.')
      }

      setShowForm(false)
      setEditingUser(null)
      await loadUsers()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kayıt başarısız.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(user: AdminUser) {
    if (!currentUser) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await updateAdminUser(currentUser.id, {
        id: user.id,
        username: user.username,
        password: '',
        role: user.role,
        active: !user.active,
        permissions: {
          can_view_prices: user.can_view_prices,
          can_edit_prices: user.can_edit_prices,
          can_view_reports: user.can_view_reports,
          can_delete_reservations: user.can_delete_reservations,
          can_change_dates: user.can_change_dates,
          can_manage_users: user.can_manage_users,
          can_manage_website: user.can_manage_website,
          can_view_customer_tc: user.can_view_customer_tc,
          can_upload_photos: user.can_upload_photos,
        },
      })
      setMessage(user.active ? 'Kullanıcı devre dışı bırakıldı.' : 'Kullanıcı etkinleştirildi.')
      await loadUsers()
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Durum güncellenemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(userId: string) {
    if (!currentUser) {
      return
    }

    if (deleteConfirmId !== userId) {
      setDeleteConfirmId(userId)
      return
    }

    setSaving(true)
    setError(null)

    try {
      await deleteAdminUser(currentUser.id, userId)
      setMessage('Kullanıcı silindi.')
      setDeleteConfirmId(null)
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Kullanıcı silinemedi.')
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Bu sayfaya yalnızca Super Admin erişebilir.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h2>
            <p className="mt-1 text-sm text-slate-600">
              Kullanıcı oluşturun, düzenleyin, devre dışı bırakın ve izinleri yönetin.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Kullanıcı Ekle
          </button>
        </div>
      </section>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-bold text-slate-900">
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
          </h3>

          <form onSubmit={(event) => void handleSave(event)} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Kullanıcı Adı</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  {editingUser ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre'}
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                  required={!editingUser}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Rol</span>
                <select
                  value={form.role}
                  onChange={(event) => handleRoleChange(event.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-blue-600 focus:ring-2"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 pt-8 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                Hesap aktif
              </label>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">İzinler</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissionKeys.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions[key]}
                      onChange={() => togglePermission(key)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-700"
                    />
                    {PERMISSION_LABELS[key]}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingUser(null)
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                İptal
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <p className="text-sm text-slate-600">Kullanıcılar yükleniyor...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-600">Kayıtlı kullanıcı yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Kullanıcı</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Durum</th>
                  <th className="px-3 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-semibold text-slate-900">{user.username}</td>
                    <td className="px-3 py-3">{ROLE_LABELS[user.role]}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {user.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(user)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          disabled={saving || user.id === currentUser?.id}
                          onClick={() => void handleToggleActive(user)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50"
                        >
                          {user.active ? 'Devre Dışı' : 'Etkinleştir'}
                        </button>
                        <button
                          type="button"
                          disabled={saving || user.role === 'super_admin'}
                          onClick={() => void handleDelete(user.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          {deleteConfirmId === user.id ? 'Silmeyi Onayla' : 'Sil'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
