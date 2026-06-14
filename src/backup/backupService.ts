import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  getDefaultDisplayOrderForUnitName,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, Expense, Reservation } from '../types/database'
import { getTurkeyDateKey } from '../lib/turkeyDate'
import { syncUnitStatuses } from '../workflow/workflowService'
import { buildBackupFileName } from './backupFileName'
import { addBackupHistoryRecord } from './backupHistory'
import { getBackupSettings, saveBackupSettings } from './backupSettings'
import {
  BACKUP_VERSION,
  type BackupPayload,
  type BackupPreview,
  type RestoreMode,
} from './backupTypes'

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export async function fetchBackupPayload(): Promise<BackupPayload> {
  const client = assertSupabaseClient()

  const [roomsResult, reservationsResult, expensesResult] = await Promise.all([
    client.from('accommodation_units').select('*').order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true }),
    client.from('reservations').select('*').order('giris_tarihi', { ascending: false }),
    client.from('expenses').select('*').order('tarih', { ascending: false }),
  ])

  if (roomsResult.error) {
    throw new Error(roomsResult.error.message)
  }

  if (reservationsResult.error) {
    throw new Error(reservationsResult.error.message)
  }

  if (expensesResult.error) {
    throw new Error(expensesResult.error.message)
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    rooms: sortAccommodationUnitsByDisplayOrder((roomsResult.data ?? []) as AccommodationUnit[]),
    reservations: (reservationsResult.data ?? []) as Reservation[],
    expenses: (expensesResult.data ?? []) as Expense[],
  }
}

function reservationToInsert(reservation: Reservation) {
  return {
    id: reservation.id,
    ad_soyad: reservation.ad_soyad,
    telefon: reservation.telefon,
    kisi_sayisi: reservation.kisi_sayisi,
    giris_tarihi: reservation.giris_tarihi,
    cikis_tarihi: reservation.cikis_tarihi,
    konaklama_birimi_id: reservation.konaklama_birimi_id,
    gunluk_ucret: reservation.gunluk_ucret,
    toplam_ucret: reservation.toplam_ucret,
    alinan_tutar: reservation.alinan_tutar,
    notlar: reservation.notlar,
    durum: reservation.durum,
    created_at: reservation.created_at,
    updated_at: reservation.updated_at,
  }
}

