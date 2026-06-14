import type { UnitStatus } from '../types/database'

export const UNIT_STATUS_ROOM_CLASS: Record<UnitStatus, string> = {
  Boş: 'room-empty',
  Dolu: 'room-occupied',
  'Çıkış Bekliyor': 'room-checkout',
  'Temizlik Bekliyor': 'room-cleaning',
}

export const UNIT_STATUS_BADGE_CLASS: Record<UnitStatus, string> = {
  Boş: 'room-badge-empty',
  Dolu: 'room-badge-occupied',
  'Çıkış Bekliyor': 'room-badge-checkout',
  'Temizlik Bekliyor': 'room-badge-cleaning',
}
