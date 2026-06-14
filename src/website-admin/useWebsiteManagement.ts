import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApartmentId, ApartmentPhoto, ApartmentProfile, ApartmentRow } from '../types/database'
import {
  deleteApartmentPhoto,
  fetchApartmentProfiles,
  saveApartmentProfiles,
  uploadApartmentCoverPhoto,
  uploadApartmentGalleryPhotos,
} from '../website/apartmentService'
import { fetchWebsiteSettings, updateWebsiteSettings } from '../website/websiteContentService'

export interface GeneralInfoForm {
  siteTitle: string
  subtitle: string
  phone: string
  whatsapp: string
  instagram: string
  mapsLink: string
  address: string
}

export type WebsiteManagementTab = 'general' | ApartmentId

export interface PendingGalleryPhoto {
  tempId: string
  file: File
  previewUrl: string
}

const SAVE_SUCCESS_MESSAGE = 'Web sitesi bilgileri kaydedildi.'

const EMPTY_GENERAL_FORM: GeneralInfoForm = {
  siteTitle: '',
  subtitle: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  mapsLink: '',
  address: '',
}

function mapSettingsToGeneralForm(settings: Awaited<ReturnType<typeof fetchWebsiteSettings>>): GeneralInfoForm {
  return {
    siteTitle: settings.site_title,
    subtitle: settings.site_subtitle,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    instagram: settings.instagram,
    mapsLink: settings.maps_link,
    address: settings.address,
  }
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
  const [generalForm, setGeneralForm] = useState<GeneralInfoForm>(EMPTY_GENERAL_FORM)
  const [apartments, setApartments] = useState<ApartmentProfile[] | null>(null)
  const [pendingCoverFiles, setPendingCoverFiles] = useState<Record<number, File | null>>({})
  const [pendingCoverPreviews, setPendingCoverPreviews] = useState<Record<number, string | null>>({})
  const [pendingGallery, setPendingGallery] = useState<Record<number, PendingGalleryPhoto[]>>({})
  const [pendingDeletes, setPendingDeletes] = useState<Record<number, { id: number; photoUrl: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
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
    setPendingCoverFiles({})
    setPendingDeletes({})
  }, [])

  useEffect(() => {
    async function loadContent() {
      setLoading(true)
      setError(null)

      try {
        const [settings, apartmentProfiles] = await Promise.all([
          fetchWebsiteSettings(),
          fetchApartmentProfiles(),
        ])

        setGeneralForm(mapSettingsToGeneralForm(settings))
        setApartments(apartmentProfiles)
        clearPendingState()
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'İçerik yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    void loadContent()
  }, [refreshToken, clearPendingState])

  const displayApartments = useMemo(() => {
    if (!apartments) {
      return null
    }

    return apartments.map((profile) =>
      buildDisplayProfile(
        profile,
        pendingCoverPreviews[profile.apartment.id] ?? null,
        pendingGallery[profile.apartment.id] ?? [],
        pendingDeletes[profile.apartment.id] ?? [],
      ),
    )
  }, [apartments, pendingCoverPreviews, pendingGallery, pendingDeletes])

  function updateGeneralField<K extends keyof GeneralInfoForm>(key: K, value: GeneralInfoForm[K]) {
    setGeneralForm((current) => ({ ...current, [key]: value }))
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
    setPendingCoverPreviews((current) => {
      const previous = current[apartmentId]
      if (previous) {
        URL.revokeObjectURL(previous)
      }

      return {
        ...current,
        [apartmentId]: URL.createObjectURL(file),
      }
    })
    setPendingCoverFiles((current) => ({ ...current, [apartmentId]: file }))
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
    if (!apartments) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      let nextApartments = [...apartments]

      for (const profile of apartments) {
        const apartmentId = profile.apartment.id

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
          const coverPhotoUrl = await uploadApartmentCoverPhoto(apartmentId, coverFile)
          nextApartments = nextApartments.map((entry) =>
            entry.apartment.id === apartmentId
              ? {
                  ...entry,
                  apartment: {
                    ...entry.apartment,
                    cover_image: coverPhotoUrl,
                  },
                  coverUrl: coverPhotoUrl,
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

      await updateWebsiteSettings({
        site_title: generalForm.siteTitle,
        site_subtitle: generalForm.subtitle,
        phone: generalForm.phone,
        whatsapp: generalForm.whatsapp,
        instagram: generalForm.instagram,
        maps_link: generalForm.mapsLink,
        address: generalForm.address,
      })

      await saveApartmentProfiles(nextApartments.map((profile) => profile.apartment))
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
    apartments: displayApartments,
    loading,
    saving,
    error,
    message,
    updateGeneralField,
    updateApartmentField,
    saveAll,
    stageCoverPhoto,
    stageGalleryPhotos,
    markGalleryPhotoForDeletion,
  }
}
