export type CashFilter = 'today' | 'month' | 'season'

export interface PaymentRecord {
  id: string
  reservation_id: string
  amount: number
  payment_date: string
  note: string | null
  created_at: string
}

export interface CashSummary {
  toplamTahsilEdilecek: number
  toplamTahsilEdilen: number
  toplamKalanBakiye: number
  toplamKapora: number
  bekleyenKaporalar: number
}

export interface PaymentHistoryEntry {
  id: string
  guestName: string
  unitName: string
  amount: number
  paymentDate: string
  note: string | null
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