function buildExcelBackupContent(payload: BackupPayload) {
  const bom = '\uFEFF'
  const sections: string[] = []

  function addSection(title: string, headers: string[], rows: string[][]) {
    sections.push(`[${title}]`)
    sections.push(headers.map((header) => `"${header}"`).join(';'))
    rows.forEach((row) => {
      sections.push(row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
    })
    sections.push('')
  }

  addSection(
    'REZERVASYONLAR',
    [
      'id',
      'ad_soyad',
      'telefon',
      'kisi_sayisi',
      'giris_tarihi',
      'cikis_tarihi',
      'konaklama_birimi_id',
      'gunluk_ucret',
      'toplam_ucret',
      'alinan_tutar',
      'notlar',
      'durum',
    ],
    payload.reservations.map((reservation) => [
      reservation.id,
      reservation.ad_soyad,
      reservation.telefon,
      String(reservation.kisi_sayisi),
      reservation.giris_tarihi,
      reservation.cikis_tarihi,
      reservation.konaklama_birimi_id,
      String(reservation.gunluk_ucret),
      String(reservation.toplam_ucret),
      String(reservation.alinan_tutar),
      reservation.notlar ?? '',
      reservation.durum,
    ]),
  )

  addSection(
    'MASRAFLAR',
    ['id', 'tarih', 'aciklama', 'tutar', 'created_at', 'updated_at'],
    payload.expenses.map((expense) => [
      expense.id,
      expense.tarih,
      expense.aciklama,
      String(expense.tutar),
      expense.created_at,
      expense.updated_at,
    ]),
  )

  return bom + sections.join('\n')
}

function recordBackupHistory(
  type: 'json' | 'excel' | 'auto',
  fileName: string,
  content: string,
  mimeType: string,
) {
  addBackupHistoryRecord({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    type,
    fileName,
    fileSize: new Blob([content]).size,
    content,
    mimeType,
  })
}

export async function exportJsonBackup(options?: { type?: 'json' | 'auto'; download?: boolean }) {
  const payload = await fetchBackupPayload()
  const fileName = buildBackupFileName('json')
  const content = JSON.stringify(payload, null, 2)
  const type = options?.type ?? 'json'

  recordBackupHistory(type, fileName, content, 'application/json')

  if (options?.download !== false) {
    downloadTextFile(fileName, content, 'application/json')
  }

  return { fileName, content, payload }
}

export async function exportExcelBackup() {
  const payload = await fetchBackupPayload()
  const fileName = buildBackupFileName('csv')
  const content = buildExcelBackupContent(payload)

  recordBackupHistory('excel', fileName, content, 'text/csv;charset=utf-8')
  downloadTextFile(fileName, content, 'text/csv;charset=utf-8')

  return { fileName, content, payload }
}

export function parseBackupJson(content: string): BackupPayload {
  const parsed = JSON.parse(content) as Partial<BackupPayload> & {
    paymentRecords?: unknown[]
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Geçersiz yedek dosyası.')
  }

  if (!Array.isArray(parsed.rooms) || !Array.isArray(parsed.reservations)) {
    throw new Error('Yedek dosyası gerekli tabloları içermiyor.')
  }

  return {
    version: parsed.version ?? BACKUP_VERSION,
    exportedAt: parsed.exportedAt ?? '',
    rooms: parsed.rooms as AccommodationUnit[],
    reservations: parsed.reservations as Reservation[],
    expenses: (parsed.expenses ?? []) as Expense[],
  }
}

export function buildBackupPreview(payload: BackupPayload): BackupPreview {
  return {
    roomCount: payload.rooms.length,
    reservationCount: payload.reservations.length,
    expenseCount: payload.expenses.length,
    exportedAt: payload.exportedAt || null,
  }
}

async function clearOperationalData(client: ReturnType<typeof assertSupabaseClient>) {
  const reservationsDelete = await client
    .from('reservations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (reservationsDelete.error) {
    throw new Error(reservationsDelete.error.message)
  }

  const expensesDelete = await client
    .from('expenses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (expensesDelete.error) {
    throw new Error(expensesDelete.error.message)
  }
}

async function upsertRooms(client: ReturnType<typeof assertSupabaseClient>, rooms: AccommodationUnit[]) {
  for (const room of rooms) {
    const { data: existing } = await client
      .from('accommodation_units')
      .select('id')
      .eq('id', room.id)
      .maybeSingle()

    if (existing) {
      const updateResult = await client
        .from('accommodation_units')
        .update({
          status: room.status,
          display_order: room.display_order || getDefaultDisplayOrderForUnitName(room.name),
        } as never)
        .eq('id', room.id)

      if (updateResult.error) {
        throw new Error(updateResult.error.message)
      }
    } else {
      const insertResult = await client.from('accommodation_units').insert({
        id: room.id,
        name: room.name,
        status: room.status,
        display_order: room.display_order || getDefaultDisplayOrderForUnitName(room.name),
      } as never)

      if (insertResult.error) {
        throw new Error(insertResult.error.message)
      }
    }
  }
}

async function restoreReservation(
  client: ReturnType<typeof assertSupabaseClient>,
  reservation: Reservation,
) {
  const legacyReservation = reservation as Reservation & {
    alinan_ucret?: number
  }

  const insertResult = await client.from('reservations').insert({
    ...reservationToInsert(reservation),
    alinan_tutar:
      reservation.alinan_tutar ??
      legacyReservation.alinan_ucret ??
      0,
  } as never)

  if (insertResult.error) {
    throw new Error(insertResult.error.message)
  }
}

async function insertExpenses(client: ReturnType<typeof assertSupabaseClient>, expenses: Expense[]) {
  if (expenses.length === 0) {
    return
  }

  const expenseInsert = await client.from('expenses').insert(
    expenses.map((expense) => ({
      id: expense.id,
      tarih: expense.tarih,
      aciklama: expense.aciklama,
      tutar: expense.tutar,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
    })) as never,
  )

  if (expenseInsert.error) {
    throw new Error(expenseInsert.error.message)
  }
}

export async function restoreBackup(payload: BackupPayload, mode: RestoreMode) {
  const client = assertSupabaseClient()

  if (mode === 'full') {
    await clearOperationalData(client)
    await upsertRooms(client, payload.rooms)

    for (const reservation of payload.reservations) {
      await restoreReservation(client, reservation)
    }

    await insertExpenses(client, payload.expenses)
  } else {
    const { data: existingRooms } = await client.from('accommodation_units').select('id')
    const { data: existingReservations } = await client.from('reservations').select('id')
    const { data: existingExpenses } = await client.from('expenses').select('id')

    const roomIds = new Set(
      ((existingRooms ?? []) as { id: string }[]).map((room) => room.id),
    )
    const reservationIds = new Set(
      ((existingReservations ?? []) as { id: string }[]).map((reservation) => reservation.id),
    )
    const expenseIds = new Set(
      ((existingExpenses ?? []) as { id: string }[]).map((expense) => expense.id),
    )

    for (const room of payload.rooms) {
      if (roomIds.has(room.id)) {
        continue
      }

      const insertResult = await client.from('accommodation_units').insert({
        id: room.id,
        name: room.name,
        status: room.status,
        display_order: room.display_order || getDefaultDisplayOrderForUnitName(room.name),
      } as never)

      if (insertResult.error) {
        throw new Error(insertResult.error.message)
      }
    }

    for (const reservation of payload.reservations) {
      if (reservationIds.has(reservation.id)) {
        continue
      }

      await restoreReservation(client, reservation)
    }

    for (const expense of payload.expenses) {
      if (expenseIds.has(expense.id)) {
        continue
      }

      const insertResult = await client.from('expenses').insert({
        id: expense.id,
        tarih: expense.tarih,
        aciklama: expense.aciklama,
        tutar: expense.tutar,
        created_at: expense.created_at,
        updated_at: expense.updated_at,
      } as never)

      if (insertResult.error) {
        throw new Error(insertResult.error.message)
      }
    }
  }

  const [unitsResult, reservationsResult] = await Promise.all([
    client.from('accommodation_units').select('*'),
    client.from('reservations').select('*'),
  ])

  if (unitsResult.error || reservationsResult.error) {
    throw new Error(
      unitsResult.error?.message ?? reservationsResult.error?.message ?? 'Senkronizasyon hatası',
    )
  }

  await syncUnitStatuses(
    (unitsResult.data ?? []) as AccommodationUnit[],
    (reservationsResult.data ?? []) as Reservation[],
  )
}

export async function runAutoDailyBackupIfNeeded() {
  const settings = getBackupSettings()

  if (!settings.autoDailyBackup) {
    return false
  }

  const today = getTurkeyDateKey()

  if (settings.lastAutoBackupDate === today) {
    return false
  }

  await exportJsonBackup({ type: 'auto', download: false })
  saveBackupSettings({
    autoDailyBackup: true,
    lastAutoBackupDate: today,
  })

  return true
}
