import type { GuestEntry, GuestPhoto, GuestPhotoType } from '../types/database'

export interface GuestEntryWithPhotos extends GuestEntry {
  photos: GuestPhoto[]
}

export const GUEST_PHOTO_LABELS: Record<GuestPhotoType, string> = {
  front_id: 'Kimlik Ön Yüz',
  back_id: 'Kimlik Arka Yüz',
  guest_photo: 'Misafir Fotoğrafı',
}
