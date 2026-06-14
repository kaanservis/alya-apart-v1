import { isSupabaseConfigured, supabase } from '../lib/supabase'

export const WEBSITE_IMAGES_BUCKET = 'website-images'

export function getWebsiteImagePublicUrl(storagePathOrUrl: string) {
  if (!storagePathOrUrl) {
    return ''
  }

  if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
    return storagePathOrUrl
  }

  if (!isSupabaseConfigured || !supabase) {
    return storagePathOrUrl
  }

  const { data } = supabase.storage.from(WEBSITE_IMAGES_BUCKET).getPublicUrl(storagePathOrUrl)
  return data.publicUrl
}
