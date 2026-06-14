import type { Reservation } from '../types/database'

export type ReservationPaymentFields = Pick<Reservation, 'toplam_ucret' | 'alinan_tutar'>

export function getTotalCollected(reservation: ReservationPaymentFields): number {
  return Number(reservation.alinan_tutar)
}

export function getRemainingBalance(reservation: ReservationPaymentFields): number {
  return Math.max(0, Number(reservation.toplam_ucret) - getTotalCollected(reservation))
}

export function getCheckoutDue(reservation: ReservationPaymentFields): number {
  return getRemainingBalance(reservation)
}

export function calculateDepositSummary(_reservations: Reservation[]) {
  return { toplamKapora: 0, bekleyenKaporalar: 0 }
}
