const SETTINGS_STORAGE_KEY = 'alya-apart-business-settings'
const SETTINGS_CHANGED_EVENT = 'alya-settings-changed'

export interface BusinessSettings {
  businessWhatsAppNumber: string
}

function getDefaultBusinessWhatsAppNumber() {
  return import.meta.env.VITE_SITE_WHATSAPP ?? '905320000000'
}

function readStoredSettings(): BusinessSettings {
  if (typeof window === 'undefined') {
    return { businessWhatsAppNumber: getDefaultBusinessWhatsAppNumber() }
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return { businessWhatsAppNumber: getDefaultBusinessWhatsAppNumber() }
    }

    const parsed = JSON.parse(raw) as Partial<BusinessSettings>
    return {
      businessWhatsAppNumber:
        parsed.businessWhatsAppNumber?.trim() || getDefaultBusinessWhatsAppNumber(),
    }
  } catch {
    return { businessWhatsAppNumber: getDefaultBusinessWhatsAppNumber() }
  }
}

export function getBusinessSettings(): BusinessSettings {
  return readStoredSettings()
}

export function saveBusinessSettings(settings: BusinessSettings) {
  const normalized = {
    businessWhatsAppNumber: settings.businessWhatsAppNumber.trim(),
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT))
}

export function getBusinessWhatsAppNumberRaw() {
  return getBusinessSettings().businessWhatsAppNumber
}

export { SETTINGS_CHANGED_EVENT }
