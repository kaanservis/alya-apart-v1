import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  WebsiteGalleryCategory,
  WebsiteGalleryPhoto,
  WebsiteGalleryRow,
  WebsiteSettingsRow,
} from '../types/database'
import { DEFAULT_WEBSITE_SETTINGS } from './websiteContentDefaults'
import { getWebsiteImagePublicUrl, WEBSITE_IMAGES_BUCKET } from './websiteImageService'
import {
  EMPTY_WEBSITE_SETTINGS_FORM,
  WEBSITE_SETTINGS_SELECT,
  type WebsiteSettingsFormFields,
} from './websiteSettingsFields'

const SITE_PHOTOS_BUCKET = 'site-photos'
const SETTINGS_ROW_ID = 'default'

function logWebsiteSettingsQuery(step: string, payload: Record<string, unknown>) {
  if (!import.meta.env.DEV) {
    return
  }

  console.log('[PublicSite]', step, payload)
}

function isMissingWebsiteContentError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('website_settings') ||
    message.includes('website_gallery')
  )
}

function assertSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı.')
  }

  return supabase
}

export function getSitePhotoPublicUrl(storagePath: string) {
  if (!supabase) {
    return storagePath
  }

  const { data } = supabase.storage.from(SITE_PHOTOS_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export function resolveWebsiteSettingsImageUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl?.trim()) {
    return null
  }

  const value = pathOrUrl.trim()

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const websiteImageUrl = getWebsiteImagePublicUrl(value)
  if (websiteImageUrl && websiteImageUrl !== value) {
    return websiteImageUrl
  }

  if (!isSupabaseConfigured || !supabase) {
    return value
  }

  const { data } = supabase.storage.from(SITE_PHOTOS_BUCKET).getPublicUrl(value)
  return data.publicUrl
}

function mapGalleryRow(row: WebsiteGalleryRow): WebsiteGalleryPhoto {
  return {
    id: row.id,
    category: row.category,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
    url: getSitePhotoPublicUrl(row.storage_path),
    createdAt: row.created_at,
  }
}

export async function fetchWebsiteSettings(): Promise<WebsiteSettingsRow> {
  logWebsiteSettingsQuery('Supabase query → website_settings', {
    table: 'website_settings',
    select: WEBSITE_SETTINGS_SELECT,
    filter: { id: SETTINGS_ROW_ID },
    supabaseConfigured: isSupabaseConfigured,
  })

  if (!isSupabaseConfigured || !supabase) {
    logWebsiteSettingsQuery('Supabase query skipped (not configured)', {
      using: 'DEFAULT_WEBSITE_SETTINGS (empty)',
    })
    return DEFAULT_WEBSITE_SETTINGS
  }

  const client = assertSupabaseClient()
  const { data, error } = await client
    .from('website_settings')
    .select(WEBSITE_SETTINGS_SELECT)
    .eq('id', SETTINGS_ROW_ID)
    .maybeSingle()

  if (error) {
    logWebsiteSettingsQuery('Supabase query failed', {
      message: error.message,
      code: error.code,
    })

    if (isMissingWebsiteContentError(error)) {
      throw new Error('website_settings tablosu bulunamadı.')
    }

    throw new Error(error.message)
  }

  if (!data) {
    logWebsiteSettingsQuery('Supabase query returned no row', {
      using: 'DEFAULT_WEBSITE_SETTINGS (empty)',
    })

    return {
      ...DEFAULT_WEBSITE_SETTINGS,
      ...EMPTY_WEBSITE_SETTINGS_FORM,
    }
  }

  const settings = {
    ...DEFAULT_WEBSITE_SETTINGS,
    ...(data as WebsiteSettingsFormFields),
    id: SETTINGS_ROW_ID,
  }

  logWebsiteSettingsQuery('Supabase query result → website_settings', {
    site_title: settings.site_title,
    site_subtitle: settings.site_subtitle,
    hero_image_path: settings.hero_image_path,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    address: settings.address,
  })

  return settings
}

