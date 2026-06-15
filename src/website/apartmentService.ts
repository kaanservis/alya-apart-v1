import type {
  ApartmentId,
  ApartmentPhoto,
  ApartmentPhotoRow,
  ApartmentProfile,
  ApartmentRow,
} from '../types/database'
import { logApartmentLoad, logApartmentLoadError } from './apartmentLoadLog'
import {
  deleteApartmentPhotoRow,
  fetchApartmentPhotoRows,
  fetchApartmentRows,
  fetchMaxPhotoSortOrder,
  insertApartmentPhotoRow,
  normalizeApartmentIdForQuery,
  updateApartmentCoverImage,
  updateApartmentRow,
} from './apartmentRepository'
import { assertSupabaseClient } from './apartmentRepositoryHelpers'
import { getWebsiteImagePublicUrl, WEBSITE_IMAGES_BUCKET } from './websiteImageService'

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

export interface ApartmentProfilesFetchResult {
  profiles: ApartmentProfile[]
  rawCount: number
}

export async function fetchApartmentProfiles(): Promise<ApartmentProfile[]> {
  const result = await fetchApartmentProfilesWithMeta()
  return result.profiles
}

export async function fetchApartmentProfilesWithMeta(): Promise<ApartmentProfilesFetchResult> {
  logApartmentLoad('fetchApartmentProfiles() start')

  try {
    const { rows: apartments, rawCount } = await fetchApartmentRows()

    logApartmentLoad('fetchApartmentProfiles() mapped apartments', {
      count: apartments.length,
      rawCount,
      ids: apartments.map((apartment) => apartment.id),
      names: apartments.map((apartment) => apartment.name),
    })

    const apartmentIds = apartments.map((apartment) => apartment.id)
    const photoRows = await fetchApartmentPhotoRows(apartmentIds)
    const photos = photoRows.map(mapPhotoRow)

    const profiles = apartments.map((apartment) =>
      buildApartmentProfile(
        apartment,
        photos.filter((photo) => photo.apartmentId === apartment.id),
      ),
    )

    logApartmentLoad('fetchApartmentProfiles() success', { profileCount: profiles.length, rawCount })

    return { profiles, rawCount }
  } catch (error) {
    logApartmentLoadError('fetchApartmentProfiles() failed', error)
    throw error
  }
}

export async function updateApartment(
  apartmentId: ApartmentId,
  patch: Partial<Omit<ApartmentRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<ApartmentRow> {
  return updateApartmentRow(apartmentId, patch)
}

export interface ApartmentCoverUploadResult {
  storagePath: string
  publicUrl: string
}

export async function uploadApartmentCoverPhoto(
  apartmentId: ApartmentId,
  file: File,
): Promise<ApartmentCoverUploadResult> {
  const client = assertSupabaseClient()
  const numericId = normalizeApartmentIdForQuery(apartmentId)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `apartments/${numericId}/cover/${Date.now()}-${crypto.randomUUID()}.${extension}`

  logApartmentLoad('uploadApartmentCoverPhoto → storage upload starting', {
    apartmentIdInput: apartmentId,
    apartmentIdType: typeof apartmentId,
    apartmentIdNumeric: numericId,
    storagePath,
    fileName: file.name,
  })

  const uploadResult = await client.storage.from(WEBSITE_IMAGES_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadResult.error) {
    throw new Error(`Kapak fotoğrafı yüklenemedi: ${uploadResult.error.message}`)
  }

  const publicUrl = getWebsiteImagePublicUrl(storagePath)

  logApartmentLoad('uploadApartmentCoverPhoto → storage upload ok', {
    apartmentId: numericId,
    storagePath,
    publicUrl,
  })

  const updatedRow = await updateApartmentCoverImage(numericId, storagePath)

  logApartmentLoad('uploadApartmentCoverPhoto → apartments.cover_image updated', {
    apartmentId: numericId,
    cover_image: updatedRow.cover_image,
    publicUrl,
  })

  return { storagePath, publicUrl }
}

export async function uploadApartmentGalleryPhotos(
  apartmentId: ApartmentId,
  files: File[],
): Promise<ApartmentPhoto[]> {
  const client = assertSupabaseClient()
  const uploaded: ApartmentPhoto[] = []

  let nextSortOrder = await fetchMaxPhotoSortOrder(apartmentId)

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

    try {
      const row = await insertApartmentPhotoRow(apartmentId, photoUrl, nextSortOrder)
      uploaded.push(mapPhotoRow(row))
    } catch (insertError) {
      await client.storage.from(WEBSITE_IMAGES_BUCKET).remove([storagePath])
      throw insertError
    }
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

  await deleteApartmentPhotoRow(photoId)
}

function extractStoragePathFromPublicUrl(publicUrl: string) {
  const marker = `/storage/v1/object/public/${WEBSITE_IMAGES_BUCKET}/`
  const index = publicUrl.indexOf(marker)

  if (index < 0) {
    return null
  }

  return decodeURIComponent(publicUrl.slice(index + marker.length))
}

/** Persists text/features only. Cover image is saved via uploadApartmentCoverPhoto(). */
export async function saveApartmentProfiles(apartments: ApartmentRow[]): Promise<void> {
  await Promise.all(
    apartments.map((apartment) => {
      const {
        id,
        created_at: _createdAt,
        updated_at: _updatedAt,
        cover_image: _coverImage,
        ...patch
      } = apartment
      return updateApartmentRow(id, patch)
    }),
  )
}

export { getWebsiteImagePublicUrl }
