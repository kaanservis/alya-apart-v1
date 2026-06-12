import { getTurkeyDateKey } from '../lib/turkeyDate'

export function getBackupTimestamp(date = new Date()) {
  const datePart = getTurkeyDateKey(date)
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(':', '-')

  return `${datePart}-${timePart}`
}

export function buildBackupFileName(extension: 'json' | 'csv') {
  return `alya-apart-backup-${getBackupTimestamp()}.${extension}`
}

export function formatBackupFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
