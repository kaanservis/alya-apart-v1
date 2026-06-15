import type { RoomDisplayStatus } from '../types/database'

export const ROOM_DISPLAY_ROOM_CLASS: Record<RoomDisplayStatus, string> = {
  Boş: 'room-empty',
  'Bugün Giriş': 'room-today-checkin',
  Dolu: 'room-occupied',
  'Çıkış Bugün': 'room-checkout',
  'Temizlik Bekliyor': 'room-cleaning',
}

export const ROOM_DISPLAY_BADGE_CLASS: Record<RoomDisplayStatus, string> = {
  Boş: 'room-badge-empty',
  'Bugün Giriş': 'room-badge-today-checkin',
  Dolu: 'room-badge-occupied',
  'Çıkış Bugün': 'room-badge-checkout',
  'Temizlik Bekliyor': 'room-badge-cleaning',
}
