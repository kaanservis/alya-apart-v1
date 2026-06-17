import type { PaymentRecord, Reservation } from '../types/database'

export interface ReservationPaymentSummary {
  totalCharge: number
  totalCollected: number
  remainingBalance: number
  isAccountClosed: boolean
}

export function sumPaymentAmounts(payments: PaymentRecord[]): number {
  return payments.reduce((total, payment) => total + Number(payment.amount), 0)
}

export function buildPaymentSummary(
  reservation: Pick<Reservation, 'toplam_ucret'>,
  payments: PaymentRecord[],
): ReservationPaymentSummary {
  const totalCharge = Number(reservation.toplam_ucret)
  const totalCollected = sumPaymentAmounts(payments)
  const remainingBalance = Math.max(0, totalCharge - totalCollected)

  return {
    totalCharge,
    totalCollected,
    remainingBalance,
    isAccountClosed: totalCharge > 0 && remainingBalance === 0,
  }
}

export function getRemainingBalanceFromPayments(
  reservation: Pick<Reservation, 'toplam_ucret'>,
  payments: PaymentRecord[],
): number {
  return buildPaymentSummary(reservation, payments).remainingBalance
}

export function getTotalCollectedFromPayments(payments: PaymentRecord[]): number {
  return sumPaymentAmounts(payments)
}
