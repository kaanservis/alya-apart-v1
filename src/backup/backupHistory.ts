import type { BackupHistoryRecord } from './backupTypes'

const BACKUP_HISTORY_KEY = 'alya-apart-backup-history'
const BACKUP_HISTORY_CHANGED = 'alya-backup-history-changed'
const MAX_HISTORY_ITEMS = 30

function readHistory(): BackupHistoryRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(BACKUP_HISTORY_KEY)
    if (!raw) {
      return []
    }

    return JSON.parse(raw) as BackupHistoryRecord[]
  } catch {
    return []
  }
}

function writeHistory(records: BackupHistoryRecord[]) {
  window.localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY_ITEMS)))
  window.dispatchEvent(new CustomEvent(BACKUP_HISTORY_CHANGED))
}

export function getBackupHistory(): BackupHistoryRecord[] {
  return readHistory()
}

export function addBackupHistoryRecord(record: BackupHistoryRecord) {
  writeHistory([record, ...readHistory()])
}

export function deleteBackupHistoryRecord(recordId: string) {
  writeHistory(readHistory().filter((record) => record.id !== recordId))
}

export function downloadBackupHistoryRecord(record: BackupHistoryRecord) {
  const blob = new Blob([record.content], { type: record.mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = record.fileName
  link.click()
  URL.revokeObjectURL(url)
}

export { BACKUP_HISTORY_CHANGED }
