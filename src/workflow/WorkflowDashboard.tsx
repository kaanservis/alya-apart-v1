import { useEffect, useMemo, useState } from 'react'
import { useCanViewPrices } from '../auth/useFormatAdminCurrency'
import type { AccommodationUnit, Reservation } from '../types/database'
import { CustomerDetailPanel } from '../customers/CustomerDetailPanel'
import { SupabaseConnectionTest } from '../components/SupabaseConnectionTest'
import { GuestCheckInPanel } from '../guests/GuestCheckInPanel'
import { exportGuestRegistrationPdf } from '../guests/guestRegistrationPdf'
import { RoomDetailPanel } from '../rooms/RoomDetailPanel'
import { ReservationFormPanel } from '../reservations/ReservationFormPanel'
import { CheckoutAlertSection } from './CheckoutAlertSection'
import { CleaningAlertSection } from './CleaningAlertSection'
import {
  findActiveReservationForUnit,
  findNextReservationForUnit,
  getCheckoutPendingGuests,
  getUnitStatusCounts,
} from './unitStatusLogic'
import { QuickBackupButton } from '../backup/QuickBackupButton'
import {
  adminPageStack,
  adminPageEyebrow,
  adminPageTitle,
  adminPrimaryCta,
  adminPrimaryCtaIcon,
  adminPrimaryCtaSubtitle,
  adminPrimaryCtaTitle,
  adminDashboardCompactStatGrid,
  adminDashboardCompactStatBox,
} from '../components/admin/adminMobileStyles'
import { WorkflowUnitCard } from './WorkflowUnitCard'

interface WorkflowDashboardProps {
  units: AccommodationUnit[]
  reservations: Reservation[]
  onUpdated: () => void
  onOdaKabulComplete?: () => void
}

const COMPACT_DASHBOARD_STATS: {
  countKey: keyof ReturnType<typeof getUnitStatusCounts>
  label: string
  boxClass: string
}[] = [
  { countKey: 'dolu', label: 'Dolu', boxClass: 'border-rose-200 bg-rose-50 text-rose-900' },
  { countKey: 'bos', label: 'Boş', boxClass: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  {
    countKey: 'cikisBekliyor',
    label: 'Çıkış',
    boxClass: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  {
    countKey: 'temizlikBekliyor',
    label: 'Temiz',
    boxClass: 'border-violet-200 bg-violet-50 text-violet-900',
  },
]

export function WorkflowDashboard({
  units,
  reservations,
  onUpdated,
  onOdaKabulComplete,
}: WorkflowDashboardProps) {
  const canViewPrices = useCanViewPrices()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [checkInReservation, setCheckInReservation] = useState<Reservation | null>(null)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [pendingDetailReservation, setPendingDetailReservation] = useState<Reservation | null>(null)

  function handleWorkflowUpdated() {
    onUpdated()
  }

  function handleOdaKabulComplete() {
    setCheckInReservation(null)
    setSelectedUnitId(null)
    onOdaKabulComplete?.()
  }

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

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId),
    [units, selectedUnitId],
  )

  const checkInUnit = useMemo(() => {
    if (!checkInReservation) {
      return null
    }

    return units.find((unit) => unit.id === checkInReservation.konaklama_birimi_id) ?? null
  }, [checkInReservation, units])

  const unitNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units],
  )

  const detailReservation = useMemo(() => {
    if (!selectedReservationId) {
      return null
    }

    const fromList = reservations.find((reservation) => reservation.id === selectedReservationId)
    if (fromList) {
      return fromList
    }

    if (pendingDetailReservation?.id === selectedReservationId) {
      return pendingDetailReservation
    }

    return null
  }, [selectedReservationId, reservations, pendingDetailReservation])

  useEffect(() => {
    if (
      pendingDetailReservation &&
      reservations.some((reservation) => reservation.id === pendingDetailReservation.id)
    ) {
      setPendingDetailReservation(null)
    }
  }, [reservations, pendingDetailReservation])

  function handleSaved(savedReservation?: Reservation) {
    handleWorkflowUpdated()
    setShowCreateForm(false)
    setFormKey((current) => current + 1)

    if (savedReservation) {
      setPendingDetailReservation(savedReservation)
      setSelectedReservationId(savedReservation.id)
    }
  }

  return (
    <div className={adminPageStack}>
      <section>
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className={`${adminPrimaryCta} ${
            showCreateForm ? 'ring-4 ring-blue-200' : ''
          }`}
        >
          <div className="absolute -right-8 -top-8 hidden h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-110 sm:block" />
          <div className="absolute -bottom-10 -left-10 hidden h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl sm:block" />
          <div className="relative flex flex-row items-center justify-center gap-2 sm:flex-row sm:gap-6">
            <span className={adminPrimaryCtaIcon}>+</span>
            <div className="text-center sm:text-left">
              <p className={adminPrimaryCtaTitle}>Yeni Rezervasyon</p>
              <p className={adminPrimaryCtaSubtitle}>
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

      <section className={adminDashboardCompactStatGrid} aria-label="Oda durum özeti">
        {COMPACT_DASHBOARD_STATS.map((stat) => (
          <div
            key={stat.countKey}
            className={`${adminDashboardCompactStatBox} dashboard-compact-stat ${stat.boxClass}`}
          >
            <p className="dashboard-compact-stat-count text-2xl font-bold sm:text-3xl">
              {statusCounts[stat.countKey]}
            </p>
            <p className="dashboard-compact-stat-label mt-0.5 text-[10px] font-semibold sm:text-xs">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-1 max-md:mb-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={adminPageEyebrow}>Oda Listesi</p>
            <h2 className={`${adminPageTitle} max-md:mt-0.5`}>Odalar</h2>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 max-md:text-[10px] sm:px-3 sm:py-1 sm:text-sm">
            {units.length} oda
          </span>
        </div>

        <div className="grid gap-3 max-md:gap-1.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
                onUpdated={handleWorkflowUpdated}
                onSelect={() => setSelectedUnitId(unit.id)}
                onOpenCheckIn={(reservation) => setCheckInReservation(reservation)}
                onOpenPayment={() => setSelectedUnitId(unit.id)}
                onOpenPdf={(reservation) => {
                  void exportGuestRegistrationPdf(unit.name, reservation, canViewPrices)
                }}
              />
            )
          })}
        </div>
      </section>

      <section className="grid gap-3 max-md:gap-2.5 sm:gap-5 lg:grid-cols-2">
        <CheckoutAlertSection
          units={units}
          reservations={reservations}
          onUpdated={handleWorkflowUpdated}
        />
        <CleaningAlertSection
          units={units}
          reservations={reservations}
          onUpdated={handleWorkflowUpdated}
        />
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
          onUpdated={handleWorkflowUpdated}
          onOdaKabulComplete={handleOdaKabulComplete}
        />
      )}

      {checkInReservation && checkInUnit && (
        <GuestCheckInPanel
          open
          onClose={() => setCheckInReservation(null)}
          reservation={checkInReservation}
          unitName={checkInUnit.name}
          onUpdated={handleWorkflowUpdated}
          onOdaKabulComplete={handleOdaKabulComplete}
        />
      )}

      {detailReservation && (
        <CustomerDetailPanel
          reservation={detailReservation}
          unitName={unitNameById.get(detailReservation.konaklama_birimi_id) ?? '—'}
          units={units}
          reservations={reservations}
          onClose={() => setSelectedReservationId(null)}
          onUpdated={handleWorkflowUpdated}
        />
      )}
    </div>
  )
}
