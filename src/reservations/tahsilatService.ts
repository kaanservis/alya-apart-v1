import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import type { PaymentRecord, Reservation } from '../types/database'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

export async function fetchTahsilatHistory(reservationId: string): Promise<PaymentRecord[]> {
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

export async function addTahsilat(
  reservationId: string,
  amount: number,
): Promise<{ reservation: Reservation; payment: PaymentRecord }> {
  const client = assertSupabaseClient()

  if (amount <= 0) {
    throw new Error('Tahsilat tutarı 0 dan büyük olmalıdır.')
  }

  const { data: reservation, error: reservationError } = await client
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single()

  if (reservationError) {
    throw new Error(reservationError.message)
  }

  const current = reservation as Reservation
  const remaining = Math.max(0, Number(current.toplam_ucret) - Number(current.alinan_tutar))

  if (remaining <= 0) {
    throw new Error('Bu rezervasyonun hesabı zaten kapalı.')
  }

  const appliedAmount = Math.min(amount, remaining)
  const nextAlinanTutar = Number(current.alinan_tutar) + appliedAmount

  const { data: payment, error: paymentError } = await client
    .from('payment_records')
    .insert({
      reservation_id: reservationId,
      amount: appliedAmount,
      payment_date: getTurkeyDateKey(),
    } as never)
    .select('*')
    .single()

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  const { data: updatedReservation, error: updateError } = await client
    .from('reservations')
    .update({ alinan_tutar: nextAlinanTutar } as never)
    .eq('id', reservationId)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  return {
    reservation: updatedReservation as Reservation,
    payment: payment as PaymentRecord,
  }
}
