import { MASKED_MONEY_LABEL } from '../auth/formatMoney'
import { getRemainingBalance, getTotalCollected } from '../reservations/depositCalculations'
import { formatTurkeyDateKey } from '../lib/turkeyDate'
import type { AccommodationUnit, Reservation } from '../types/database'
import type { ActiveReservationRow, CashFilter, CashSummary } from './types'
import { filterActiveReservations, filterReservationsForCashSummary } from './cashFilters'

export function calculateCashSummary(reservations: Reservation[]): CashSummary {
  return reservations.reduce(
    (accumulator, reservation) => {
      accumulator.toplamTahsilEdilecek += Number(reservation.toplam_ucret)
      accumulator.toplamTahsilEdilen += getTotalCollected(reservation)
      accumulator.toplamKalanBakiye += getRemainingBalance(reservation)
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
): ActiveReservationRow[] {
  const unitMap = new Map(units.map((unit) => [unit.id, unit.name]))
  const activeReservations = filterActiveReservations(reservations, filter)

  return activeReservations
    .map((reservation) => ({
      id: reservation.id,
      guestName: reservation.ad_soyad,
      unitName: unitMap.get(reservation.konaklama_birimi_id) ?? '—',
      girisTarihi: reservation.giris_tarihi,
      cikisTarihi: reservation.cikis_tarihi,
      toplamUcret: Number(reservation.toplam_ucret),
      alinanUcret: getTotalCollected(reservation),
      kalanBakiye: getRemainingBalance(reservation),
    }))
    .sort((a, b) => a.girisTarihi.localeCompare(b.girisTarihi))
}

export function getFilteredCashSummary(
  reservations: Reservation[],
  filter: CashFilter,
): CashSummary {
  const filtered = filterReservationsForCashSummary(reservations, filter)
  return calculateCashSummary(filtered)
}

export function formatCurrency(value: number, canViewPrices = true) {
  if (!canViewPrices) {
    return MASKED_MONEY_LABEL
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  return formatTurkeyDateKey(value)
}
