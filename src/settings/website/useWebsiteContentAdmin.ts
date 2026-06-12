import { useCallback, useEffect, useState } from 'react'
import type { WebsiteGalleryCategory, WebsiteGalleryPhoto, WebsiteSettingsRow } from '../../types/database'
import {
  fetchWebsiteGallery,
  fetchWebsiteSettings,
  updateWebsiteSettings,
} from '../../website/websiteContentService'

export function useWebsiteContentAdmin() {
  const [settings, setSettings] = useState<WebsiteSettingsRow | null>(null)
  const [gallery, setGallery] = useState<WebsiteGalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1)
  }, [])

  useEffect(() => {
    async function loadAdminContent() {
      setLoading(true)

      try {
        const [settingsResult, galleryResult] = await Promise.all([
          fetchWebsiteSettings(),
          fetchWebsiteGallery(),
        ])

        setSettings(settingsResult)
        setGallery(galleryResult)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Site içeriği yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    void loadAdminContent()
  }, [refreshToken])

  async function saveSettings(
    patch: Partial<Omit<WebsiteSettingsRow, 'id' | 'created_at' | 'updated_at'>>,
  ) {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const updated = await updateWebsiteSettings(patch)
      setSettings(updated)
      setMessage('Ayarlar kaydedildi.')
      return updated
    } catch (saveError) {
      const errorMessage = saveError instanceof Error ? saveError.message : 'Kayıt başarısız.'
      setError(errorMessage)
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  function getGalleryByCategory(category: WebsiteGalleryCategory) {
    return gallery
      .filter((photo) => photo.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  return {
    settings,
    gallery,
    loading,
    saving,
    error,
    message,
    setMessage,
    setError,
    saveSettings,
    refetch,
    getGalleryByCategory,
  }
}
