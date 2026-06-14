export type CashFilter = 'today' | 'month' | 'season'

export interface CashSummary {
  toplamTahsilEdilecek: number
  toplamTahsilEdilen: number
  toplamKalanBakiye: number
}

export interface ActiveReservationRow {
  id: string
  guestName: string
  unitName: string
  girisTarihi: string
  cikisTarihi: string
  toplamUcret: number
  alinanUcret: number
  kalanBakiye: number
}

export const CASH_FILTER_OPTIONS: { value: CashFilter; label: string }[] = [
  { value: 'today', label: 'Bugün' },
  { value: 'month', label: 'Bu Ay' },
  { value: 'season', label: 'Sezon' },
]
