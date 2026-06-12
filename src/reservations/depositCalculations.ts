import type { AccommodationUnit, Reservation } from '../types/database'

export type ReservationPaymentFields = Pick<
  Reservation,
  | 'toplam_ucret'
  | 'kapora'
  | 'kapora_tahsil'
  | 'giris_te_alinan'
  | 'cikista_alinacak'
  | 'alinan_ucret'
  | 'kalan_bakiye'
>

export function getTotalCollected(reservation: ReservationPaymentFields): number {
  return Number(reservation.kapora_tahsil) + Number(reservation.giris_te_alinan)
}

export function getRemainingBalance(reservation: ReservationPaymentFields): number {
  return Math.max(0, Number(reservation.toplam_ucret) - getTotalCollected(reservation))
}

export function getCheckoutDue(reservation: ReservationPaymentFields): number {
  return getRemainingBalance(reservation)
}

export function getDepositDue(reservation: ReservationPaymentFields): number {
  return Math.max(0, Number(reservation.kapora) - Number(reservation.kapora_tahsil))
}

export function isDepositPaid(reservation: ReservationPaymentFields): boolean {
  if (Number(reservation.kapora) <= 0) {
    return true
  }

  return Number(reservation.kapora_tahsil) >= Number(reservation.kapora)
}

export function isDepositPending(reservation: ReservationPaymentFields): boolean {
  return Number(reservation.kapora) > 0 && !isDepositPaid(reservation)
}

export function buildDepositPaymentPayload(values: {
  toplam_ucret: number
  kapora: number
  kapora_tahsil: number
  giris_te_alinan: number
}) {
  const alinan_ucret = values.kapora_tahsil + values.giris_te_alinan
  const cikista_alinacak = Math.max(0, values.toplam_ucret - alinan_ucret)

  return {
    kapora: values.kapora,
    kapora_tahsil: values.kapora_tahsil,
    giris_te_alinan: values.giris_te_alinan,
    alinan_ucret,
    cikista_alinacak,
  }
}

export interface PendingDepositGuest {
  reservation: Reservation
  unit: AccommodationUnit
  depositDue: number
  remainingBalance: number
}

export function getPendingDepositGuests(
  units: AccommodationUnit[],
  reservations: Reservation[],
): PendingDepositGuest[] {
  const unitMap = new Map(units.map((unit) => [unit.id, unit]))

  return reservations
    .filter((reservation) => reservation.durum === 'Aktif' && isDepositPending(reservation))
    .map((reservation) => ({
      reservation,
      unit: unitMap.get(reservation.konaklama_birimi_id)!,
      depositDue: getDepositDue(reservation),
      remainingBalance: getRemainingBalance(reservation),
    }))
    .filter((entry): entry is PendingDepositGuest => Boolean(entry.unit))
    .sort((a, b) => a.reservation.giris_tarihi.localeCompare(b.reservation.giris_tarihi))
}

export function calculateDepositSummary(reservations: Reservation[]) {
  return reservations.reduce(
    (summary, reservation) => {
      summary.toplamKapora += Number(reservation.kapora_tahsil)
      summary.bekleyenKaporalar += getDepositDue(reservation)
      return summary
    },
    { toplamKapora: 0, bekleyenKaporalar: 0 },
  )
}
