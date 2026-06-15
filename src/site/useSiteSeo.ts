import { useEffect } from 'react'
import { getAbsoluteSiteUrl } from './siteConfig'

interface SiteSeoOptions {
  title?: string
  description?: string
  keywords?: string
  path?: string
  image?: string
  noIndex?: boolean
}

function upsertMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  const selector = `meta[${attribute}="${name}"]`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function removeMeta(name: string, attribute: 'name' | 'property' = 'name') {
  document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove()
}

export function useSiteSeo({
  title = '',
  description = '',
  keywords = '',
  path = '/',
  image,
  noIndex = false,
}: SiteSeoOptions = {}) {
  useEffect(() => {
    const fullTitle = title.trim()
    const siteName = fullTitle.includes('|')
      ? fullTitle.split('|')[0]?.trim() || fullTitle
      : fullTitle
    const metaDescription = description
    const ogImage = getAbsoluteSiteUrl(image ?? '')
    const canonicalUrl = getAbsoluteSiteUrl(path)

    document.title =
      noIndex && title && title !== siteName ? `${title} | ${siteName}` : fullTitle || siteName

    upsertMeta('description', metaDescription)

    if (noIndex) {
      upsertMeta('robots', 'noindex, nofollow')
    } else {
      removeMeta('robots')
      if (keywords) {
        upsertMeta('keywords', keywords)
      }
    }

    if (noIndex) {
      removeMeta('og:title', 'property')
      removeMeta('og:description', 'property')
      removeMeta('og:image', 'property')
      removeMeta('og:url', 'property')
      removeMeta('twitter:card')
      removeMeta('twitter:title')
      removeMeta('twitter:description')
      removeMeta('twitter:image')
    } else {
      upsertMeta('og:title', fullTitle || siteName, 'property')
      upsertMeta('og:description', metaDescription, 'property')
      upsertMeta('og:type', 'website', 'property')
      upsertMeta('og:locale', 'tr_TR', 'property')
      upsertMeta('og:site_name', siteName, 'property')
      if (image) {
        upsertMeta('og:image', ogImage, 'property')
      }
      upsertMeta('og:url', canonicalUrl, 'property')
      upsertMeta('twitter:card', 'summary_large_image')
      upsertMeta('twitter:title', fullTitle || siteName)
      upsertMeta('twitter:description', metaDescription)
      if (image) {
        upsertMeta('twitter:image', ogImage)
      }
    }

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (noIndex) {
      canonical?.remove()
    } else {
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = canonicalUrl
    }

    return () => {
      if (noIndex) {
        removeMeta('robots')
      }
    }
  }, [title, description, keywords, path, image, noIndex])
}
