import { useEffect, useMemo, useState } from 'react'
import type { AccommodationUnit, Reservation } from '../types/database'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { SlideOverPanel } from '../components/SlideOverPanel'
import { WhatsAppGuestActions } from '../components/whatsapp/WhatsAppGuestActions'
import { exportGuestRegistrationPdf } from '../guests/guestRegistrationPdf'
import { exportRoomReservationsExcel } from '../customers/customerExports'
import { findRoomReservations } from '../customers/customerListUtils'
import { formatReservationDate } from '../reservations/reservationDisplay'
import { getRemainingBalance } from '../reservations/depositCalculations'
import { ReservationTahsilatSection } from '../reservations/ReservationTahsilatSection'
import { RoomGuestsSection } from '../guests/RoomGuestsSection'
import {
  findActiveReservationForUnit,
  findLastGuestForUnit,
  getTodayKey,
  normalizeUnitStatus,
} from '../workflow/unitStatusLogic'
import { completeCheckout, completeCleaning } from '../workflow/workflowService'
import { WorkflowStatusBadge } from '../workflow/WorkflowStatusBadge'

interface RoomDetailPanelProps {
  unit: AccommodationUnit
  reservations: Reservation[]
  checkoutReservationId?: string
  onClose: () => void
  onUpdated: () => void
}

