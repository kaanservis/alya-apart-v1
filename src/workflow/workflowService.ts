import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AccommodationUnit, Reservation } from '../types/database'
import { computeExpectedUnitStatus } from './unitStatusLogic'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

export async function syncUnitStatuses(
  units: AccommodationUnit[],
  reservations: Reservation[],
): Promise<AccommodationUnit[]> {
  const client = assertSupabaseClient()
  const syncedUnits = [...units]

  for (let index = 0; index < syncedUnits.length; index += 1) {
    const unit = syncedUnits[index]
    const expectedStatus = computeExpectedUnitStatus(unit, reservations)

    if (unit.status === expectedStatus) {
      continue
    }

    const { error } = await client
      .from('accommodation_units')
      .update({ status: expectedStatus } as never)
      .eq('id', unit.id)

    if (error) {
      throw new Error(error.message)
    }

    syncedUnits[index] = { ...unit, status: expectedStatus }
  }

  return syncedUnits
}

export async function completeCheckout(
  reservationId: string,
  unitId: string,
): Promise<void> {
  const client = assertSupabaseClient()

  const { error: reservationError } = await client
    .from('reservations')
    .update({ durum: 'Geçmiş' } as never)
    .eq('id', reservationId)

  if (reservationError) {
    throw new Error(reservationError.message)
  }

  const { error: unitError } = await client
    .from('accommodation_units')
    .update({ status: 'Temizlik Bekliyor' } as never)
    .eq('id', unitId)

  if (unitError) {
    throw new Error(unitError.message)
  }
}

export async function completeCleaning(unitId: string): Promise<void> {
  const client = assertSupabaseClient()

  const { error } = await client
    .from('accommodation_units')
    .update({ status: 'Boş' } as never)
    .eq('id', unitId)

  if (error) {
    throw new Error(error.message)
  }
}

async function syncAllUnitStatuses() {
  const client = assertSupabaseClient()

  const [unitsResult, reservationsResult] = await Promise.all([
    client.from('accommodation_units').select('*'),
    client.from('reservations').select('*'),
  ])

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message)
  }

  if (reservationsResult.error) {
    throw new Error(reservationsResult.error.message)
  }

  await syncUnitStatuses(
    (unitsResult.data ?? []) as AccommodationUnit[],
    (reservationsResult.data ?? []) as Reservation[],
  )
}

export async function completeOdaKabul(
  reservationId: string,
  alinanTutar?: number,
): Promise<void> {
  const client = assertSupabaseClient()

  const updatePayload: {
    oda_kabul_yapildi: boolean
    oda_kabul_tarihi: string
    alinan_tutar?: number
  } = {
    oda_kabul_yapildi: true,
    oda_kabul_tarihi: new Date().toISOString(),
  }

  if (alinanTutar !== undefined) {
    updatePayload.alinan_tutar = alinanTutar
  }

  const { error } = await client
    .from('reservations')
    .update(updatePayload as never)
    .eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const client = assertSupabaseClient()

  const { error } = await client
    .from('reservations')
    .update({ durum: 'İptal' } as never)
    .eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }

  await syncAllUnitStatuses()
}

export async function markReservationNoShow(reservationId: string): Promise<void> {
  const client = assertSupabaseClient()

  const { error } = await client
    .from('reservations')
    .update({ durum: 'No Show' } as never)
    .eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }

  await syncAllUnitStatuses()
}
