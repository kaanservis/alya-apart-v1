import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  ACCOMMODATION_UNITS_ORDER_COLUMN,
  sortAccommodationUnitsByDisplayOrder,
} from '../lib/unitOrder'
import type { AccommodationUnit, WebsiteRoom, WebsiteRoomPhoto } from '../types/database'
import { UNIT_NAMES } from '../types/database'

const ROOM_PHOTOS_BUCKET = 'room-photos'

function isMissingWebsiteTableError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('website_room_profiles') ||
    message.includes('website_room_photos')
  )
}

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

export function getRoomPhotoPublicUrl(storagePath: string) {
  if (!supabase) {
    return storagePath
  }

  const { data } = supabase.storage.from(ROOM_PHOTOS_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function fetchWebsiteRooms(): Promise<WebsiteRoom[]> {
  if (!isSupabaseConfigured || !supabase) {
    return buildFallbackRooms()
  }

  const client = assertSupabaseClient()

  const unitsResult = await client
    .from('accommodation_units')
    .select('id, name, display_order')
    .order(ACCOMMODATION_UNITS_ORDER_COLUMN, { ascending: true })

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message)
  }

  const units = sortAccommodationUnitsByDisplayOrder(
    (unitsResult.data ?? []) as Pick<AccommodationUnit, 'id' | 'name' | 'display_order'>[],
  )

  const profilesResult = await client.from('website_room_profiles').select('*')
  let profiles: Array<{
    accommodation_unit_id: string
    description: string
    capacity: number
    features: string[]
  }> = []

  if (profilesResult.error) {
    if (!isMissingWebsiteTableError(profilesResult.error)) {
      throw new Error(profilesResult.error.message)
    }
  } else {
    profiles = (profilesResult.data ?? []) as typeof profiles
  }

  let photos: WebsiteRoomPhoto[] = []

  if (!profilesResult.error) {
    const photosResult = await client
      .from('website_room_photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (photosResult.error) {
      if (!isMissingWebsiteTableError(photosResult.error)) {
        throw new Error(photosResult.error.message)
      }
    } else {
      photos = (photosResult.data ?? []) as WebsiteRoomPhoto[]
    }
  }

  const profilesByUnit = new Map(profiles.map((profile) => [profile.accommodation_unit_id, profile]))
  const photosByUnit = new Map<string, WebsiteRoomPhoto[]>()

  photos.forEach((photo) => {
    const current = photosByUnit.get(photo.accommodation_unit_id) ?? []
    current.push(photo)
    photosByUnit.set(photo.accommodation_unit_id, current)
  })

  const knownNames = new Set(UNIT_NAMES)
  const orderedUnits = units.filter((unit) => knownNames.has(unit.name as (typeof UNIT_NAMES)[number]))

  return orderedUnits.map((unit) => {
    const profile = profilesByUnit.get(unit.id)
    const unitPhotos = photosByUnit.get(unit.id) ?? []

    return {
      unitId: unit.id,
      unitName: unit.name,
      description:
        profile?.description ??
        `${unit.name} odamız konforlu ve huzurlu bir konaklama deneyimi sunar.`,
      capacity: profile?.capacity ?? getDefaultCapacity(unit.name),
      features: profile?.features ?? ['Klima', 'Wi-Fi', 'TV', 'Banyo'],
      photos: unitPhotos.map((photo) => ({
        id: photo.id,
        url: getRoomPhotoPublicUrl(photo.storage_path),
        sortOrder: photo.sort_order,
        storagePath: photo.storage_path,
      })),
    }
  })
}

function getDefaultCapacity(name: string) {
  return ['Yaren 2', 'Belkız 3', 'Ayşegül 7', 'Berrin 8'].includes(name) ? 4 : 2
}

function buildFallbackRooms(): WebsiteRoom[] {
  return UNIT_NAMES.map((name, index) => ({
    unitId: `fallback-${index + 1}`,
    unitName: name,
    description: `${name} odamız konforlu ve huzurlu bir konaklama deneyimi sunar.`,
    capacity: getDefaultCapacity(name),
    features: ['Klima', 'Wi-Fi', 'TV', 'Banyo', 'Mutfak', 'Balkon'],
    photos: [],
  }))
}

export async function uploadRoomPhoto(unitId: string, file: File) {
  const client = assertSupabaseClient()

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `${unitId}/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const uploadResult = await client.storage.from(ROOM_PHOTOS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message)
  }

  const { data: existingPhotos, error: existingError } = await client
    .from('website_room_photos')
    .select('sort_order')
    .eq('accommodation_unit_id', unitId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (existingError) {
    await client.storage.from(ROOM_PHOTOS_BUCKET).remove([storagePath])
    throw new Error(existingError.message)
  }

  const existing = (existingPhotos ?? []) as Pick<WebsiteRoomPhoto, 'sort_order'>[]
  const nextSortOrder = existing[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const insertResult = await client
    .from('website_room_photos')
    .insert({
      accommodation_unit_id: unitId,
      storage_path: storagePath,
      sort_order: nextSortOrder,
    } as never)
    .select('*')
    .single()

  if (insertResult.error) {
    await client.storage.from(ROOM_PHOTOS_BUCKET).remove([storagePath])
    throw new Error(insertResult.error.message)
  }

  return insertResult.data as WebsiteRoomPhoto
}

export async function deleteRoomPhoto(photoId: string, storagePath: string) {
  const client = assertSupabaseClient()

  const deleteStorageResult = await client.storage.from(ROOM_PHOTOS_BUCKET).remove([storagePath])

  if (deleteStorageResult.error) {
    throw new Error(deleteStorageResult.error.message)
  }

  const deleteResult = await client.from('website_room_photos').delete().eq('id', photoId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message)
  }
}

export async function reorderRoomPhotos(unitId: string, orderedPhotoIds: string[]) {
  const client = assertSupabaseClient()

  const updates = orderedPhotoIds.map((photoId, index) =>
    client
      .from('website_room_photos')
      .update({ sort_order: index } as never)
      .eq('id', photoId)
      .eq('accommodation_unit_id', unitId),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    throw new Error(failed.error.message)
  }
}

export async function fetchAdminWebsiteRooms() {
  return fetchWebsiteRooms()
}

export async function updateRoomContent(
  unitId: string,
  data: {
    description: string
    capacity: number
    features: string[]
  },
) {
  const client = assertSupabaseClient()
  const trimmedDescription = data.description.trim()

  if (data.capacity < 1) {
    throw new Error('Kapasite en az 1 olmalıdır.')
  }

  const { data: existingProfile, error: existingError } = await client
    .from('website_room_profiles')
    .select('id')
    .eq('accommodation_unit_id', unitId)
    .maybeSingle()

  if (existingError) {
    if (isMissingWebsiteTableError(existingError)) {
      throw new Error(
        'Oda profilleri tablosu bulunamadı. Supabase SQL Editor\'da 007_website.sql veya 008_website_room_profiles.sql migration dosyasını çalıştırın.',
      )
    }

    throw new Error(existingError.message)
  }

  const profilePayload = {
    description: trimmedDescription,
    capacity: data.capacity,
    features: data.features,
  }

  if (existingProfile) {
    const updateResult = await client
      .from('website_room_profiles')
      .update(profilePayload as never)
      .eq('accommodation_unit_id', unitId)

    if (updateResult.error) {
      throw new Error(updateResult.error.message)
    }
  } else {
    const insertResult = await client.from('website_room_profiles').insert({
      accommodation_unit_id: unitId,
      ...profilePayload,
    } as never)

    if (insertResult.error) {
      throw new Error(insertResult.error.message)
    }
  }
}
