import { useEffect, useState } from 'react'
import { FALLBACK_COVER_IMAGE, resolveImageUrl } from '../siteFallbackImage'

interface SiteImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
}

export function SiteImage({ src, alt = '', className, ...props }: SiteImageProps) {
  const [imageUrl, setImageUrl] = useState(() => resolveImageUrl(src))

  useEffect(() => {
    setImageUrl(resolveImageUrl(src))
  }, [src])

  return (
    <img
      {...props}
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setImageUrl(FALLBACK_COVER_IMAGE)}
    />
  )
}
