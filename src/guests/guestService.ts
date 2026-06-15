import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { toTurkishUppercase } from '../reservations/formInputHelpers'
import type { GuestEntry, GuestPhoto, GuestPhotoType, Reservation } from '../types/database'
import type { GuestEntryWithPhotos } from './guestTypes'

const GUEST_PHOTOS_BUCKET = 'guest-photos'

const GUEST_PHOTO_STORAGE_FILES: Record<GuestPhotoType, string> = {
  front_id: 'front.jpg',
  back_id: 'back.jpg',
  guest_photo: 'photo.jpg',
}

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

export function getGuestPhotoPublicUrl(storagePath: string) {
  if (!storagePath) {
    return ''
  }

  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  const normalizedPath = storagePath.startsWith(`${GUEST_PHOTOS_BUCKET}/`)
    ? storagePath.slice(GUEST_PHOTOS_BUCKET.length + 1)
    : storagePath

  if (!isSupabaseConfigured || !supabase) {
    return normalizedPath
  }

  const { data } = supabase.storage.from(GUEST_PHOTOS_BUCKET).getPublicUrl(normalizedPath)
  return data.publicUrl
}

export function buildGuestPhotoStoragePath(
  reservationId: string,
  guestEntryId: string,
  photoType: GuestPhotoType,
) {
  return `${reservationId}/${guestEntryId}/${GUEST_PHOTO_STORAGE_FILES[photoType]}`
}

export const GUEST_PHOTO_UPLOAD_FAILED_MESSAGE =
  'Fotoğraf yüklenemedi. Depolama izinleri kontrol edilmeli.'

export function getGuestPhotoUploadErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === GUEST_PHOTO_UPLOAD_FAILED_MESSAGE) {
      return error.message
    }

    if (error.message.startsWith('Geçersiz dosya') || error.message.includes('Dosya boyutu')) {
      return error.message
    }
  }

  return GUEST_PHOTO_UPLOAD_FAILED_MESSAGE
}

function normalizeGuestTcNo(tcNo?: string) {
  const digits = tcNo?.replace(/\D/g, '').slice(0, 11) ?? ''
  return digits || null
}

function normalizeGuestFullName(fullName: string) {
  return toTurkishUppercase(fullName.trim())
}

function throwGuestPhotoUploadFailed(): never {
  throw new Error(GUEST_PHOTO_UPLOAD_FAILED_MESSAGE)
}

function mapGuestWithPhotos(
  entry: GuestEntry,
  photos: GuestPhoto[],
): GuestEntryWithPhotos {
  return {
    ...entry,
    photos: photos.filter((photo) => photo.guest_entry_id === entry.id),
  }
}

export async function fetchGuestEntriesForReservation(
  reservationId: string,
): Promise<GuestEntryWithPhotos[]> {
  const client = assertSupabaseClient()

  const { data: entries, error: entriesError } = await client
    .from('guest_entries')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: true })

  if (entriesError) {
    throw new Error(entriesError.message)
  }

  const guestEntries = (entries ?? []) as GuestEntry[]
  if (guestEntries.length === 0) {
    return []
  }

  const guestIds = guestEntries.map((entry) => entry.id)
  const { data: photos, error: photosError } = await client
    .from('guest_photos')
    .select('*')
    .in('guest_entry_id', guestIds)

  if (photosError) {
    throw new Error(photosError.message)
  }

  const photoList = (photos ?? []) as GuestPhoto[]
  return guestEntries.map((entry) => mapGuestWithPhotos(entry, photoList))
}

export async function fetchGuestEntriesForReservations(
  reservationIds: string[],
): Promise<Map<string, GuestEntryWithPhotos[]>> {
  const map = new Map<string, GuestEntryWithPhotos[]>()

  if (reservationIds.length === 0) {
    return map
  }

  const client = assertSupabaseClient()

  const { data: entries, error: entriesError } = await client
    .from('guest_entries')
    .select('*')
    .in('reservation_id', reservationIds)
    .order('created_at', { ascending: true })

  if (entriesError) {
    throw new Error(entriesError.message)
  }

  const guestEntries = (entries ?? []) as GuestEntry[]
  if (guestEntries.length === 0) {
    return map
  }

  const guestIds = guestEntries.map((entry) => entry.id)
  const { data: photos, error: photosError } = await client
    .from('guest_photos')
    .select('*')
    .in('guest_entry_id', guestIds)

  if (photosError) {
    throw new Error(photosError.message)
  }

  const photoList = (photos ?? []) as GuestPhoto[]

  guestEntries.forEach((entry) => {
    const current = map.get(entry.reservation_id) ?? []
    current.push(mapGuestWithPhotos(entry, photoList))
    map.set(entry.reservation_id, current)
  })

  return map
}

export interface CreateGuestEntryInput {
  reservationId: string
  fullName: string
  tcNo?: string
  phone?: string
  notes?: string
}

export function computeTotalGuestCount(extraGuestCount: number) {
  return 1 + extraGuestCount
}

export function isGuestReservationOwner(guest: Pick<GuestEntry, 'full_name'>, reservationOwnerName: string) {
  return (
    guest.full_name.trim().toLocaleLowerCase('tr-TR') ===
    reservationOwnerName.trim().toLocaleLowerCase('tr-TR')
  )
}

export async function syncReservationGuestCount(
  reservationId: string,
  extraGuestCount: number,
): Promise<number> {
  const client = assertSupabaseClient()
  const kisiSayisi = computeTotalGuestCount(extraGuestCount)

  const { error } = await client
    .from('reservations')
    .update({ kisi_sayisi: kisiSayisi } as never)
    .eq('id', reservationId)

  if (error) {
    throw new Error(error.message)
  }

  return kisiSayisi
}

