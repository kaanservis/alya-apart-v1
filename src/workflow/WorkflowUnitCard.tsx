import { useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { DepositBadge } from '../components/DepositBadge'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { completeCheckout, completeCleaning } from './workflowService'
import { normalizeUnitStatus } from './unitStatusLogic'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'

interface WorkflowUnitCardProps {
  unit: AccommodationUnit
  activeReservation?: Reservation
  nextReservation?: Reservation
  checkoutReservationId?: string
  onUpdated: () => void
  onSelect?: () => void
}

const statusThemes: Record<
  AccommodationUnit['status'],
  { card: string; guestBox: string; nextBox: string }
> = {
  Boş: {
    card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 shadow-emerald-500/10 hover:border-emerald-300 hover:shadow-emerald-500/15',
    guestBox: 'bg-emerald-50 ring-emerald-100',
    nextBox: 'bg-blue-50 ring-blue-100',
  },
  Dolu: {
    card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50/80 shadow-rose-500/10 hover:border-rose-300 hover:shadow-rose-500/15',
    guestBox: 'bg-rose-50 ring-rose-100',
    nextBox: 'bg-blue-50 ring-blue-100',
  },
  'Çıkış Bekliyor': {
    card: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50/80 shadow-orange-500/10 hover:border-orange-300 hover:shadow-orange-500/15',
    guestBox: 'bg-orange-50 ring-orange-100',
    nextBox: 'bg-blue-50 ring-blue-100',
  },
  'Temizlik Bekliyor': {
    card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-purple-50/80 shadow-violet-500/10 hover:border-violet-300 hover:shadow-violet-500/15',
    guestBox: 'bg-violet-50 ring-violet-100',
    nextBox: 'bg-blue-50 ring-blue-100',
  },
}

export function WorkflowUnitCard({
  unit,
  activeReservation,
  nextReservation,
  checkoutReservationId,
  onUpdated,
  onSelect,
}: WorkflowUnitCardProps) {
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const theme = statusThemes[normalizeUnitStatus(unit.status)]

  async function handleCompleteCheckout() {
    if (!checkoutReservationId) {
      return
    }

    setProcessing(true)
    setActionError(null)

    try {
      await completeCheckout(checkoutReservationId, unit.id)
      onUpdated()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Çıkış tamamlanamadı.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleCompleteCleaning() {
    setProcessing(true)
    setActionError(null)

    try {
      await completeCleaning(unit.id)
      onUpdated()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Temizlik tamamlanamadı.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <article
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onSelect()
        }
      }}
      className={`group rounded-2xl border p-5 shadow-sm ring-1 ring-slate-100/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${theme.card} ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-2xl font-bold tracking-tight text-slate-900">{unit.name}</h3>
        </div>
        <WorkflowStatusBadge status={normalizeUnitStatus(unit.status)} />
      </div>

      {activeReservation && (
        <div className={`mt-4 rounded-xl px-4 py-3 ring-1 ${theme.guestBox}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Misafir
          </p>
          <p className="mt-1 text-base font-bold text-slate-900">{activeReservation.ad_soyad}</p>
          <div className="mt-2">
            <DepositBadge reservation={activeReservation} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Çıkış: {formatReservationDate(activeReservation.cikis_tarihi)}
          </p>
          <div className="mt-3" onClick={(event) => event.stopPropagation()}>
            <WhatsAppGuestActions
              phone={activeReservation.telefon}
              adSoyad={activeReservation.ad_soyad}
              kalanBakiye={activeReservation.kalan_bakiye}
              compact
            />
          </div>
        </div>
      )}

      {nextReservation && (
        <div className={`mt-4 rounded-xl px-4 py-3 ring-1 ${theme.nextBox}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Sonraki Misafir
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{nextReservation.ad_soyad}</p>
          <p className="mt-2 text-sm text-slate-600">
            Giriş: {formatReservationDate(nextReservation.giris_tarihi)}
          </p>
        </div>
      )}

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {actionError}
        </p>
      )}

      {normalizeUnitStatus(unit.status) === 'Çıkış Bekliyor' && checkoutReservationId && (
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation()
            void handleCompleteCheckout()
          }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 disabled:opacity-60"
        >
          {processing ? 'İşleniyor...' : 'Çıkışı Tamamla'}
        </button>
      )}

      {normalizeUnitStatus(unit.status) === 'Temizlik Bekliyor' && (
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation()
            void handleCompleteCleaning()
          }}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-60"
        >
          {processing ? 'İşleniyor...' : 'Temizlik Tamamlandı'}
        </button>
      )}
    </article>
  )
}
