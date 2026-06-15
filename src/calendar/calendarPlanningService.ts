import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AccommodationUnit, Reservation } from '../types/database'
import { syncUnitStatuses } from '../workflow/workflowService'
import type { CalendarPendingChange } from './calendarPlanningUtils'
import { isPendingChangeDirty } from './calendarPlanningUtils'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

async function syncAllUnitStatuses() {
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

export async function saveCalendarPlanningChanges(
  changes: CalendarPendingChange[],
  changedBy: string,
): Promise<void> {
  const client = assertSupabaseClient()
  const dirtyChanges = changes.filter(isPendingChangeDirty)

  if (dirtyChanges.length === 0) {
    return
  }

  const affectedUnitIds = new Set<string>()

  for (const change of dirtyChanges) {
    affectedUnitIds.add(change.originalUnitId)
    affectedUnitIds.add(change.draftUnitId)

    const { error: updateError } = await client
      .from('reservations')
      .update({
        konaklama_birimi_id: change.draftUnitId,
        giris_tarihi: change.draftGirisTarihi,
        cikis_tarihi: change.draftCikisTarihi,
      } as never)
      .eq('id', change.reservationId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const { error: logError } = await client.from('reservation_change_log').insert({
      reservation_id: change.reservationId,
      changed_by: changedBy,
      old_room_id: change.originalUnitId,
      new_room_id: change.draftUnitId,
      old_check_in: change.originalGirisTarihi,
      new_check_in: change.draftGirisTarihi,
      old_check_out: change.originalCikisTarihi,
      new_check_out: change.draftCikisTarihi,
    } as never)

    if (logError) {
      if (logError.message.includes('reservation_change_log')) {
        throw new Error(
          'Değişiklik kaydı oluşturulamadı. Supabase\'de 027_reservation_change_log.sql migration dosyasını çalıştırın.',
        )
      }

      throw new Error(logError.message)
    }
  }

  await syncAllUnitStatuses()
}
