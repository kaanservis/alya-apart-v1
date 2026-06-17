import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AccommodationUnit, Reservation, ReservationStatus } from '../types/database'
import { syncUnitStatuses } from '../workflow/workflowService'
import { deriveReservationStatus, parseAmount } from './validation'
import type { ReservationFormValues } from './types'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

function buildReservationFields(values: ReservationFormValues) {
  const toplamUcret = parseAmount(values.toplam_ucret)
  const gunlukUcret = parseAmount(values.gunluk_ucret)
  const durum = deriveReservationStatus(values.cikis_tarihi)
  const total = Number.isNaN(toplamUcret) ? 0 : toplamUcret

  return {
    ad_soyad: values.ad_soyad.trim(),
    telefon: values.telefon.trim(),
    kisi_sayisi: Number(values.kisi_sayisi),
    giris_tarihi: values.giris_tarihi,
    cikis_tarihi: values.cikis_tarihi,
    konaklama_birimi_id: values.konaklama_birimi_id,
    gunluk_ucret: gunlukUcret,
    toplam_ucret: total,
    notlar: values.notlar.trim() || null,
    durum: durum as ReservationStatus,
  }
}

async function syncAffectedUnitStatus(_unitId: string) {
  const client = assertSupabaseClient()

  const [unitsResult, reservationsResult] = await Promise.all([
    client.from('accommodation_units').select('*'),
    client.from('reservations').select('*'),
  ])

  if (unitsResult.error || reservationsResult.error) {
    return
  }

  await syncUnitStatuses(
    (unitsResult.data ?? []) as AccommodationUnit[],
    (reservationsResult.data ?? []) as Reservation[],
  )
}

export async function createReservation(values: ReservationFormValues): Promise<Reservation> {
  const client = assertSupabaseClient()
  const payload = {
    ...buildReservationFields(values),
    alinan_tutar: 0,
  }

  const { data, error } = await client
    .from('reservations')
    .insert(payload as never)
    .select('*')
    .single()

  if (error) {
    if (error.message.includes('gunluk_ucret')) {
      throw new Error(
        'Veritabanı güncel değil. Supabase SQL Editor\'da 005_reservation_daily_price.sql migration dosyasını çalıştırın.',
      )
    }

    throw new Error(error.message)
  }

  await syncAffectedUnitStatus(values.konaklama_birimi_id)

  return data as Reservation
}

export async function updateReservation(
  reservationId: string,
  values: ReservationFormValues,
  previousUnitId?: string,
): Promise<Reservation> {
  const client = assertSupabaseClient()
  const payload = buildReservationFields(values)

  const { data, error } = await client
    .from('reservations')
    .update(payload as never)
    .eq('id', reservationId)
    .select('*')
    .single()

  if (error) {
    if (error.message.includes('gunluk_ucret')) {
      throw new Error(
        'Veritabanı güncel değil. Supabase SQL Editor\'da 005_reservation_daily_price.sql migration dosyasını çalıştırın.',
      )
    }

    throw new Error(error.message)
  }

  await syncAffectedUnitStatus(values.konaklama_birimi_id)

  if (previousUnitId && previousUnitId !== values.konaklama_birimi_id) {
    await syncAffectedUnitStatus(previousUnitId)
  }

  return data as Reservation
}

export async function deleteReservation(
  reservationId: string,
  unitId?: string,
): Promise<void> {
  const client = assertSupabaseClient()

  const { error } = await client.from('reservations').delete().eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }

  if (unitId) {
    await syncAffectedUnitStatus(unitId)
  }
}
