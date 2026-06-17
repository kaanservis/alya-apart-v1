import { formatMoneyByPermission } from '../auth/formatMoney'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { formatTurkeyDateKey } from '../lib/turkeyDate'
import type { PaymentRecord, AccommodationUnit, Reservation } from '../types/database'
import type { ActiveReservationRow, CashFilter, CashSummary } from './types'
import { filterActiveReservations, filterReservationsForCashSummary } from './cashFilters'

export function calculateCashSummary(
  reservations: Reservation[],
  paymentsByReservation: Map<string, PaymentRecord[]> = new Map(),
): CashSummary {
  return reservations.reduce(
    (accumulator, reservation) => {
      const payments = paymentsByReservation.get(reservation.id) ?? []
      accumulator.toplamTahsilEdilecek += Number(reservation.toplam_ucret)
      accumulator.toplamTahsilEdilen += getTotalCollected(reservation, payments)
      accumulator.toplamKalanBakiye += getRemainingBalance(reservation, payments)
      return accumulator
    },
    {
      toplamTahsilEdilecek: 0,
      toplamTahsilEdilen: 0,
      toplamKalanBakiye: 0,
    },
  )
}

export function buildActiveReservationRows(
  reservations: Reservation[],
  units: AccommodationUnit[],
  filter: CashFilter,
  paymentsByReservation: Map<string, PaymentRecord[]> = new Map(),
): ActiveReservationRow[] {
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name]))
  const activeReservations = filterActiveReservations(reservations, filter)

  return activeReservations
    .map((reservation) => {
      const payments = paymentsByReservation.get(reservation.id) ?? []

      return {
        id: reservation.id,
        guestName: reservation.ad_soyad,
        unitName: unitMap.get(reservation.konaklama_birimi_id) ?? '—',
        girisTarihi: reservation.giris_tarihi,
        cikisTarihi: reservation.cikis_tarihi,
        toplamUcret: Number(reservation.toplam_ucret),
        alinanUcret: getTotalCollected(reservation, payments),
        kalanBakiye: getRemainingBalance(reservation, payments),
      }
    })
    .sort((a, b) => a.girisTarihi.localeCompare(b.girisTarihi))
}

export function getFilteredCashSummary(
  reservations: Reservation[],
  filter: CashFilter,
  paymentsByReservation: Map<string, PaymentRecord[]> = new Map(),
): CashSummary {
  const filtered = filterReservationsForCashSummary(reservations, filter)
  return calculateCashSummary(filtered, paymentsByReservation)
}

export function formatCurrency(value: number, canViewPrices = true) {
  return formatMoneyByPermission(value, canViewPrices)
}

export function formatDate(value: string) {
  return formatTurkeyDateKey(value)
}
