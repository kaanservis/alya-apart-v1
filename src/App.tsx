import { useEffect, useState } from 'react'
import { AdminGate } from './auth/AdminGate'
import { AuthProvider } from './auth/AuthContext'
import { AppShellPage } from './app/AppShellPage'
import { readAppSection, type AppSection } from './app/appSection'
import { SiteApp } from './site/SiteApp'

function App() {
  const [section, setSection] = useState<AppSection>(() => readAppSection())

  useEffect(() => {
    function syncSection() {
      setSection(readAppSection())
    }

    window.addEventListener('popstate', syncSection)
    window.addEventListener('hashchange', syncSection)

    return () => {
      window.removeEventListener('popstate', syncSection)
      window.removeEventListener('hashchange', syncSection)
    }
  }, [])

  if (section === 'site') {
    return <SiteApp />
  }

  return (
    <AuthProvider>
      <AdminGate>
        <AppShellPage />
      </AdminGate>
    </AuthProvider>
  )
}

export default App
