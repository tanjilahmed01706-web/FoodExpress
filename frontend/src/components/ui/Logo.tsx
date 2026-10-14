import { brandLogoUrl } from '../../lib/api'
import type { AppSetting } from '../../types'

interface LogoProps {
  brand: AppSetting
  size?: number
  className?: string
}

export function FoodExpressLogo({ brand, size = 34, className = '' }: LogoProps) {
  const src = brandLogoUrl(brand)
  const alt = `${brand.siteName ?? 'FoodExpress'} logo`
  const isLarge = size >= 48
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block rounded-full bg-white p-0.5 shadow-sm ${isLarge ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}

interface HeroLogoProps {
  brand: AppSetting
  className?: string
}

export function FoodExpressHeroLogo({ brand, className = '' }: HeroLogoProps) {
  const src = brandLogoUrl(brand)
  return (
    <img
      src={src}
      alt={`${brand.siteName ?? 'FoodExpress'} — Fast • Fresh • For You`}
      className={`h-auto w-auto max-w-[220px] object-contain ${className}`}
    />
  )
}

export function FoodExpressName({ brand, className = '' }: { brand: AppSetting; className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      {brand.siteName ?? 'FoodExpress'}
    </span>
  )
}
