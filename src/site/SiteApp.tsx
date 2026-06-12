import { useEffect, useState } from 'react'
import { SiteLayout } from './components/SiteLayout'
import { LandingPage } from './pages/LandingPage'
import { PrivateRoomPage } from './pages/PrivateRoomPage'
import { SiteContentProvider } from './SiteContentContext'
import { readSiteLocation, type SiteLocation } from './siteRouter'

export function SiteApp() {
  const [location, setLocation] = useState<SiteLocation>(() => readSiteLocation())

  useEffect(() => {
    function handlePopState() {
      setLocation(readSiteLocation())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <SiteContentProvider>
      {location.page === 'private-room' && location.roomShareSlug ? (
        <SiteLayout privatePage>
          <PrivateRoomPage shareSlug={location.roomShareSlug} />
        </SiteLayout>
      ) : (
        <SiteLayout>
          <LandingPage />
        </SiteLayout>
      )}
    </SiteContentProvider>
  )
}
