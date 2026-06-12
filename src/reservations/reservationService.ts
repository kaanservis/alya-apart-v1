import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AccommodationUnit, Reservation, ReservationStatus } from '../types/database'
import { buildDepositPaymentPayload } from './depositCalculations'
import { syncUnitStatuses } from '../workflow/workflowService'
import { deriveReservationStatus, parseAmount } from './validation'
import type { ReservationFormValues } from './types'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

function buildReservationPayload(values: ReservationFormValues) {
  const toplamUcret = parseAmount(values.toplam_ucret)
  const kapora = parseAmount(values.kapora)
  const kaporaTahsil = parseAmount(values.kapora_tahsil)
  const girisTeAlinan = parseAmount(values.giris_te_alinan)
  const gunlukUcret = parseAmount(values.gunluk_ucret)
  const durum = deriveReservationStatus(values.cikis_tarihi)
  const payment = buildDepositPaymentPayload({
    toplam_ucret: Number.isNaN(toplamUcret) ? 0 : toplamUcret,
    kapora: Number.isNaN(kapora) ? 0 : kapora,
    kapora_tahsil: Number.isNaN(kaporaTahsil) ? 0 : kaporaTahsil,
    giris_te_alinan: Number.isNaN(girisTeAlinan) ? 0 : girisTeAlinan,
  })

  return {
    ad_soyad: values.ad_soyad.trim(),
    telefon: values.telefon.trim(),
    kisi_sayisi: Number(values.kisi_sayisi),
    giris_tarihi: values.giris_tarihi,
    cikis_tarihi: values.cikis_tarihi,
    konaklama_birimi_id: values.konaklama_birimi_id,
    gunluk_ucret: gunlukUcret,
    toplam_ucret: Number.isNaN(toplamUcret) ? 0 : toplamUcret,
    kapora: payment.kapora,
    kapora_tahsil: payment.kapora_tahsil,
    giris_te_alinan: payment.giris_te_alinan,
    cikista_alinacak: payment.cikista_alinacak,
    alinan_ucret: payment.alinan_ucret,
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
  const payload = buildReservationPayload(values)

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
  const payload = buildReservationPayload(values)

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
