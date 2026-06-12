const BACKUP_SETTINGS_KEY = 'alya-apart-backup-settings'
const BACKUP_SETTINGS_CHANGED = 'alya-backup-settings-changed'

export interface BackupSettings {
  autoDailyBackup: boolean
  lastAutoBackupDate: string | null
}

function readSettings(): BackupSettings {
  if (typeof window === 'undefined') {
    return { autoDailyBackup: false, lastAutoBackupDate: null }
  }

  try {
    const raw = window.localStorage.getItem(BACKUP_SETTINGS_KEY)
    if (!raw) {
      return { autoDailyBackup: false, lastAutoBackupDate: null }
    }

    const parsed = JSON.parse(raw) as Partial<BackupSettings>
    return {
      autoDailyBackup: Boolean(parsed.autoDailyBackup),
      lastAutoBackupDate: parsed.lastAutoBackupDate ?? null,
    }
  } catch {
    return { autoDailyBackup: false, lastAutoBackupDate: null }
  }
}

export function getBackupSettings(): BackupSettings {
  return readSettings()
}

export function saveBackupSettings(settings: BackupSettings) {
  window.localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(BACKUP_SETTINGS_CHANGED))
}

export { BACKUP_SETTINGS_CHANGED }
