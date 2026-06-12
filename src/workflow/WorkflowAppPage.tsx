import { useMemo, useState } from 'react'
import { getActiveSeasonYear } from '../calendar/dateUtils'
import { useWorkflowData } from './useWorkflowData'
import { WorkflowCalendarSection } from './WorkflowCalendarSection'
import { WorkflowDashboard } from './WorkflowDashboard'

type AppTab = 'dashboard' | 'calendar'

export function WorkflowAppPage() {
  const seasonYear = useMemo(() => getActiveSeasonYear(new Date()), [])
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard')
  const { units, reservations, loading, error, refetch } = useWorkflowData(seasonYear)

  function handleUpdated() {
    refetch()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-500">Faz 4 · Çıkış ve Temizlik İş Akışı</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            ALYA APART TAKİP SİSTEMİ
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Çıkış günü odaları takip edin, çıkışı tamamlayın ve temizlik sürecini yönetin.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Kontrol Paneli
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Takvim
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Veriler yükleniyor...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!loading && units.length > 0 && activeTab === 'dashboard' && (
          <WorkflowDashboard
            units={units}
            reservations={reservations}
            onUpdated={handleUpdated}
          />
        )}

        {!loading && units.length > 0 && activeTab === 'calendar' && (
          <div className="flex flex-col gap-4">
            <WorkflowCalendarSection
              units={units}
              reservations={reservations}
              seasonYear={seasonYear}
              onUpdated={handleUpdated}
            />
          </div>
        )}
      </main>
    </div>
  )
}