export async function createGuestEntry(input: CreateGuestEntryInput): Promise<GuestEntryWithPhotos> {
  const client = assertSupabaseClient()

  const { data, error } = await client
    .from('guest_entries')
    .insert({
      reservation_id: input.reservationId,
      full_name: normalizeGuestFullName(input.fullName),
      tc_no: normalizeGuestTcNo(input.tcNo),
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    } as never)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const { count, error: countError } = await client
    .from('guest_entries')
    .select('*', { count: 'exact', head: true })
    .eq('reservation_id', input.reservationId)

  if (countError) {
    throw new Error(countError.message)
  }

  await syncReservationGuestCount(input.reservationId, count ?? 0)

  return { ...(data as GuestEntry), photos: [] }
}

export interface UpdateGuestEntryInput {
  guestEntryId: string
  fullName: string
  tcNo?: string
  phone?: string
  notes?: string
}

export async function updateGuestEntry(input: UpdateGuestEntryInput): Promise<GuestEntry> {
  const client = assertSupabaseClient()

  const { data, error } = await client
    .from('guest_entries')
    .update({
      full_name: normalizeGuestFullName(input.fullName),
      tc_no: normalizeGuestTcNo(input.tcNo),
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    } as never)
    .eq('id', input.guestEntryId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as GuestEntry
}

async function removeGuestPhotoFiles(photos: GuestPhoto[]) {
  const client = assertSupabaseClient()
  const storagePaths = photos.map((photo) => photo.photo_url).filter(Boolean)

  if (storagePaths.length === 0) {
    return
  }

  const { error } = await client.storage.from(GUEST_PHOTOS_BUCKET).remove(storagePaths)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteGuestPhoto(photoId: string, storagePath: string): Promise<void> {
  const client = assertSupabaseClient()

  if (storagePath) {
    const { error: storageError } = await client.storage
      .from(GUEST_PHOTOS_BUCKET)
      .remove([storagePath])

    if (storageError) {
      throw new Error(storageError.message)
    }
  }

  const { error } = await client.from('guest_photos').delete().eq('id', photoId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteGuestEntry(
  guestEntryId: string,
  reservationId: string,
  options?: { syncGuestCount?: boolean },
): Promise<void> {
  const client = assertSupabaseClient()

  const { data: photos, error: photosError } = await client
    .from('guest_photos')
    .select('*')
    .eq('guest_entry_id', guestEntryId)

  if (photosError) {
    throw new Error(photosError.message)
  }

  await removeGuestPhotoFiles((photos ?? []) as GuestPhoto[])

  const { error } = await client.from('guest_entries').delete().eq('id', guestEntryId)

  if (error) {
    throw new Error(error.message)
  }

  const { count, error: countError } = await client
    .from('guest_entries')
    .select('*', { count: 'exact', head: true })
    .eq('reservation_id', reservationId)

  if (countError) {
    throw new Error(countError.message)
  }

  if (options?.syncGuestCount !== false) {
    await syncReservationGuestCount(reservationId, count ?? 0)
  }
}

export async function uploadGuestPhoto(
  guestEntryId: string,
  reservationId: string,
  photoType: GuestPhotoType,
  file: File,
): Promise<GuestPhoto> {
  const client = assertSupabaseClient()
  const storagePath = buildGuestPhotoStoragePath(reservationId, guestEntryId, photoType)

  const { data: existingPhotos, error: existingError } = await client
    .from('guest_photos')
    .select('*')
    .eq('guest_entry_id', guestEntryId)
    .eq('photo_type', photoType)
    .maybeSingle()

  if (existingError) {
    throwGuestPhotoUploadFailed()
  }

  const existing = existingPhotos as GuestPhoto | null

  if (existing?.photo_url && existing.photo_url !== storagePath) {
    await client.storage.from(GUEST_PHOTOS_BUCKET).remove([existing.photo_url])
  }

  const uploadResult = await client.storage.from(GUEST_PHOTOS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })

  if (uploadResult.error) {
    throwGuestPhotoUploadFailed()
  }

  if (existing) {
    const { data, error } = await client
      .from('guest_photos')
      .update({ photo_url: storagePath } as never)
      .eq('id', existing.id)
      .select('*')
      .maybeSingle()

    if (error) {
      throwGuestPhotoUploadFailed()
    }

    return (data ?? { ...existing, photo_url: storagePath }) as GuestPhoto
  }

  const { data, error } = await client
    .from('guest_photos')
    .insert({
      guest_entry_id: guestEntryId,
      photo_type: photoType,
      photo_url: storagePath,
    } as never)
    .select('*')
    .maybeSingle()

  if (error) {
    await client.storage.from(GUEST_PHOTOS_BUCKET).remove([storagePath])
    throwGuestPhotoUploadFailed()
  }

  if (data) {
    return data as GuestPhoto
  }

  return {
    id: guestEntryId,
    guest_entry_id: guestEntryId,
    photo_type: photoType,
    photo_url: storagePath,
    created_at: new Date().toISOString(),
  } as GuestPhoto
}

export function buildGuestExportFields(
  reservation: Reservation,
  guests: GuestEntryWithPhotos[] = [],
) {
  const guestNames = guests.map((guest) => guest.full_name).join(', ')
  const allOccupants = guestNames
    ? `${reservation.ad_soyad}, ${guestNames}`
    : reservation.ad_soyad

  return {
    rezervasyonSahibi: reservation.ad_soyad,
    konaklayanlar: allOccupants,
    kisiSayisi: String(computeTotalGuestCount(guests.length)),
  }
}
