import { useEffect, useState } from 'react'
import { fetchWebsiteRooms } from '../website/websiteService'
import type { WebsiteRoom } from '../types/database'

export function useWebsiteRooms(refreshToken = 0) {
  const [rooms, setRooms] = useState<WebsiteRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadRooms() {
      setLoading(true)

      try {
        const data = await fetchWebsiteRooms()
        if (!cancelled) {
          setRooms(data)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Odalar yüklenemedi.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRooms()

    return () => {
      cancelled = true
    }
  }, [refreshToken])

  return { rooms, loading, error, refetch: () => {} }
}