export async function updateWebsiteSettings(
  patch: Partial<Omit<WebsiteSettingsRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<WebsiteSettingsRow> {
  const client = assertSupabaseClient()

  const { data: currentRow } = await client
    .from('website_settings')
    .select('id')
    .eq('id', SETTINGS_ROW_ID)
    .maybeSingle()

  if (currentRow) {
    const { error } = await client
      .from('website_settings')
      .update(patch as never)
      .eq('id', SETTINGS_ROW_ID)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    const { error } = await client.from('website_settings').insert({
      id: SETTINGS_ROW_ID,
      ...EMPTY_WEBSITE_SETTINGS_FORM,
      ...patch,
    } as never)

    if (error) {
      throw new Error(error.message)
    }
  }

  return fetchWebsiteSettings()
}

export async function fetchWebsiteGallery(
  category?: WebsiteGalleryCategory,
): Promise<WebsiteGalleryPhoto[]> {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const client = assertSupabaseClient()
  let query = client
    .from('website_gallery')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingWebsiteContentError(error)) {
      return []
    }

    throw new Error(error.message)
  }

  return ((data ?? []) as WebsiteGalleryRow[]).map(mapGalleryRow)
}

export async function uploadWebsiteGalleryPhotos(
  category: WebsiteGalleryCategory,
  files: File[],
): Promise<WebsiteGalleryPhoto[]> {
  const client = assertSupabaseClient()
  const uploaded: WebsiteGalleryPhoto[] = []

  const { data: existingPhotos, error: existingError } = await client
    .from('website_gallery')
    .select('sort_order')
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (existingError) {
    throw new Error(existingError.message)
  }

  let nextSortOrder =
    ((existingPhotos ?? []) as Pick<WebsiteGalleryRow, 'sort_order'>[])[0]?.sort_order ?? -1

  for (const file of files) {
    nextSortOrder += 1
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const storagePath = `${category}/${Date.now()}-${crypto.randomUUID()}.${extension}`

    const uploadResult = await client.storage.from(SITE_PHOTOS_BUCKET).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message)
    }

    const insertResult = await client
      .from('website_gallery')
      .insert({
        category,
        storage_path: storagePath,
        sort_order: nextSortOrder,
      } as never)
      .select('*')
      .single()

    if (insertResult.error) {
      await client.storage.from(SITE_PHOTOS_BUCKET).remove([storagePath])
      throw new Error(insertResult.error.message)
    }

    uploaded.push(mapGalleryRow(insertResult.data as WebsiteGalleryRow))
  }

  return uploaded
}

export async function deleteWebsiteGalleryPhoto(photoId: string, storagePath: string) {
  const client = assertSupabaseClient()

  const deleteStorageResult = await client.storage.from(SITE_PHOTOS_BUCKET).remove([storagePath])

  if (deleteStorageResult.error) {
    throw new Error(deleteStorageResult.error.message)
  }

  const deleteResult = await client.from('website_gallery').delete().eq('id', photoId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message)
  }
}

export async function reorderWebsiteGalleryPhotos(
  category: WebsiteGalleryCategory,
  orderedPhotoIds: string[],
) {
  const client = assertSupabaseClient()

  const updates = orderedPhotoIds.map((photoId, index) =>
    client
      .from('website_gallery')
      .update({ sort_order: index } as never)
      .eq('id', photoId)
      .eq('category', category),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    throw new Error(failed.error.message)
  }
}

export async function uploadHeroImage(file: File): Promise<string> {
  const client = assertSupabaseClient()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const storagePath = `hero/${Date.now()}-${crypto.randomUUID()}.${extension}`

  const uploadResult = await client.storage.from(WEBSITE_IMAGES_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message)
  }

  const publicUrl = getWebsiteImagePublicUrl(storagePath)
  await updateWebsiteSettings({ hero_image_path: publicUrl })
  return publicUrl
}

export function resolveHeroImageUrl(settings: WebsiteSettingsRow) {
  return resolveWebsiteSettingsImageUrl(settings.hero_image_path)
}

export function normalizeMapsEmbedValue(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (srcMatch?.[1]) {
    return srcMatch[1]
  }

  return trimmed
}

export function buildPhoneHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:+${digits.startsWith('90') ? digits : `90${digits.replace(/^0/, '')}`}` : 'tel:'
}

export function buildWhatsAppHref(whatsapp: string, message: string) {
  const digits = whatsapp.replace(/\D/g, '')
  const normalized = digits.startsWith('90') ? digits : `90${digits.replace(/^0/, '')}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
