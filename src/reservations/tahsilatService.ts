import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import type { PaymentRecord, Reservation } from '../types/database'
import {
  buildPaymentSummary,
  type ReservationPaymentSummary,
} from './paymentCalculations'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

async function fetchReservation(
  client: ReturnType<typeof assertSupabaseClient>,
  reservationId: string,
): Promise<Reservation> {
  const { data, error } = await client
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Reservation
}

export async function fetchPaymentHistory(reservationId: string): Promise<PaymentRecord[]> {
  const client = assertSupabaseClient()

  const { data, error } = await client
    .from('payment_records')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PaymentRecord[]
}

/** @deprecated Use fetchPaymentHistory */
export const fetchTahsilatHistory = fetchPaymentHistory

export async function fetchPaymentsByReservationIds(
  reservationIds: string[],
): Promise<Map<string, PaymentRecord[]>> {
  const uniqueIds = [...new Set(reservationIds.filter(Boolean))]

  if (uniqueIds.length === 0) {
    return new Map()
  }

  const client = assertSupabaseClient()

  const { data, error } = await client
    .from('payment_records')
    .select('*')
    .in('reservation_id', uniqueIds)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const grouped = new Map<string, PaymentRecord[]>()

  for (const record of (data ?? []) as PaymentRecord[]) {
    const current = grouped.get(record.reservation_id) ?? []
    current.push(record)
    grouped.set(record.reservation_id, current)
  }

  return grouped
}

export interface ReservationPaymentState {
  reservation: Reservation
  payments: PaymentRecord[]
  summary: ReservationPaymentSummary
}

export async function fetchReservationPaymentState(
  reservationId: string,
): Promise<ReservationPaymentState> {
  const client = assertSupabaseClient()
  const [reservation, payments] = await Promise.all([
    fetchReservation(client, reservationId),
    fetchPaymentHistory(reservationId),
  ])

  return {
    reservation,
    payments,
    summary: buildPaymentSummary(reservation, payments),
  }
}

export interface AddPaymentRecordParams {
  amount: number
  paymentDate?: string
  note?: string | null
  recordedBy?: string
}

export async function addPaymentRecord(
  reservationId: string,
  params: AddPaymentRecordParams,
): Promise<ReservationPaymentState & { payment: PaymentRecord }> {
  const client = assertSupabaseClient()
  const amount = Number(params.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Ödeme tutarı 0 dan büyük olmalıdır.')
  }

  const currentState = await fetchReservationPaymentState(reservationId)

  if (currentState.summary.remainingBalance <= 0) {
    throw new Error('Kalan bakiye bulunmuyor. Hesap zaten kapalı.')
  }

  const appliedAmount = Math.min(amount, currentState.summary.remainingBalance)

  const { data: payment, error: paymentError } = await client
    .from('payment_records')
    .insert({
      reservation_id: reservationId,
      amount: appliedAmount,
      payment_date: params.paymentDate ?? getTurkeyDateKey(),
      note: params.note?.trim() || null,
      recorded_by: params.recordedBy ?? null,
    } as never)
    .select('*')
    .single()

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  const nextState = await fetchReservationPaymentState(reservationId)

  return {
    ...nextState,
    payment: payment as PaymentRecord,
  }
}

export async function deletePaymentRecord(
  paymentId: string,
  reservationId: string,
): Promise<ReservationPaymentState> {
  const client = assertSupabaseClient()

  const { error } = await client.from('payment_records').delete().eq('id', paymentId)

  if (error) {
    throw new Error(error.message)
  }

  return fetchReservationPaymentState(reservationId)
}

export async function closeRemainingBalance(
  reservationId: string,
  params?: {
    paymentDate?: string
    note?: string
    recordedBy?: string
  },
): Promise<ReservationPaymentState & { payment: PaymentRecord | null }> {
  const currentState = await fetchReservationPaymentState(reservationId)

  if (currentState.summary.remainingBalance <= 0) {
    return { ...currentState, payment: null }
  }

  const result = await addPaymentRecord(reservationId, {
    amount: currentState.summary.remainingBalance,
    paymentDate: params?.paymentDate ?? getTurkeyDateKey(),
    note: params?.note ?? 'Kalan bakiye kapatıldı',
    recordedBy: params?.recordedBy,
  })

  return result
}

export async function syncCollectedTotal(
  reservationId: string,
  targetTotal: number,
  params?: {
    paymentDate?: string
    note?: string
    recordedBy?: string
  },
): Promise<ReservationPaymentState> {
  const currentState = await fetchReservationPaymentState(reservationId)
  const currentCollected = currentState.summary.totalCollected
  const delta = targetTotal - currentCollected

  if (delta < 0) {
    throw new Error('Girilen ödeme tutarı mevcut tahsil edilen tutardan düşük olamaz.')
  }

  if (delta === 0) {
    return currentState
  }

  if (delta > currentState.summary.remainingBalance) {
    throw new Error('Ödeme tutarı kalan bakiyeden fazla olamaz.')
  }

  await addPaymentRecord(reservationId, {
    amount: delta,
    paymentDate: params?.paymentDate ?? getTurkeyDateKey(),
    note: params?.note ?? 'Ödeme güncellemesi',
    recordedBy: params?.recordedBy,
  })

  return fetchReservationPaymentState(reservationId)
}

export async function addTahsilat(
  reservationId: string,
  amount: number,
  params?: Omit<AddPaymentRecordParams, 'amount'>,
): Promise<ReservationPaymentState & { payment: PaymentRecord }> {
  return addPaymentRecord(reservationId, {
    amount,
    ...params,
  })
}