export function RoomDetailPanel({
  unit,
  reservations,
  checkoutReservationId,
  onClose,
  onUpdated,
}: RoomDetailPanelProps) {
  const [roomHistory, setRoomHistory] = useState<Reservation[]>([])
  const [activeReservationState, setActiveReservationState] = useState<Reservation | null>(null)
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const unitStatus = normalizeUnitStatus(unit.status)

  useEffect(() => {
    async function loadRoomHistory() {
      if (!isSupabaseConfigured || !supabase) {
        setRoomHistory(findRoomReservations(reservations, unit.id))
        return
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('konaklama_birimi_id', unit.id)
        .order('giris_tarihi', { ascending: false })

      if (error) {
        setRoomHistory(findRoomReservations(reservations, unit.id))
        return
      }

      setRoomHistory((data ?? []) as Reservation[])
    }

    void loadRoomHistory()
  }, [unit.id, reservations])

  const activeReservation = useMemo(
    () => findActiveReservationForUnit(unit.id, reservations),
    [unit.id, reservations],
  )

  useEffect(() => {
    setActiveReservationState(activeReservation ?? null)
  }, [activeReservation])

  const lastGuest = useMemo(
    () => findLastGuestForUnit(unit.id, reservations),
    [unit.id, reservations],
  )

  const upcomingReservations = useMemo(() => {
    const today = getTodayKey()

    return reservations
      .filter((reservation) => {
        if (reservation.konaklama_birimi_id !== unit.id || reservation.durum !== 'Aktif') {
          return false
        }

        if (activeReservation?.id === reservation.id) {
          return false
        }

        if (activeReservationState ?? activeReservation) {
          const current = activeReservationState ?? activeReservation
          return reservation.giris_tarihi >= current!.cikis_tarihi
        }

        return reservation.giris_tarihi > today
      })
      .sort((a, b) => a.giris_tarihi.localeCompare(b.giris_tarihi, 'tr'))
  }, [unit.id, reservations, activeReservation, activeReservationState])

  const displayedReservation = activeReservationState ?? activeReservation
  const checkoutId = checkoutReservationId ?? displayedReservation?.id

  function handleGuestCountChange(kisiSayisi: number) {
    if (!displayedReservation) {
      return
    }

    setActiveReservationState((current) => {
      const base = current ?? displayedReservation
      if (!base) {
        return current
      }

      return { ...base, kisi_sayisi: kisiSayisi }
    })
  }

  async function handleCompleteCheckout() {
    if (!checkoutId) {
      return
    }

    setProcessing(true)
    setActionError(null)

    try {
      await completeCheckout(checkoutId, unit.id)
      onUpdated()
      onClose()
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
      onClose()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Temizlik tamamlanamadı.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <SlideOverPanel
      open
      onClose={onClose}
      title={unit.name}
      subtitle="Oda detayları"
      wide
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <WorkflowStatusBadge status={unitStatus} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!displayedReservation}
              onClick={() => {
                if (displayedReservation) {
                  void exportGuestRegistrationPdf(unit.name, displayedReservation)
                }
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Misafir Listesi PDF
            </button>
            <button
              type="button"
              disabled={roomHistory.length === 0}
              onClick={() => void exportRoomReservationsExcel(unit.name, roomHistory)}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Excel Export
            </button>
          </div>
        </div>

        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {displayedReservation ? (
          <section className="rounded-2xl border border-purple-200 bg-[#F3E8FF]/80 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-900">
              Mevcut Misafir
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Misafir</dt>
                <dd className="text-lg font-bold text-slate-900">{displayedReservation.ad_soyad}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Giriş</dt>
                <dd className="font-semibold text-slate-900">
                  {formatReservationDate(displayedReservation.giris_tarihi)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Çıkış</dt>
                <dd className="font-semibold text-slate-900">
                  {formatReservationDate(displayedReservation.cikis_tarihi)}
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-purple-100 pt-5">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                Ödeme
              </h4>
              <ReservationTahsilatSection
                reservation={displayedReservation}
                onUpdated={(updated) => {
                  setActiveReservationState(updated)
                  onUpdated()
                }}
              />
            </div>
            <div className="mt-5 border-t border-purple-100 pt-5">
              <WhatsAppGuestActions
                phone={displayedReservation.telefon}
                adSoyad={displayedReservation.ad_soyad}
                kalanBakiye={getRemainingBalance(displayedReservation)}
              />
            </div>
            <div className="mt-5 border-t border-purple-100 pt-5">
              <RoomGuestsSection
                reservation={displayedReservation}
                onGuestCountChange={handleGuestCountChange}
              />
            </div>
          </section>
        ) : unitStatus === 'Temizlik Bekliyor' ? (
          <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-violet-800">
              Temizlik Gerekli
            </h3>
            <p className="mt-3 text-sm text-slate-700">
              Son misafir: <span className="font-bold">{lastGuest?.ad_soyad ?? '—'}</span>
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <p className="text-sm font-semibold text-emerald-800">Bu oda şu anda müsait.</p>
          </section>
        )}

        {unitStatus === 'Çıkış Bekliyor' && checkoutId && (
          <button
            type="button"
            disabled={processing}
            onClick={handleCompleteCheckout}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 sm:text-lg"
          >
            {processing ? 'İşleniyor...' : 'Çıkışı Tamamla'}
          </button>
        )}

        {unitStatus === 'Temizlik Bekliyor' && (
          <button
            type="button"
            disabled={processing}
            onClick={handleCompleteCleaning}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 sm:text-lg"
          >
            {processing ? 'İşleniyor...' : 'Temizlik Tamamlandı'}
          </button>
        )}

        {upcomingReservations.length > 0 && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">
              Yaklaşan Rezervasyonlar
            </h3>
            <ul className="mt-4 space-y-3">
              {upcomingReservations.map((reservation) => (
                <li
                  key={reservation.id}
                  className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">{reservation.ad_soyad}</p>
                  <p className="mt-1 text-slate-600">
                    Giriş: {formatReservationDate(reservation.giris_tarihi)} • Çıkış:{' '}
                    {formatReservationDate(reservation.cikis_tarihi)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Oda Rezervasyon Geçmişi
          </h3>
          {roomHistory.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Kayıt bulunmuyor.</p>
          ) : (
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {roomHistory.map((reservation) => (
                <li
                  key={reservation.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">
                    {reservation.ad_soyad} • {reservation.durum}
                  </p>
                  <p className="mt-1 text-slate-600">
                    {formatReservationDate(reservation.giris_tarihi)} —{' '}
                    {formatReservationDate(reservation.cikis_tarihi)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SlideOverPanel>
  )
}
