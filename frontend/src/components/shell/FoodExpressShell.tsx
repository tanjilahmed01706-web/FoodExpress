import { useBrand, useApplyBrand } from '../../lib/brand'
import { OfflineBanner } from '../../hooks/useOfflineIndicator'

/**
 * FoodExpress shell.
 * - Applies the Strapi-loaded brand to the document head (title, favicon, CSS vars).
 * - Renders the offline indicator globally.
 */
export function FoodExpressShell({ children }: { children: React.ReactNode }) {
  const { brand, loading } = useBrand()
  useApplyBrand(brand, !loading)

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  )
}
