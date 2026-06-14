import { useMemo, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { SupabaseConnectionTest } from '../components/SupabaseConnectionTest'
import { RoomDetailPanel } from '../rooms/RoomDetailPanel'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { ReservationFormPanel } from '../reservations/ReservationFormPanel'
import { CheckoutAlertSection } from './CheckoutAlertSection'
import { CleaningAlertSection } from './CleaningAlertSection'
import {
  findActiveReservationForUnit,
  findLastGuestForUnit,
  findNextReservationForUnit,
  getCheckoutPendingGuests,
  getCleaningRequiredUnits,
  getUnitStatusCounts,
} from './unitStatusLogic'
import { QuickBackupButton } from '../backup/QuickBackupButton'
import { WorkflowUnitCard } from './WorkflowUnitCard'

interface WorkflowDashboardProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  onUpdated: () => void
}

type SummaryPanelKey = 'dolu' | 'bos' | 'cikis' | 'temizlik'

const summaryCards: {
  key: SummaryPanelKey
  label: string
  subtitle: string
  countKey: keyof ReturnType<typeof getUnitStatusCounts>
  gradient: string
  shadow: string
  ring: string
}[] = [
  {
    key: 'dolu',
    label: 'Dolu Odalar',
    subtitle: 'Konaklayan misafirler',
    countKey: 'dolu',
    gradient: 'from-rose-500 to-red-600',
    shadow: 'shadow-rose-500/25',
    ring: 'ring-rose-300',
  },
  {
    key: 'bos',
    label: 'Boş Odalar',
    subtitle: 'Rezervasyona açık',
    countKey: 'bos',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/25',
    ring: 'ring-emerald-300',
  },
  {
    key: 'cikis',
    label: 'Çıkış Bekleyenler',
    subtitle: 'Bugün ayrılacak',
    countKey: 'cikisBekliyor',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/25',
    ring: 'ring-amber-300',
  },
  {
    key: 'temizlik',
    label: 'Temizlik Yapılacaklar',
    subtitle: 'Temizlik gerekli',
    countKey: 'temizlikBekliyor',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/25',
    ring: 'ring-violet-300',
  },
]

