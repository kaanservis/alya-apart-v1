import type { Reservation } from '../types/database'

export type CustomerStatusFilter = 'all' | 'aktif' | 'gecmis' | 'iptal' | 'noshow'
export type CustomerSortField = 'checkIn' | 'checkOut' | 'name'

export interface CustomerListFilters {
  searchQuery: string
  status: CustomerStatusFilter
  sortField: CustomerSortField
  sortDirection: 'asc' | 'desc'
}

export const EMPTY_CUSTOMER_FILTERS: CustomerListFilters = {
  searchQuery: '',
  status: 'all',
  sortField: 'checkIn',
  sortDirection: 'desc',
}

export interface CustomerListRow {
  reservation: Reservation
  unitName: string
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function matchesSearch(reservation: Reservation, searchQuery: string): boolean {
  const query = searchQuery.trim()

  if (!query) {
    return true
  }

  const nameMatch = reservation.ad_soyad
    .toLocaleUpperCase('tr-TR')
    .includes(query.toLocaleUpperCase('tr-TR'))

  const phoneMatch = normalizePhone(reservation.telefon).includes(normalizePhone(query))

  return nameMatch || phoneMatch
}

export function filterAndSortCustomers(
  reservations: Reservation[],
  unitMap: Map<string, string>,
  filters: CustomerListFilters,
): CustomerListRow[] {
  let rows = reservations
    .filter((reservation) => {
      if (filters.status === 'aktif' && reservation.durum !== 'Aktif') {
        return false
      }

      if (filters.status === 'gecmis' && reservation.durum !== 'Geçmiş') {
        return false
      }

      if (filters.status === 'iptal' && reservation.durum !== 'İptal') {
        return false
      }

      if (filters.status === 'noshow' && reservation.durum !== 'No Show') {
        return false
      }

      return matchesSearch(reservation, filters.searchQuery)
    })
    .map((reservation) => ({
      reservation,
      unitName: unitMap.get(reservation.konaklama_birimi_id) ?? '—',
    }))

  rows = [...rows].sort((a, b) => {
    let comparison = 0

    if (filters.sortField === 'name') {
      comparison = a.reservation.ad_soyad.localeCompare(b.reservation.ad_soyad, 'tr')
    } else {
      const field = filters.sortField === 'checkIn' ? 'giris_tarihi' : 'cikis_tarihi'
      comparison = a.reservation[field].localeCompare(b.reservation[field], 'tr')
    }

    return filters.sortDirection === 'asc' ? comparison : -comparison
  })

  return rows
}

export function findGuestReservationHistory(
  reservations: Reservation[],
  reservation: Reservation,
): Reservation[] {
  const phone = normalizePhone(reservation.telefon)

  return reservations
    .filter((entry) => {
      if (entry.id === reservation.id) {
        return false
      }

      if (phone.length >= 10) {
        return normalizePhone(entry.telefon) === phone
      }

      return entry.ad_soyad.toLocaleUpperCase('tr-TR') === reservation.ad_soyad.toLocaleUpperCase('tr-TR')
    })
    .sort((a, b) => b.giris_tarihi.localeCompare(a.giris_tarihi, 'tr'))
}

export function findRoomReservations(
  reservations: Reservation[],
  unitId: string,
): Reservation[] {
  return reservations
    .filter((reservation) => reservation.konaklama_birimi_id === unitId)
    .sort((a, b) => b.giris_tarihi.localeCompare(a.giris_tarihi, 'tr'))
}
