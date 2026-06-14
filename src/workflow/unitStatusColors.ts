import type { UnitStatus } from '../types/database'

export const UNIT_STATUS_CARD_BG: Record<UnitStatus, string> = {
  Boş: '#EAF4FF',
  Dolu: '#F3E8FF',
  'Çıkış Bekliyor': '#FFF1E6',
  'Temizlik Bekliyor': '#FFF9DB',
}

export const UNIT_STATUS_CARD_BORDER: Record<UnitStatus, string> = {
  Boş: '#BFDBFE',
  Dolu: '#DDD6FE',
  'Çıkış Bekliyor': '#FED7AA',
  'Temizlik Bekliyor': '#FDE68A',
}
