import { APP_ROUTES, type AppTab } from './routes'

interface AppSidebarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AppSidebar({
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  function handleSelect(tab: AppTab) {
    onTabChange(tab)
    onMobileClose()
  }

  const navContent = (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <span className="text-base font-bold text-white">AA</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100/80">
              Otel Yönetim
            </p>
            <p className="text-lg font-bold tracking-tight text-white">ALYA APART</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 p-4">
        {APP_ROUTES.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-900 shadow-md shadow-blue-900/20'
                  : 'text-blue-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.menuLabel}
            </button>
          )
        })}
      </nav>
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-blue-900/30 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  )
}
