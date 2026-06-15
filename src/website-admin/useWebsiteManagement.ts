import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApartmentId, ApartmentPhoto, ApartmentProfile, ApartmentRow } from '../types/database'
import {
  deleteApartmentPhoto,
  fetchApartmentProfilesWithMeta,
  saveApartmentProfiles,
  uploadApartmentCoverPhoto,
  uploadApartmentGalleryPhotos,
} from '../website/apartmentService'
import { debugApartmentConnection, normalizeApartmentIdForQuery } from '../website/apartmentRepository'
import {
  EMPTY_WEBSITE_SETTINGS_FORM,
  pickWebsiteSettingsFormFields,
  type WebsiteSettingsFormFields,
} from '../website/websiteSettingsFields'
import { fetchWebsiteSettings, updateWebsiteSettings, uploadHeroImage } from '../website/websiteContentService'
import { logApartmentLoad, logApartmentLoadError } from '../website/apartmentLoadLog'

export type GeneralInfoForm = WebsiteSettingsFormFields

export type WebsiteManagementTab = 'general' | ApartmentId

export interface PendingGalleryPhoto {
  tempId: string
  file: File
  previewUrl: string
}

const SAVE_SUCCESS_MESSAGE = 'Web sitesi bilgileri kaydedildi.'

export interface ApartmentLoadMeta {
  configured: boolean
  rawCount: number | null
  profileCount: number
}

function buildDisplayProfile(
  profile: ApartmentProfile,
  pendingCoverPreview: string | null,
  pendingGallery: PendingGalleryPhoto[],
  pendingDeletes: { id: number; photoUrl: string }[],
): ApartmentProfile {
  const deletedIds = new Set(pendingDeletes.map((entry) => entry.id))
  const savedPhotos = profile.photos.filter(
    (photo) => !photo.isPending && !deletedIds.has(photo.id as number),
  )
  const pendingAsPhotos: ApartmentPhoto[] = pendingGallery.map((item, index) => ({
    id: item.tempId,
    apartmentId: profile.apartment.id,
    photoUrl: item.previewUrl,
    sortOrder: savedPhotos.length + index,
    createdAt: new Date().toISOString(),
    isPending: true,
  }))

  return {
    apartment: profile.apartment,
    coverUrl: pendingCoverPreview ?? profile.coverUrl,
    photos: [...savedPhotos, ...pendingAsPhotos],
  }
}

