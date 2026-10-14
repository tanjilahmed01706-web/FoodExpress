/**
 * FoodExpress dynamic branding.
 *
 * Every FoodExpress panel + the admin shell reads the brand from the Strapi
 * singleton `/api/app-setting` and applies it globally:
 *  - document `<title>`  -> siteName + tagline
 *  - document favicon    -> uploaded favicon or bundled FoodExpress artwork
 *  - apple-touch-icon    -> same
 *  - og:image / twitter:image -> same
 *  - CSS variables on <html> so the pink accent is dynamic
 *
 * When no media is uploaded yet, the attached FoodExpress artwork
 * (unnamed-1.png, bundled as /favicon.png and /logo.png) is used as the
 * fallback so the project is branded from first run.
 */

import { useEffect, useState } from 'react'
import { brandLogoUrl, brandFaviconUrl, fetchBrand, EMPTY_BRAND } from '../lib/api'
import type { AppSetting } from '../types'

/** Global brand state for the whole FoodExpress app. */
export function useBrand() {
  const [brand, setBrand] = useState<AppSetting>(EMPTY_BRAND)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const load = async () => {
      try {
        const next = await fetchBrand()
        if (!cancelled) setBrand(next)
      } catch (err) {
        if (!cancelled) {
          console.warn('[FoodExpress] could not load brand from Strapi, using fallback', err)
          // Keep the fallback brand (bundled artwork + default text).
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Retry every 30s so a running admin panel picks up branding edits.
    retryTimer = setInterval(() => {
      load()
    }, 30_000)

    return () => {
      cancelled = true
      if (retryTimer) clearInterval(retryTimer)
    }
  }, [])

  return { brand, loading, refresh: () => setLoading(true) }
}

/**
 * Apply the current FoodExpress brand to the document head.
 * Call once at the top of the app shell.
 */
export function useApplyBrand(brand: AppSetting, ready: boolean) {
  useEffect(() => {
    if (!ready) return

    const apply = () => {
      // Page title: FoodExpress — Fast • Fresh • For You
      const headTitle = [brand.siteName, brand.tagline].filter(Boolean).join(' — ')
      document.title = headTitle || 'FoodExpress'

      // Favicon
      const faviconUrl = brandFaviconUrl(brand)
      const existingFavicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (existingFavicon) {
        existingFavicon.href = faviconUrl
      } else {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.type = 'image/png'
        link.href = faviconUrl
        document.head.appendChild(link)
      }

      // Apple touch icon
      let appleTouch = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
      if (!appleTouch) {
        appleTouch = document.createElement('link')
        appleTouch.rel = 'apple-touch-icon'
        document.head.appendChild(appleTouch)
      }
      appleTouch.href = faviconUrl

      // Open Graph / Twitter image
      let og = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
      if (!og) {
        og = document.createElement('meta')
        og.setAttribute('property', 'og:image')
        document.head.appendChild(og)
      }
      og.content = faviconUrl

      let tw = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')
      if (!tw) {
        tw = document.createElement('meta')
        tw.setAttribute('name', 'twitter:image')
        document.head.appendChild(tw)
      }
      tw.content = faviconUrl

      // Dynamic pink accent on <html>
      document.documentElement.style.setProperty('--fe-primary', brand.primaryColor || '#D70F64')
      document.documentElement.style.setProperty('--fe-accent', brand.accentColor || '#FF2B85')
      document.documentElement.style.setProperty('--fe-theme', brand.primaryColor || '#D70F64')

      // Theme color
      let theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (!theme) {
        theme = document.createElement('meta')
        theme.setAttribute('name', 'theme-color')
        document.head.appendChild(theme)
      }
      theme.content = brand.primaryColor || '#D70F64'
    }

    apply()
  }, [brand, ready])
}

/**
 * Logo image props helper used by navbar, footer, admin header, and storefront.
 * Resolves to the uploaded logo or the bundled FoodExpress artwork.
 */
export function FoodExpressLogoProps(brand: AppSetting, opts?: { size?: number; alt?: string }) {
  const size = opts?.size ?? 36
  const alt = opts?.alt ?? `${brand.siteName ?? 'FoodExpress'} logo`
  return {
    src: brandLogoUrl(brand),
    alt,
    width: size,
    height: size,
    className:
      'inline-block rounded-full bg-white p-0.5 shadow-sm ' +
      (size >= 48 ? 'object-contain' : 'object-cover'),
  }
}

/** Big hero logo for the storefront hero / admin landing. */
export function FoodExpressHeroLogoProps(brand: AppSetting) {
  return {
    src: brandLogoUrl(brand),
    alt: `${brand.siteName ?? 'FoodExpress'} — Fast • Fresh • For You`,
    className: 'h-auto w-auto max-w-[220px] object-contain',
  }
}

/** Short text brand name for places without an image logo. */
export function FoodExpressNameLabel(brand: AppSetting) {
  return brand.siteName || 'FoodExpress'
}