export function WorkflowDashboard({ units, reservations, onUpdated }: WorkflowDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [expandedPanel, setExpandedPanel] = useState<SummaryPanelKey | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)

  const statusCounts = useMemo(() => getUnitStatusCounts(units), [units])
  const checkoutPending = useMemo(
    () => getCheckoutPendingGuests(units, reservations),
    [units, reservations],
  )

  const checkoutReservationByUnit = useMemo(() => {
    const map = new Map<string, string>()
    checkoutPending.forEach(({ reservation, unit }) => {
      map.set(unit.id, reservation.id)
    })
    return map
  }, [checkoutPending])

  const doluEntries = useMemo(() => {
    return units
      .filter((unit) => unit.status === 'Dolu')
      .map((unit) => ({
        unit,
        guest: findActiveReservationForUnit(unit.id, reservations)?.ad_soyad ?? '—',
      }))
  }, [units, reservations])

  const bosUnits = useMemo(
    () => units.filter((unit) => unit.status === 'Boş'),
    [units],
  )

  const cleaningUnits = useMemo(() => getCleaningRequiredUnits(units), [units])

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId),
    [units, selectedUnitId],
  )

  function handleSaved() {
    onUpdated()
    setShowCreateForm(false)
    setFormKey((current) => current + 1)
  }

  function toggleSummaryPanel(key: SummaryPanelKey) {
    setExpandedPanel((current) => (current === key ? null : key))
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-7 text-white shadow-xl shadow-blue-700/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-700/40 sm:px-10 sm:py-8 ${
            showCreateForm ? 'ring-4 ring-blue-200' : ''
          }`}
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-110" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
          <div className="relative flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold ring-1 ring-white/25 backdrop-blur-sm">
              +
            </span>
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold uppercase tracking-wide sm:text-3xl">
                Yeni Rezervasyon
              </p>
              <p className="mt-1 text-sm text-blue-100/90">
                {showCreateForm
                  ? 'Formu gizlemek için tıklayın'
                  : 'Yeni rezervasyon oluşturmak için tıklayın'}
              </p>
            </div>
          </div>
        </button>
      </section>

      {showCreateForm && (
        <ReservationFormPanel
          key={formKey}
          units={units}
          reservations={reservations}
          onSaved={handleSaved}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const isExpanded = expandedPanel === card.key

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => toggleSummaryPanel(card.key)}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-left text-white shadow-lg ${card.shadow} transition-all hover:-translate-y-0.5 ${
                isExpanded ? `ring-4 ${card.ring}` : ''
              }`}
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
              <div className="relative flex min-h-[120px] flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/90">{card.label}</p>
                  <p className="mt-0.5 text-xs text-white/70">{card.subtitle}</p>
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {statusCounts[card.countKey]}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </section>

      {expandedPanel && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-4 sm:px-6">
            <h3 className="text-base font-bold text-slate-900">
              {summaryCards.find((card) => card.key === expandedPanel)?.label}
            </h3>
          </div>

          <div className="p-5 sm:p-6">
            {expandedPanel === 'dolu' && (
              <>
                {doluEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">Dolu oda bulunmuyor.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {doluEntries.map(({ unit, guest }) => (
                      <li
                        key={unit.id}
                        className="rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 text-sm font-semibold text-slate-900"
                      >
                        Oda {unit.name} — {guest}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {expandedPanel === 'bos' && (
              <>
                {bosUnits.length === 0 ? (
                  <p className="text-sm text-slate-500">Boş oda bulunmuyor.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {bosUnits.map((unit) => (
                      <li
                        key={unit.id}
                        className="rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-sm font-semibold text-slate-900"
                      >
                        {unit.name}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {expandedPanel === 'cikis' && (
              <>
                {checkoutPending.length === 0 ? (
                  <p className="text-sm text-slate-500">Bugün çıkış yapacak misafir bulunmuyor.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {checkoutPending.map(({ reservation, unit }) => (
                      <li
                        key={reservation.id}
                        className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3"
                      >
                        <p className="text-sm font-bold text-slate-900">Oda {unit.name}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {reservation.ad_soyad}
                        </p>
                        <p className="mt-1 text-sm text-amber-800">
                          Çıkış: {formatReservationDate(reservation.cikis_tarihi)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {expandedPanel === 'temizlik' && (
              <>
                {cleaningUnits.length === 0 ? (
                  <p className="text-sm text-slate-500">Temizlik bekleyen oda bulunmuyor.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cleaningUnits.map((unit) => {
                      const lastGuest = findLastGuestForUnit(unit.id, reservations)

                      return (
                      <li
                        key={unit.id}
                        className="rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3"
                      >
                        <p className="text-sm font-bold text-slate-900">Oda {unit.name}</p>
                        <p className="mt-1 text-sm font-medium text-violet-700">
                          Son Misafir: {lastGuest?.ad_soyad ?? '—'}
                        </p>
                      </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Oda Listesi
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Odalar</h2>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
            {units.length} oda
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {units.map((unit) => {
            const activeReservation = findActiveReservationForUnit(unit.id, reservations)
            const nextReservation = findNextReservationForUnit(unit.id, reservations)
            const checkoutReservationId =
              checkoutReservationByUnit.get(unit.id) ?? activeReservation?.id

            return (
              <WorkflowUnitCard
                key={unit.id}
                unit={unit}
                activeReservation={activeReservation}
                nextReservation={nextReservation}
                checkoutReservationId={
                  unit.status === 'Çıkış Bekliyor' ? checkoutReservationId : undefined
                }
                onUpdated={onUpdated}
                onSelect={() => setSelectedUnitId(unit.id)}
              />
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CheckoutAlertSection units={units} reservations={reservations} onUpdated={onUpdated} />
        <CleaningAlertSection units={units} reservations={reservations} onUpdated={onUpdated} />
      </section>

      <SupabaseConnectionTest collapsible defaultCollapsed title="Sistem Durumu" />

      <QuickBackupButton />

      {selectedUnit && (
        <RoomDetailPanel
          unit={selectedUnit}
          reservations={reservations}
          checkoutReservationId={
            checkoutReservationByUnit.get(selectedUnit.id) ??
            findActiveReservationForUnit(selectedUnit.id, reservations)?.id
          }
          onClose={() => setSelectedUnitId(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  )
}
