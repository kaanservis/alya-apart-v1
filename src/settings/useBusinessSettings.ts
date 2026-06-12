import { useEffect, useState } from 'react'
import {
  getBusinessSettings,
  SETTINGS_CHANGED_EVENT,
  type BusinessSettings,
} from './businessSettings'

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings>(() => getBusinessSettings())

  useEffect(() => {
    function handleSettingsChanged() {
      setSettings(getBusinessSettings())
    }

    window.addEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged)
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handleSettingsChanged)
  }, [])

  return settings
}
