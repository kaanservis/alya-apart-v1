import { useEffect } from 'react'
import { HeroSection } from '../sections/HeroSection'
import { ApartmentsSection } from '../sections/ApartmentsSection'
import { AboutSection } from '../sections/AboutSection'
import { GallerySection } from '../sections/GallerySection'
import { LocationSection } from '../sections/LocationSection'
import { InstagramSection } from '../sections/InstagramSection'
import { ContactSection } from '../sections/ContactSection'
import { useSiteSeo } from '../useSiteSeo'
import { useSiteContent } from '../SiteContentContext'
import { siteDebugLog } from '../siteDebugLog'

export function LandingPage() {
  const { settings, heroBackgroundUrl, loading, error } = useSiteContent()

  useEffect(() => {
    siteDebugLog('LandingPage → homepage mount', {
      component: 'LandingPage',
      file: 'src/site/pages/LandingPage.tsx',
      renders: ['HeroSection (title + hero)', 'ApartmentsSection', 'AboutSection', '...'],
    })
  }, [])

  useEffect(() => {
    if (loading) {
      return
    }

    siteDebugLog('LandingPage → settings available for homepage', {
      site_title: settings.site_title,
      site_subtitle: settings.site_subtitle,
      hero_image_path: settings.hero_image_path,
      heroBackgroundUrl,
      error,
    })
  }, [loading, settings.site_title, settings.site_subtitle, settings.hero_image_path, heroBackgroundUrl, error])

  useSiteSeo({
    title: settings.meta_title || settings.site_title,
    description: settings.meta_description,
    keywords: settings.meta_keywords,
    path: '/',
    image: heroBackgroundUrl,
  })

  return (
    <>
      {!loading && error && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {error}
        </div>
      )}

      <HeroSection />
      <ApartmentsSection />
      <AboutSection />
      <GallerySection />
      <LocationSection />
      <InstagramSection />
      <ContactSection />
    </>
  )
}
