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
  birth_date?: string | null
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

export type ApartmentId = number

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ApartmentRow {
  id: ApartmentId
  name: string
  description: string
  cover_image: string | null
  feature_near_sea: boolean
  feature_wifi: boolean
  feature_ac: boolean
  feature_kitchen: boolean
  feature_balcony: boolean
  feature_family_friendly: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ApartmentPhotoRow {
  id: ApartmentId
  apartment_id: ApartmentId
  photo_url: string
  sort_order: number
  created_at: string
}

export interface ApartmentPhoto {
  id: ApartmentId | string
  apartmentId: ApartmentId
  photoUrl: string
  sortOrder: number
  createdAt: string
  isPending?: boolean
}

export interface ApartmentProfile {
  apartment: ApartmentRow
  photos: ApartmentPhoto[]
  coverUrl: string | null
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
      apartments: {
        Row: ApartmentRow
        Insert: Omit<ApartmentRow, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ApartmentRow, 'id' | 'created_at' | 'updated_at'>>
      }
      apartment_photos: {
        Row: ApartmentPhotoRow
        Insert: Omit<ApartmentPhotoRow, 'id' | 'created_at'> & {
          id?: ApartmentId
          created_at?: string
        }
        Update: Partial<Omit<ApartmentPhotoRow, 'id' | 'created_at'>>
      }
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: string
          active: boolean
          can_view_prices: boolean
          can_edit_prices: boolean
          can_view_reports: boolean
          can_delete_reservations: boolean
          can_change_dates: boolean
          can_manage_users: boolean
          can_manage_website: boolean
          can_view_customer_tc: boolean
          can_upload_photos: boolean
          created_at: string
        }
        Insert: never
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      authenticate_admin: {
        Args: { p_username: string; p_password: string }
        Returns: Json
      }
      list_admin_users: {
        Args: { p_caller_id: string }
        Returns: Json
      }
      create_admin_user: {
        Args: {
          p_caller_id: string
          p_username: string
          p_password: string
          p_role: string
          p_active: boolean
          p_can_view_prices: boolean
          p_can_edit_prices: boolean
          p_can_view_reports: boolean
          p_can_delete_reservations: boolean
          p_can_change_dates: boolean
          p_can_manage_users: boolean
          p_can_manage_website: boolean
          p_can_view_customer_tc: boolean
          p_can_upload_photos: boolean
        }
        Returns: Json
      }
      update_admin_user: {
        Args: {
          p_caller_id: string
          p_user_id: string
          p_username: string
          p_password: string | null
          p_role: string
          p_active: boolean
          p_can_view_prices: boolean
          p_can_edit_prices: boolean
          p_can_view_reports: boolean
          p_can_delete_reservations: boolean
          p_can_change_dates: boolean
          p_can_manage_users: boolean
          p_can_manage_website: boolean
          p_can_view_customer_tc: boolean
          p_can_upload_photos: boolean
        }
        Returns: Json
      }
      delete_admin_user: {
        Args: { p_caller_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
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
