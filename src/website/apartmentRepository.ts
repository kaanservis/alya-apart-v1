import { supabase } from '../lib/supabase'
import type { ApartmentId, ApartmentPhotoRow, ApartmentRow } from '../types/database'
import { assertSupabaseClient } from './apartmentRepositoryHelpers'
import { logApartmentLoad, logApartmentLoadError } from './apartmentLoadLog'

/** Live DB columns (bigint id, cover_image). */
export const APARTMENT_COLUMNS =
  'id,name,description,cover_image,feature_near_sea,feature_wifi,feature_ac,feature_kitchen,feature_balcony,feature_family_friendly,sort_order,created_at,updated_at'

export const APARTMENT_PHOTO_COLUMNS = 'id,apartment_id,photo_url,sort_order,created_at'

export function parseApartmentId(value: unknown): ApartmentId {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const trimmed = value.trim()

    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed)
    }

    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) {
      return parsed
    }

    throw new Error(
      `Geçersiz apart kimliği: "${trimmed}". Beklenen bigint (1, 2), metin slug değil (ör. alya-apart).`,
    )
  }

  throw new Error(`Geçersiz apart kimliği: ${String(value)}`)
}

/** Coerce any apartment id input to a numeric bigint id for Supabase .eq('id', …). */
export function normalizeApartmentIdForQuery(value: unknown): ApartmentId {
  return parseApartmentId(value)
}

function resolveCoverImage(raw: Record<string, unknown>): string | null {
  const coverImage = raw.cover_image ?? raw.cover_photo_path
  return coverImage ? String(coverImage) : null
}

export function mapApartmentRow(raw: Record<string, unknown>): ApartmentRow {
  try {
    return {
      id: parseApartmentId(raw.id),
      name: String(raw.name ?? ''),
      description: String(raw.description ?? ''),
      cover_image: resolveCoverImage(raw),
      feature_near_sea: Boolean(raw.feature_near_sea),
      feature_wifi: Boolean(raw.feature_wifi),
      feature_ac: Boolean(raw.feature_ac),
      feature_kitchen: Boolean(raw.feature_kitchen),
      feature_balcony: Boolean(raw.feature_balcony),
      feature_family_friendly: Boolean(raw.feature_family_friendly),
      sort_order: Number(raw.sort_order ?? 0),
      created_at: String(raw.created_at ?? ''),
      updated_at: String(raw.updated_at ?? ''),
    }
  } catch (error) {
    logApartmentLoadError('mapApartmentRow failed', error, { raw })
    throw error
  }
}

export function mapApartmentPhotoRow(raw: Record<string, unknown>): ApartmentPhotoRow {
  const photoUrl = raw.photo_url ?? raw.storage_path ?? ''
  return {
    id: parseApartmentId(raw.id),
    apartment_id: parseApartmentId(raw.apartment_id),
    photo_url: String(photoUrl),
    sort_order: Number(raw.sort_order ?? 0),
    created_at: String(raw.created_at ?? ''),
  }
}

export interface ApartmentRowsFetchResult {
  rows: ApartmentRow[]
  rawCount: number
}

