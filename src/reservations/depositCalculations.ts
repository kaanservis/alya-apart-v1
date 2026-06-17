import type { PaymentRecord, Reservation } from '../types/database'
import { buildPaymentSummary } from './paymentCalculations'

export type ReservationPaymentFields = Pick<Reservation, 'toplam_ucret'>

export function getTotalCollected(
  reservation: ReservationPaymentFields,
  payments: PaymentRecord[] = [],
): number {
  return buildPaymentSummary(reservation, payments).totalCollected
}

export function getRemainingBalance(
  reservation: ReservationPaymentFields,
  payments: PaymentRecord[] = [],
): number {
  return buildPaymentSummary(reservation, payments).remainingBalance
}

export function isAccountClosed(
  reservation: ReservationPaymentFields,
  payments: PaymentRecord[] = [],
): boolean {
  return buildPaymentSummary(reservation, payments).isAccountClosed
}

export function getCheckoutDue(
  reservation: ReservationPaymentFields,
  payments: PaymentRecord[] = [],
): number {
  return getRemainingBalance(reservation, payments)
}

export function calculateDepositSummary(_reservations: Reservation[]) {
  return { toplamKapora: 0, bekleyenKaporalar: 0 }
}
