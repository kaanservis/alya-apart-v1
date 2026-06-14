import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  ApartmentId,
  ApartmentPhoto,
  ApartmentPhotoRow,
  ApartmentProfile,
  ApartmentRow,
} from '../types/database'
import { getWebsiteImagePublicUrl, WEBSITE_IMAGES_BUCKET } from './websiteImageService'

function isMissingApartmentError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('apartments') ||
    message.includes('apartment_photos')
  )
}

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

function mapPhotoRow(row: ApartmentPhotoRow): ApartmentPhoto {
  return {
    id: row.id,
    apartmentId: row.apartment_id,
    photoUrl: row.photo_url,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

function buildApartmentProfile(apartment: ApartmentRow, photos: ApartmentPhoto[]): ApartmentProfile {
  return {
    apartment,
    photos: photos.sort((a, b) => a.sortOrder - b.sortOrder),
    coverUrl: apartment.cover_image ? getWebsiteImagePublicUrl(apartment.cover_image) : null,
  }
}

export async function fetchApartmentProfiles(): Promise<ApartmentProfile[]> {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const client = assertSupabaseClient()

  const apartmentsResult = await client
    .from('apartments')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (apartmentsResult.error) {
    if (isMissingApartmentError(apartmentsResult.error)) {
      throw new Error('Apart tabloları bulunamadı.')
    }

    throw new Error(apartmentsResult.error.message)
  }

  const apartments = (apartmentsResult.data ?? []) as ApartmentRow[]

  if (apartments.length === 0) {
    return []
  }

  const apartmentIds = apartments.map((apartment) => apartment.id)

  const photosResult = await client
    .from('apartment_photos')
    .select('*')
    .in('apartment_id', apartmentIds)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (photosResult.error) {
    if (isMissingApartmentError(photosResult.error)) {
      throw new Error('Apart fotoğraf tablosu bulunamadı.')
    }

    throw new Error(photosResult.error.message)
  }

  const photos = ((photosResult.data ?? []) as ApartmentPhotoRow[]).map(mapPhotoRow)

  return apartments.map((apartment) =>
    buildApartmentProfile(
      apartment,
      photos.filter((photo) => photo.apartmentId === apartment.id),
    ),
  )
}

export async function updateApartment(
  apartmentId: ApartmentId,
  patch: Partial<Omit<ApartmentRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ApartmentRow> {
  const client = assertSupabaseClient()

  const { error } = await client.from('apartments').update(patch as never).eq('id', apartmentId)

  if (error) {
    throw new Error(error.message)
  }

  const { data, error: fetchError } = await client
    .from('apartments')
    .select('*')
    .eq('id', apartmentId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  return data as ApartmentRow
}

export async function uploadApartmentCoverPhoto(apartmentId: ApartmentId, file: File): Promise<string> {
  const client = assertSupabaseClient()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `apartments/${apartmentId}/cover/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const uploadResult = await client.storage.from(WEBSITE_IMAGES_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message)
  }

  const publicUrl = getWebsiteImagePublicUrl(storagePath)
  await updateApartment(apartmentId, { cover_image: publicUrl })
  return publicUrl
}

export async function uploadApartmentGalleryPhotos(
  apartmentId: ApartmentId,
  files: File[],
): Promise<ApartmentPhoto[]> {
  const client = assertSupabaseClient()
  const uploaded: ApartmentPhoto[] = []

  const { data: existingPhotos, error: existingError } = await client
    .from('apartment_photos')
    .select('sort_order')
    .eq('apartment_id', apartmentId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (existingError) {
    throw new Error(existingError.message)
  }

  let nextSortOrder =
    ((existingPhotos ?? []) as Pick<ApartmentPhotoRow, 'sort_order'>[])[0]?.sort_order ?? -1

  for (const file of files) {
    nextSortOrder += 1
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const storagePath = `apartments/${apartmentId}/gallery/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const uploadResult = await client.storage.from(WEBSITE_IMAGES_BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message)
    }

    const photoUrl = getWebsiteImagePublicUrl(storagePath)

    const insertResult = await client
      .from('apartment_photos')
      .insert({
        apartment_id: apartmentId,
        photo_url: photoUrl,
        sort_order: nextSortOrder,
      } as never)
      .select('*')
      .single()

    if (insertResult.error) {
      await client.storage.from(WEBSITE_IMAGES_BUCKET).remove([storagePath])
      throw new Error(insertResult.error.message)
    }

    uploaded.push(mapPhotoRow(insertResult.data as ApartmentPhotoRow))
  }

  return uploaded
}

export async function deleteApartmentPhoto(photoId: ApartmentId, photoUrl: string) {
  const client = assertSupabaseClient()

  const pathInBucket = extractStoragePathFromPublicUrl(photoUrl)

  if (pathInBucket) {
    const deleteStorageResult = await client.storage.from(WEBSITE_IMAGES_BUCKET).remove([pathInBucket])

    if (deleteStorageResult.error) {
      throw new Error(deleteStorageResult.error.message)
    }
  }

  const deleteResult = await client.from('apartment_photos').delete().eq('id', photoId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message)
  }
}

function extractStoragePathFromPublicUrl(publicUrl: string) {
  const marker = `/storage/v1/object/public/${WEBSITE_IMAGES_BUCKET}/`
  const index = publicUrl.indexOf(marker)

  if (index < 0) {
    return null
  }

  return decodeURIComponent(publicUrl.slice(index + marker.length))
}

export async function saveApartmentProfiles(apartments: ApartmentRow[]): Promise<void> {
  await Promise.all(
    apartments.map((apartment) => {
      const { id, created_at: _createdAt, updated_at: _updatedAt, ...patch } = apartment
      return updateApartment(id, patch)
    }),
  )
}

export { getWebsiteImagePublicUrl }