export async function fetchApartmentRows(): Promise<ApartmentRowsFetchResult> {
  const client = assertSupabaseClient()
  const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  logApartmentLoad('Supabase query starting', {
    table: 'apartments',
    select: APARTMENT_COLUMNS,
    supabaseConfigured,
  })

  let { data, error, status, statusText } = await client
    .from('apartments')
    .select(APARTMENT_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error?.message.includes('cover_image') || error?.code === '42703') {
    logApartmentLoad('Retrying apartments query with select(*)', { firstError: error.message })
    ;({ data, error, status, statusText } = await client
      .from('apartments')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true }))
  }

  const rawCount = data?.length ?? 0

  logApartmentLoad('Supabase query finished', {
    status,
    statusText,
    rawCount,
    error: error?.message ?? null,
    errorCode: error?.code ?? null,
    sample: (data ?? []).slice(0, 2).map((row) => {
      const record = row as Record<string, unknown>
      return { id: record.id, name: record.name }
    }),
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = data ?? []

  if (rows.length === 0) {
    logApartmentLoad('WARNING: Supabase returned 0 apartment rows', {
      hint: 'Check RLS SELECT policy on apartments for anon role, then hard-refresh the page (Ctrl+Shift+R)',
      supabaseConfigured,
    })
    return { rows: [], rawCount: 0 }
  }

  return {
    rows: rows.map((row) => mapApartmentRow(row as Record<string, unknown>)),
    rawCount,
  }
}

export async function fetchApartmentPhotoRows(apartmentIds: ApartmentId[]): Promise<ApartmentPhotoRow[]> {
  if (apartmentIds.length === 0) {
    return []
  }

  const client = assertSupabaseClient()

  logApartmentLoad('Supabase query starting', {
    table: 'apartment_photos',
    select: APARTMENT_PHOTO_COLUMNS,
    apartmentIds,
  })

  const { data, error, status } = await client
    .from('apartment_photos')
    .select(APARTMENT_PHOTO_COLUMNS)
    .in('apartment_id', apartmentIds)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  logApartmentLoad('Supabase query finished', {
    table: 'apartment_photos',
    status,
    rawCount: data?.length ?? 0,
    error: error?.message ?? null,
  })

  if (error) {
    logApartmentLoadError('apartment_photos query failed (gallery skipped)', error)
    return []
  }

  return (data ?? []).map((row) => mapApartmentPhotoRow(row as Record<string, unknown>))
}

export async function updateApartmentRow(
  apartmentId: ApartmentId,
  patch: Partial<Omit<ApartmentRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ApartmentRow> {
  const client = assertSupabaseClient()
  const numericId = normalizeApartmentIdForQuery(apartmentId)

  logApartmentLoad('updateApartmentRow → starting', {
    apartmentIdInput: apartmentId,
    apartmentIdType: typeof apartmentId,
    apartmentIdNumeric: numericId,
    patchKeys: Object.keys(patch),
  })

  const { data, error, status, statusText } = await client
    .from('apartments')
    .update(patch as never)
    .eq('id', numericId)
    .select(APARTMENT_COLUMNS)

  logApartmentLoad('updateApartmentRow → supabase result', {
    apartmentId: numericId,
    dataCount: data?.length ?? 0,
    data: (data ?? []).slice(0, 1),
    error: error?.message ?? null,
    errorCode: error?.code ?? null,
    status,
    statusText,
  })

  if (error) {
    throw new Error(`Apart #${numericId} güncellenemedi: ${error.message}`)
  }

  const row = data?.[0]
  if (!row) {
    throw new Error(
      `Apart #${numericId} güncellenemedi: Kayıt bulunamadı veya apartments UPDATE RLS politikası engelliyor. Supabase SQL Editor'da 023_apartments_update_rls.sql migration dosyasını çalıştırın.`,
    )
  }

  return mapApartmentRow(row as Record<string, unknown>)
}

export async function updateApartmentCoverImage(
  apartmentId: ApartmentId,
  coverImage: string,
): Promise<ApartmentRow> {
  const client = assertSupabaseClient()
  const numericId = normalizeApartmentIdForQuery(apartmentId)

  logApartmentLoad('updateApartmentCoverImage → starting', {
    apartmentIdInput: apartmentId,
    apartmentIdType: typeof apartmentId,
    apartmentIdNumeric: numericId,
    cover_image: coverImage,
  })

  const result = await client
    .from('apartments')
    .update({ cover_image: coverImage } as never)
    .eq('id', numericId)
    .select('*')

  logApartmentLoad('updateApartmentCoverImage → supabase result', {
    apartmentId: numericId,
    updateResult: result.data,
    updateResultCount: result.data?.length ?? 0,
    updateError: result.error?.message ?? null,
    updateErrorCode: result.error?.code ?? null,
    status: result.status,
    statusText: result.statusText,
  })

  if (result.error) {
    logApartmentLoadError('updateApartmentCoverImage → update failed', result.error, {
      apartmentId: numericId,
    })
    throw new Error(`Apart #${numericId} cover_image güncellenemedi: ${result.error.message}`)
  }

  const row = result.data?.[0]
  if (!row) {
    logApartmentLoadError(
      'updateApartmentCoverImage → 0 rows returned (RLS or id mismatch)',
      new Error('empty update result'),
      {
        apartmentId: numericId,
        hint: 'Run supabase/migrations/023_apartments_update_rls.sql in Supabase SQL Editor',
      },
    )
    throw new Error(
      `Apart #${numericId} güncellenemedi: Kayıt bulunamadı veya apartments UPDATE RLS politikası engelliyor. Supabase SQL Editor'da 023_apartments_update_rls.sql migration dosyasını çalıştırın.`,
    )
  }

  return mapApartmentRow(row as Record<string, unknown>)
}

export async function insertApartmentPhotoRow(
  apartmentId: ApartmentId,
  photoUrl: string,
  sortOrder: number,
): Promise<ApartmentPhotoRow> {
  const client = assertSupabaseClient()

  const { data, error } = await client
    .from('apartment_photos')
    .insert({
      apartment_id: apartmentId,
      photo_url: photoUrl,
      sort_order: sortOrder,
    } as never)
    .select(APARTMENT_PHOTO_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapApartmentPhotoRow(data as Record<string, unknown>)
}

export async function deleteApartmentPhotoRow(photoId: ApartmentId): Promise<void> {
  const client = assertSupabaseClient()

  const { error } = await client.from('apartment_photos').delete().eq('id', photoId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchMaxPhotoSortOrder(apartmentId: ApartmentId): Promise<number> {
  const client = assertSupabaseClient()

  const { data, error } = await client
    .from('apartment_photos')
    .select('sort_order')
    .eq('apartment_id', apartmentId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as Pick<ApartmentPhotoRow, 'sort_order'>[]
  return rows[0]?.sort_order ?? -1
}

/** Debug helper: verify client can read apartments table. */
export async function debugApartmentConnection() {
  return {
    supabaseConfigured: Boolean(supabase),
    url: import.meta.env.VITE_SUPABASE_URL ?? null,
    hasAnonKey: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  }
}
