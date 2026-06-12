import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, UnitStatus } from '../types/database'
import { StatusBadge } from './StatusBadge'
import { UnitCard } from './UnitCard'

const statusSummaryOrder: UnitStatus[] = [
  'Boş',
  'Dolu',
  'Çıkış Bekliyor',
  'Temizlik Bekliyor',
]

export function Dashboard() {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUnits() {
      if (!isSupabaseConfigured || !supabase) {
        setError(
          'Supabase bağlantısı yapılandırılmadı. .env dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini ekleyin.',
        )
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('accommodation_units')
        .select('*')
        .order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      setUnits(sortAccommodationUnitsByDisplayOrder((data ?? []) as AccommodationUnit[]))
      setLoading(false)
    }

    void loadUnits()
  }, [])

  const statusCounts = useMemo(() => {
    return statusSummaryOrder.reduce<Record<UnitStatus, number>>(
      (acc, status) => {
        acc[status] = units.filter((unit) => unit.status === status).length
        return acc
      },
      {
        Boş: 0,
        Dolu: 0,
        'Çıkış Bekliyor': 0,
        'Temizlik Bekliyor': 0,
      },
    )
  }, [units])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-500">Faz 1 · Kontrol Paneli</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            ALYA APART TAKİP SİSTEMİ
          </h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Tüm odaların anlık durumunu görüntüleyin.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Odalar yükleniyor...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h2 className="text-lg font-semibold">Bağlantı Hatası</h2>
            <p className="mt-2 text-sm">{error}</p>
            <p className="mt-4 text-sm">
              Supabase SQL editöründe{' '}
              <code className="rounded bg-red-100 px-1.5 py-0.5">supabase/migrations/001_initial_schema.sql</code>{' '}
              ve ardından{' '}
              <code className="rounded bg-red-100 px-1.5 py-0.5">supabase/seed.sql</code>{' '}
              dosyalarını çalıştırın.
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statusSummaryOrder.map((status) => (
                <div
                  key={status}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={status} />
                    <span className="text-3xl font-bold text-slate-900">
                      {statusCounts[status]}
                    </span>
                  </div>
                </div>
              ))}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Odalar ({units.length})
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {units.map((unit) => (
                  <UnitCard key={unit.id} unit={unit} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
