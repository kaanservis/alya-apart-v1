import { HeroSection } from '../sections/HeroSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { AboutSection } from '../sections/AboutSection'
import { GallerySection } from '../sections/GallerySection'
import { LocationSection } from '../sections/LocationSection'
import { InstagramSection } from '../sections/InstagramSection'
import { ContactSection } from '../sections/ContactSection'
import { useSiteSeo } from '../useSiteSeo'
import { useSiteContent } from '../SiteContentContext'

export function LandingPage() {
  const { settings, heroBackgroundUrl } = useSiteContent()

  useSiteSeo({
    title: settings.meta_title || settings.site_title,
    description: settings.meta_description,
    keywords: settings.meta_keywords,
    path: '/site',
    image: heroBackgroundUrl,
  })

  return (
    <>
      <HeroSection />
      <ExperienceSection />
      <AboutSection />
      <GallerySection />
      <LocationSection />
      <InstagramSection />
      <ContactSection />
    </>
  )
}
