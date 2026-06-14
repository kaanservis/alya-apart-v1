import { useEffect, useMemo, useState } from 'react'
import { getActiveSeasonYear } from '../calendar/dateUtils'
import { useSiteSeo } from '../site/useSiteSeo'
import { BackupPage } from '../backup/BackupPage'
import { CashPage } from '../cash/CashPage'
import { ExpensesPage } from '../expenses/ExpensesPage'
import { useExpenses } from '../expenses/useExpenses'
import { CustomersPage } from '../customers/CustomersPage'
import { ReportsPage } from '../reports/ReportsPage'
import { RoomsAdminPage } from '../rooms-admin/RoomsAdminPage'
import { SettingsPage } from '../settings/SettingsPage'
import { WebsiteManagementPage } from '../website-admin/WebsiteManagementPage'
import { CalendarViewSection } from '../calendar/CalendarViewSection'
import { ReservationHistoryPage } from '../reservations/ReservationHistoryPage'
import { ReservationsManagementPage } from '../reservations/ReservationsManagementPage'
import { useWorkflowData } from '../workflow/useWorkflowData'
import { WorkflowDashboard } from '../workflow/WorkflowDashboard'
import { AppSidebar } from './AppSidebar'
import {
  APP_ROUTES,
  readTabFromLocation,
  writeTabToLocation,
  type AppTab,
} from './routes'
import { ensureAdminPath } from './appSection'

function usesSharedWorkflowData(tab: AppTab) {
  return tab === 'dashboard' || tab === 'calendar' || tab === 'cash' || tab === 'reservations'
}

export function AppShellPage() {
  useSiteSeo({
    title: 'ALYA APART Yönetim',
    description: 'ALYA APART iç yönetim paneli.',
    path: '/admin',
    noIndex: true,
  })

  const seasonYear = useMemo(() => getActiveSeasonYear(new Date()), [])
  const [activeTab, setActiveTab] = useState<AppTab>(() => readTabFromLocation())
  const [refreshToken, setRefreshToken] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const { units, reservations, loading, error, refetch } = useWorkflowData(seasonYear)
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses(refreshToken)

  useEffect(() => {
    ensureAdminPath()
    writeTabToLocation(activeTab)
  }, [activeTab])

  useEffect(() => {
    function handleHashChange() {
      setActiveTab(readTabFromLocation())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleTabChange(tab: AppTab) {
    setActiveTab(tab)
    writeTabToLocation(tab)
  }

  function handleUpdated() {
    refetch()
    setRefreshToken((current) => current + 1)
  }

  function handleExpensesUpdated() {
    setRefreshToken((current) => current + 1)
  }

  const activeRoute = APP_ROUTES.find((route) => route.id === activeTab)

  const headerDescription: Record<AppTab, string> = {
    dashboard:
      'Doluluk, çıkışlar, temizlik uyarıları ve rezervasyon durumlarını tek ekranda takip edin.',
    calendar:
      'Aylık, haftalık, günlük ve sezonluk görünümlerde rezervasyon doluluklarını takip edin.',
    reservations:
      'Yeni rezervasyon oluşturun, mevcut kayıtları düzenleyin ve aktif rezervasyonları yönetin.',
    customers:
      'Tüm misafirleri ve rezervasyonları arayın, filtreleyin, düzenleyin ve dışa aktarın.',
    history:
      'Tamamlanmış rezervasyonları misafir adı, telefon, oda ve tarihe göre arayın.',
    cash: 'Rezervasyon ödemelerini ve aktif rezervasyon tahsilat durumunu görüntüleyin.',
    expenses: 'Masraf kayıtlarını ekleyin, düzenleyin ve dönemsel masraf istatistiklerini görün.',
    reports:
      'Gelir, masraf, oda performansı ve günlük doluluk raporlarını dönemsel filtrelerle inceleyin.',
    rooms: 'Oda bilgileri, açıklamalar, özellikler ve web sitesi fotoğraflarını yönetin.',
    website: 'Web sitesi başlığı, iletişim bilgileri ve adres ayarlarını yönetin.',
    settings: 'İşletme WhatsApp numarası ve iletişim ayarlarını yönetin.',
    backup: 'Tüm verileri yedekleyin, geri yükleyin ve otomatik günlük yedekleri yönetin.',
  }

  const showSharedLoading = usesSharedWorkflowData(activeTab) && loading
  const showSharedError = usesSharedWorkflowData(activeTab) && !loading && error
  const showSharedContent = usesSharedWorkflowData(activeTab) && !loading && units.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-blue-900/20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 shadow-lg shadow-blue-900/20">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl bg-white/10 p-2.5 text-white ring-1 ring-white/20 lg:hidden"
              aria-label="Menüyü aç"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                {activeRoute?.menuLabel ?? 'ALYA APART'}
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                {activeRoute?.label ?? 'ALYA APART TAKİP SİSTEMİ'}
              </h1>
              <p className="mt-1 hidden max-w-3xl text-sm text-blue-100/90 sm:block">
                {headerDescription[activeTab]}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            {showSharedLoading && (
              <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="text-sm font-medium text-slate-600">Veriler yükleniyor...</p>
              </div>
            )}

            {showSharedError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                {error}
              </div>
            )}

            {showSharedContent && activeTab === 'dashboard' && (
              <WorkflowDashboard
                units={units}
                reservations={reservations}
                onUpdated={handleUpdated}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarViewSection
                units={units}
                reservations={reservations}
                seasonYear={seasonYear}
                loading={loading}
                error={error}
              />
            )}

            {activeTab === 'reservations' && (
              <ReservationsManagementPage
                units={units}
                reservations={reservations}
                onUpdated={handleUpdated}
                loading={loading}
                error={error}
              />
            )}

            {activeTab === 'customers' && (
          <CustomersPage refreshToken={refreshToken} onUpdated={handleUpdated} />
        )}

        {activeTab === 'history' && (
              <ReservationHistoryPage refreshToken={refreshToken} />
            )}

            {showSharedContent && activeTab === 'cash' && (
              <CashPage units={units} reservations={reservations} />
            )}

            {activeTab === 'expenses' && (
              <ExpensesPage
                expenses={expenses}
                loading={expensesLoading}
                error={expensesError}
                onUpdated={handleExpensesUpdated}
              />
            )}

            {activeTab === 'reports' && <ReportsPage refreshToken={refreshToken} />}

            {activeTab === 'rooms' && (
              <RoomsAdminPage refreshToken={refreshToken} onUpdated={handleUpdated} />
            )}

            {activeTab === 'website' && <WebsiteManagementPage />}

            {activeTab === 'settings' && <SettingsPage />}

            {activeTab === 'backup' && <BackupPage onUpdated={handleUpdated} />}
          </div>
        </main>
      </div>
    </div>
  )
}
