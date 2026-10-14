import { useEffect } from 'react'
import { useBrand } from '../lib/brand'

export function usePageTitle(title: string, description?: string) {
  const { brand, loading } = useBrand()

  useEffect(() => {
    if (loading) return
    const headTitle = title ? `${title} — ${brand.siteName ?? 'FoodExpress'}` : brand.siteName ?? 'FoodExpress'
    document.title = headTitle
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) {
      meta.content = description ?? brand.tagline ?? ''
    }
  }, [title, description, brand.siteName, brand.tagline, brand.tagline, loading])
}