export function useWebsiteManagement() {
  const [activeTab, setActiveTab] = useState<WebsiteManagementTab>('general')
  const [generalForm, setGeneralForm] = useState<GeneralInfoForm>(EMPTY_WEBSITE_SETTINGS_FORM)
  const [apartments, setApartments] = useState<ApartmentProfile[]>([])
  const [pendingCoverFiles, setPendingCoverFiles] = useState<Record<number, File | null>>({})
  const [pendingCoverPreviews, setPendingCoverPreviews] = useState<Record<number, string | null>>({})
  const [pendingGallery, setPendingGallery] = useState<Record<number, PendingGalleryPhoto[]>>({})
  const [pendingDeletes, setPendingDeletes] = useState<Record<number, { id: number; photoUrl: string }[]>>({})
  const [pendingHeroFile, setPendingHeroFile] = useState<File | null>(null)
  const [pendingHeroPreview, setPendingHeroPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [apartmentLoadMeta, setApartmentLoadMeta] = useState<ApartmentLoadMeta>({
    configured: false,
    rawCount: null,
    profileCount: 0,
  })
  const [refreshToken, setRefreshToken] = useState(0)

  const refetch = useCallback(() => {
    setRefreshToken((current) => current + 1)
  }, [])

  const clearPendingState = useCallback(() => {
    setPendingCoverPreviews((current) => {
      for (const preview of Object.values(current)) {
        if (preview) {
          URL.revokeObjectURL(preview)
        }
      }
      return {}
    })
    setPendingGallery((current) => {
      for (const items of Object.values(current)) {
        for (const item of items) {
          URL.revokeObjectURL(item.previewUrl)
        }
      }
      return {}
    })
    setPendingHeroPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return null
    })
    setPendingCoverFiles({})
    setPendingDeletes({})
    setPendingHeroFile(null)
  }, [])

  useEffect(() => {
    async function loadContent() {
      setLoading(true)
      setError(null)

      try {
        let settingsError: string | null = null
        let apartmentsError: string | null = null

        try {
          const settings = await fetchWebsiteSettings()
          setGeneralForm(pickWebsiteSettingsFormFields(settings))
        } catch (loadError) {
          settingsError =
            loadError instanceof Error ? loadError.message : 'Genel bilgiler yüklenemedi.'
        }

        try {
          logApartmentLoad('useWebsiteManagement loadContent → fetching apartments')
          const connection = await debugApartmentConnection()
          const { profiles: apartmentProfiles, rawCount } = await fetchApartmentProfilesWithMeta()
          setApartments(apartmentProfiles)
          setApartmentLoadMeta({
            configured: connection.supabaseConfigured,
            rawCount,
            profileCount: apartmentProfiles.length,
          })
          logApartmentLoad('useWebsiteManagement loadContent → apartments state updated', {
            count: apartmentProfiles.length,
            rawCount,
            configured: connection.supabaseConfigured,
          })
        } catch (loadError) {
          logApartmentLoadError('useWebsiteManagement loadContent → apartment load failed', loadError)
          apartmentsError =
            loadError instanceof Error ? loadError.message : 'Apart bilgileri yüklenemedi.'
          setApartments([])
          setApartmentLoadMeta({
            configured: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
            rawCount: null,
            profileCount: 0,
          })
        }

        clearPendingState()

        if (settingsError && apartmentsError) {
          setError(`${settingsError} / ${apartmentsError}`)
        } else if (apartmentsError) {
          setError(apartmentsError)
        } else if (settingsError) {
          setError(settingsError)
        } else {
          setError(null)
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'İçerik yüklenemedi.'
        console.error('[WebsiteManagement] loadContent failed', {
          file: 'src/website-admin/useWebsiteManagement.ts',
          error: message,
        })
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadContent()
  }, [refreshToken, clearPendingState])

  const displayApartments = useMemo(() => {
    return apartments.map((profile) =>
      buildDisplayProfile(
        profile,
        pendingCoverPreviews[profile.apartment.id] ?? null,
        pendingGallery[profile.apartment.id] ?? [],
        pendingDeletes[profile.apartment.id] ?? [],
      ),
    )
  }, [apartments, pendingCoverPreviews, pendingGallery, pendingDeletes])

  const heroPreviewUrl =
    pendingHeroPreview ??
    (generalForm.hero_image_path?.trim() ? generalForm.hero_image_path : null)

  function updateGeneralField<K extends keyof GeneralInfoForm>(key: K, value: GeneralInfoForm[K]) {
    setGeneralForm((current) => ({ ...current, [key]: value }))
    setMessage(null)
  }

  function stageHeroPhoto(file: File) {
    setPendingHeroPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return URL.createObjectURL(file)
    })
    setPendingHeroFile(file)
    setMessage(null)
  }

  function updateApartmentField<K extends keyof ApartmentRow>(
    apartmentId: ApartmentId,
    key: K,
    value: ApartmentRow[K],
  ) {
    setApartments((current) => {
      if (!current) {
        return current
      }

      return current.map((profile) =>
        profile.apartment.id === apartmentId
          ? {
              ...profile,
              apartment: {
                ...profile.apartment,
                [key]: value,
              },
            }
          : profile,
      )
    })
    setMessage(null)
  }

  function stageCoverPhoto(apartmentId: ApartmentId, file: File) {
    const numericId = normalizeApartmentIdForQuery(apartmentId)

    setPendingCoverPreviews((current) => {
      const previous = current[numericId]
      if (previous) {
        URL.revokeObjectURL(previous)
      }

      return {
        ...current,
        [numericId]: URL.createObjectURL(file),
      }
    })
    setPendingCoverFiles((current) => ({ ...current, [numericId]: file }))
    setMessage(null)
  }

  function stageGalleryPhotos(apartmentId: ApartmentId, files: File[]) {
    if (files.length === 0) {
      return
    }

    const staged = files.map((file) => ({
      tempId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setPendingGallery((current) => ({
      ...current,
      [apartmentId]: [...(current[apartmentId] ?? []), ...staged],
    }))
    setMessage(null)
  }

  function removePendingGalleryPhoto(apartmentId: ApartmentId, tempId: string) {
    setPendingGallery((current) => {
      const target = (current[apartmentId] ?? []).find((item) => item.tempId === tempId)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }

      return {
        ...current,
        [apartmentId]: (current[apartmentId] ?? []).filter((item) => item.tempId !== tempId),
      }
    })
  }

  function markGalleryPhotoForDeletion(apartmentId: ApartmentId, photo: ApartmentPhoto) {
    if (photo.isPending) {
      removePendingGalleryPhoto(apartmentId, String(photo.id))
      return
    }

    setPendingDeletes((current) => ({
      ...current,
      [apartmentId]: [
        ...(current[apartmentId] ?? []),
        { id: photo.id as number, photoUrl: photo.photoUrl },
      ],
    }))
    setMessage(null)
  }

  async function saveAll() {
    if (apartments.length === 0) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      let nextApartments = [...apartments]
      let nextGeneralForm = { ...generalForm }

      if (pendingHeroFile) {
        const heroImageUrl = await uploadHeroImage(pendingHeroFile)
        nextGeneralForm = {
          ...nextGeneralForm,
          hero_image_path: heroImageUrl,
        }
      }

      for (const profile of apartments) {
        const apartmentId = normalizeApartmentIdForQuery(profile.apartment.id)

        for (const photo of pendingDeletes[apartmentId] ?? []) {
          await deleteApartmentPhoto(photo.id, photo.photoUrl)
        }

        nextApartments = nextApartments.map((entry) =>
          entry.apartment.id === apartmentId
            ? {
                ...entry,
                photos: entry.photos.filter(
                  (photo) =>
                    photo.isPending ||
                    !(pendingDeletes[apartmentId] ?? []).some((item) => item.id === photo.id),
                ),
              }
            : entry,
        )

        const coverFile = pendingCoverFiles[apartmentId]
        if (coverFile) {
          const { storagePath, publicUrl } = await uploadApartmentCoverPhoto(apartmentId, coverFile)
          nextApartments = nextApartments.map((entry) =>
            entry.apartment.id === apartmentId
              ? {
                  ...entry,
                  apartment: {
                    ...entry.apartment,
                    cover_image: storagePath,
                  },
                  coverUrl: publicUrl,
                }
              : entry,
          )
        }

        const galleryFiles = (pendingGallery[apartmentId] ?? []).map((item) => item.file)
        if (galleryFiles.length > 0) {
          const uploadedPhotos = await uploadApartmentGalleryPhotos(apartmentId, galleryFiles)
          nextApartments = nextApartments.map((entry) =>
            entry.apartment.id === apartmentId
              ? {
                  ...entry,
                  photos: [...entry.photos, ...uploadedPhotos],
                }
              : entry,
          )
        }
      }

      await updateWebsiteSettings(nextGeneralForm)
      await saveApartmentProfiles(nextApartments.map((profile) => profile.apartment))

      setGeneralForm(nextGeneralForm)
      setApartments(nextApartments)
      clearPendingState()
      setMessage(SAVE_SUCCESS_MESSAGE)
      refetch()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kayıt başarısız.')
    } finally {
      setSaving(false)
    }
  }

  return {
    activeTab,
    setActiveTab,
    generalForm,
    heroPreviewUrl,
    apartments: displayApartments,
    apartmentLoadMeta,
    loading,
    saving,
    error,
    message,
    refetch,
    updateGeneralField,
    updateApartmentField,
    saveAll,
    stageCoverPhoto,
    stageGalleryPhotos,
    stageHeroPhoto,
    markGalleryPhotoForDeletion,
  }
}
