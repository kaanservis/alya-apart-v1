export const BACKUP_VERSION = 1

export interface BackupPayload {
  version: number
  exportedAt: string
  rooms: import('../types/database').AccommodationUnit[]
  reservations: import('../types/database').Reservation[]
  expenses: import('../types/database').Expense[]
}

export interface BackupPreview {
  roomCount: number
  reservationCount: number
  expenseCount: number
  exportedAt: string | null
}

export type BackupFileType = 'json' | 'excel' | 'auto'
export type RestoreMode = 'full' | 'merge'

export interface BackupHistoryRecord {
  id: string
  createdAt: string
  type: BackupFileType
  fileName: string
  fileSize: number
  content: string
  mimeType: string
}
