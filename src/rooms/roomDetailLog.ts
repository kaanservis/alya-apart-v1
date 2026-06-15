const PREFIX = '[ReservationDetailModal]'

export function logReservationDetail(step: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(PREFIX, step, payload)
    return
  }
  console.log(PREFIX, step)
}
