import { useEffect, useMemo, useState } from 'react'
import type { PaymentRecord, Reservation } from '../types/database'
import { buildPaymentSummary, type ReservationPaymentSummary } from './paymentCalculations'
import { fetchPaymentsByReservationIds } from './tahsilatService'

export function useBatchPaymentSummaries(
  reservations: Reservation[],
  refreshToken = 0,
) {
  const reservationIds = useMemo(
    () => [...new Set(reservations.map((reservation) => reservation.id))],
    [reservations],
  )
  const reservationIdsKey = reservationIds.join(',')

  const [paymentsByReservation, setPaymentsByReservation] = useState<
    Map<string, PaymentRecord[]>
  >(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (reservationIds.length === 0) {
      setPaymentsByReservation(new Map())
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void fetchPaymentsByReservationIds(reservationIds)
      .then((nextMap) => {
        if (!cancelled) {
          setPaymentsByReservation(nextMap)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentsByReservation(new Map())
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [reservationIdsKey, refreshToken])

  const getSummary = useMemo(() => {
    return (reservation: Reservation): ReservationPaymentSummary =>
      buildPaymentSummary(
        reservation,
        paymentsByReservation.get(reservation.id) ?? [],
      )
  }, [paymentsByReservation])

  return { getSummary, paymentsByReservation, loading }
}
