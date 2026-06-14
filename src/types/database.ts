export type UnitStatus = 'Boş' | 'Dolu' | 'Çıkış Bekliyor' | 'Temizlik Bekliyor'
export type ReservationStatus = 'Aktif' | 'Geçmiş'

export interface AccommodationUnit {
  id: string
  name: string
  display_order: number
  status: UnitStatus
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  ad_soyad: string
  telefon: string
  kisi_sayisi: number
  giris_tarihi: string
  cikis_tarihi: string
  konaklama_birimi_id: string
  gunluk_ucret: number
  toplam_ucret: number
  kapora: number
  kapora_tahsil: number
  giris_te_alinan: number
  alinan_tutar: number
  notlar: string | null
  durum: ReservationStatus
  created_at: string
  updated_at: string
}

export interface PaymentRecord {
  id: string
  reservation_id: string
  amount: number
  payment_date: string
  note: string | null
  created_at: string
}

export type GuestPhotoType = 'front_id' | 'back_id' | 'guest_photo'

export interface GuestEntry {
  id: string
  reservation_id: string
  full_name: string
  tc_no: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface GuestPhoto {
  id: string
  guest_entry_id: string
  photo_type: GuestPhotoType
  photo_url: string
  created_at: string
}

export interface Expense {
  id: string
  tarih: string
  aciklama: string
  tutar: number
  created_at: string
  updated_at: string
}

export interface WebsiteRoomProfile {
  id: string
  accommodation_unit_id: string
  description: string
  capacity: number
  features: string[]
  created_at: string
  updated_at: string
}

export interface WebsiteRoomPhoto {
  id: string
  accommodation_unit_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

export interface WebsiteRoom {
  unitId: string
  unitName: string
  description: string
  capacity: number
  features: string[]
  photos: { id: string; url: string; sortOrder: number; storagePath: string }[]
}

export type WebsiteGalleryCategory = 'homepage' | 'deniz' | 'plaj' | 'apart' | 'cevre'

export interface WebsiteSettingsRow {
  id: string
  site_title: string
  site_subtitle: string
  welcome_text: string
  about_short: string
  hero_image_path: string | null
  phone: string
  whatsapp: string
  instagram: string
  facebook: string
  email: string
  address: string
  maps_embed: string
  maps_link: string
  about_content: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  instagram_url: string
  facebook_url: string
  tiktok_url: string
  youtube_url: string
  created_at: string
  updated_at: string
}

export interface WebsiteGalleryRow {
  id: string
  category: WebsiteGalleryCategory
  storage_path: string
  sort_order: number
  created_at: string
}

export interface WebsiteGalleryPhoto {
  id: string
  category: WebsiteGalleryCategory
  storagePath: string
  sortOrder: number
  url: string
  createdAt: string
}

export interface Database {
  public: {
    Tables: {
      accommodation_units: {
        Row: AccommodationUnit
        Insert: Omit<AccommodationUnit, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<AccommodationUnit>
      }
      reservations: {
        Row: Reservation
        Insert: Omit<Reservation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Reservation, 'id' | 'created_at' | 'updated_at'>>
      }
      payment_records: {
        Row: PaymentRecord
        Insert: Omit<PaymentRecord, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PaymentRecord, 'id' | 'created_at'>>
      }
      guest_entries: {
        Row: GuestEntry
        Insert: Omit<GuestEntry, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<GuestEntry, 'id' | 'created_at'>>
      }
      guest_photos: {
        Row: GuestPhoto
        Insert: Omit<GuestPhoto, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<GuestPhoto, 'id' | 'created_at'>>
      }
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
      }
      website_room_profiles: {
        Row: WebsiteRoomProfile
        Insert: Omit<WebsiteRoomProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<WebsiteRoomProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      website_room_photos: {
        Row: WebsiteRoomPhoto
        Insert: Omit<WebsiteRoomPhoto, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<WebsiteRoomPhoto, 'id' | 'created_at'>>
      }
      website_settings: {
        Row: WebsiteSettingsRow
        Insert: Omit<WebsiteSettingsRow, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<WebsiteSettingsRow, 'id' | 'created_at' | 'updated_at'>>
      }
      website_gallery: {
        Row: WebsiteGalleryRow
        Insert: Omit<WebsiteGalleryRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<WebsiteGalleryRow, 'id' | 'created_at'>>
      }
    }
  }
}

export const UNIT_STATUSES: UnitStatus[] = [
  'Boş',
  'Dolu',
  'Çıkış Bekliyor',
  'Temizlik Bekliyor',
]

export const RESERVATION_STATUSES: ReservationStatus[] = ['Aktif', 'Geçmiş']

export const UNIT_NAMES = [
  'Yaren 2',
  'Belkız 3',
  'Ayşegül 7',
  'Berrin 8',
  '201',
  '202',
  '203',
  '204',
  '205',
  '301',
  '302',
  '303',
  '304',
  '305',
] as const
