import { useAuth } from '../auth/AuthContext'
import { canAccessTab } from '../auth/permissions'
import { APP_ROUTES, type AppTab } from './routes'

interface AppSidebarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const TAB_ICONS: Record<AppTab, string> = {
  dashboard: '📊',
  calendar: '📅',
  reservations: '📝',
  customers: '👥',
  history: '📋',
  cash: '💰',
  expenses: '💸',
  reports: '📈',
  rooms: '🏠',
  website: '🌐',
  settings: '⚙️',
  users: '👤',
  backup: '💾',
}

export function AppSidebar({
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  const { user, logout } = useAuth()

  const visibleRoutes = APP_ROUTES.filter((tab) => canAccessTab(user, tab.id))

  function handleSelect(tab: AppTab) {
    onTabChange(tab)
    onMobileClose()
  }

  const navContent = (
    <>
      <div className="border-b border-white/10 px-4 py-4 max-md:px-3 max-md:py-3 lg:px-5 lg:py-6">
        <div className="flex items-center gap-2.5 max-md:gap-2 lg:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 max-md:h-8 max-md:w-8 lg:h-11 lg:w-11 lg:rounded-xl">
            <span className="text-sm font-bold text-white max-md:text-xs lg:text-base">AA</span>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-100/80 max-md:text-[8px] lg:text-[10px] lg:tracking-[0.18em]">
              Otel Yönetim
            </p>
            <p className="truncate text-base font-bold tracking-tight text-white max-md:text-sm lg:text-lg">
              ALYA APART
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 max-md:gap-0.5 max-md:p-2 lg:gap-1.5 lg:p-4">
        {visibleRoutes.map((tab) => {
          const isActive = activeTab === tab.id
          const label = tab.menuLabel.replace(/^🌐\s*/, '')

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all duration-200 max-md:gap-2 max-md:px-2.5 max-md:py-1.5 max-md:text-xs lg:rounded-xl lg:px-4 lg:py-3 ${
                isActive
                  ? 'bg-white text-blue-900 shadow-md shadow-blue-900/20'
                  : 'text-blue-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black/10 text-sm max-md:h-6 max-md:w-6 max-md:text-xs lg:h-8 lg:w-8 lg:rounded-lg lg:text-base"
                aria-hidden
              >
                {TAB_ICONS[tab.id]}
              </span>
              <span className="min-w-0 truncate">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3 max-md:p-2 lg:p-4">
        <p className="truncate px-1 text-[10px] font-medium text-blue-100/80 max-md:text-[9px] lg:text-xs">
          Giriş yapan
        </p>
        <p className="truncate px-1 text-xs font-bold text-white max-md:text-[11px] lg:text-sm">
          {user?.username ?? '—'}
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 max-md:py-1.5 lg:mt-3 lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-sm"
        >
          Çıkış Yap
        </button>
      </div>
    </>
  )

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-blue-900/30 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-xl transition-transform duration-200 max-md:w-56 lg:w-64 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  )
}
