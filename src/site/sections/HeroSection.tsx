import { useEffect, useState } from 'react'
import { CallButton, LocationButton, WhatsAppButton } from '../components/SiteActions'
import {
  getDefaultHeroBackgroundUrl,
  getNextHeroFallbackUrl,
  HERO_OVERLAY_STYLE,
  isPlaceholderHeroUrl,
} from '../heroBackground'
import { scrollToSection } from '../siteConfig'
import { useSiteContent } from '../SiteContentContext'

export function HeroSection() {
  const { settings, heroBackgroundUrl } = useSiteContent()
  const [imageUrl, setImageUrl] = useState(() =>
    isPlaceholderHeroUrl(heroBackgroundUrl) ? getDefaultHeroBackgroundUrl() : heroBackgroundUrl,
  )

  useEffect(() => {
    setImageUrl(
      isPlaceholderHeroUrl(heroBackgroundUrl) ? getDefaultHeroBackgroundUrl() : heroBackgroundUrl,
    )
  }, [heroBackgroundUrl])

  function handleImageError() {
    setImageUrl((current) => {
      const fallback = getNextHeroFallbackUrl(current)
      return fallback === current ? getDefaultHeroBackgroundUrl() : fallback
    })
  }

  return (
    <section
      id="hero"
      className="relative isolate min-h-[100dvh] overflow-hidden bg-sky-900"
      style={{
        backgroundImage: `url(${getDefaultHeroBackgroundUrl()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt="Avşa Adası turkuaz deniz, plaj şemsiyeleri ve yaz tatili manzarası"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
          decoding="async"
          onError={handleImageError}
        />
        <div className="absolute inset-0" style={HERO_OVERLAY_STYLE} aria-hidden="true" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-end px-4 pb-12 pt-28 sm:justify-center sm:px-6 sm:pb-16 sm:pt-32 lg:px-8">
        <div className="w-full max-w-xl space-y-4 sm:max-w-2xl sm:space-y-5 lg:max-w-3xl">
          <h1 className="text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
            {settings.site_title}
          </h1>

          <p className="text-lg font-medium leading-snug text-white drop-shadow-sm sm:text-2xl">
            {settings.site_subtitle}
          </p>

          <p className="max-w-md text-base leading-relaxed text-white/95 drop-shadow-sm sm:max-w-xl sm:text-lg">
            {settings.welcome_text}
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-4">
            <WhatsAppButton label="WhatsApp" className="w-full justify-center sm:w-auto sm:min-w-[9.5rem]" />
            <CallButton
              label="Ara"
              large
              className="w-full justify-center sm:w-auto sm:min-w-[9.5rem]"
            />
            <LocationButton
              label="Konum"
              onClick={() => scrollToSection('location')}
              className="w-full justify-center sm:w-auto sm:min-w-[9.5rem]"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block">
        <button
          type="button"
          onClick={() => scrollToSection('experience')}
          aria-label="Aşağı kaydır"
          className="rounded-full bg-white/10 p-3 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/20"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
