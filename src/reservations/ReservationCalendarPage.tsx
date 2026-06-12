import { useMemo } from 'react'
import { getActiveSeasonYear } from '../calendar/dateUtils'
import type { AccommodationUnit, Reservation } from '../types/database'
import { ReservationCalendarPanel } from './ReservationCalendarPanel'
import { useReservationCalendarData } from './useReservationCalendarData'

interface ReservationCalendarViewProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  seasonYear: number
  onUpdated: () => void
  loading?: boolean
  error?: string | null
}

export function ReservationCalendarView({
  units,
  reservations,
  seasonYear,
  onUpdated,
  loading = false,
  error = null,
}: ReservationCalendarViewProps) {
  return (
    <ReservationCalendarPanel
      units={units}
      reservations={reservations}
      seasonYear={seasonYear}
      onUpdated={onUpdated}
      loading={loading}
      error={error}
    />
  )
}

export function ReservationCalendarPage() {
  const seasonYear = useMemo(() => getActiveSeasonYear(new Date()), [])
  const { units, reservations, loading, error, refetch } = useReservationCalendarData(seasonYear)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-500">Rezervasyon Yönetimi</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            ALYA APART TAKİP SİSTEMİ
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Yeni rezervasyon oluşturun, düzenleyin veya silin. Çakışan rezervasyonlar engellenir.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <ReservationCalendarPanel
          units={units}
          reservations={reservations}
          seasonYear={seasonYear}
          loading={loading}
          error={error}
          onUpdated={refetch}
        />
      </main>
    </div>
  )
}
