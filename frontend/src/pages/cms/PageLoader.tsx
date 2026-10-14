import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { useBrand } from '../../lib/brand'
import { fetchPageBySlug } from '../../lib/api'
import { PageRenderer } from './PageRenderer'
import { Skeleton } from '../../components/ui/Skeleton'
import { FoodExpressLogo } from '../../components/ui/Logo'

export function PageLoader({ hasLayout = true }: { hasLayout?: boolean }) {
  const { slug } = useParams<{ slug: string }>()
  const { brand } = useBrand()
  const navigate = useNavigate()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (!slug) {
      setLoading(false)
      return
    }
    fetchPageBySlug(slug)
      .then((p) => {
        setPage(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  usePageTitle(slug ?? '', page?.seoDescription)

  if (!slug) {
    navigate('/')
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <FoodExpressLogo brand={brand} size={48} className="!rounded-full !bg-white !p-1 !shadow-sm" />          <Skeleton width="280px" height={128} className="mt-5 rounded-xl" />
          <div className="flex gap-3 mt-5">
            <Skeleton width="120px" height={32} className="rounded-full" />
            <Skeleton width="140px" height={32} className="rounded-full" />
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <p className="text-[#6B7280]">This page isn’t available right now.</p>
        <button className="fe-btn fe-btn.primary mt-4" onClick={() => navigate('/')}>
          Back to home
        </button>
      </div>
    )
  }

  return <PageRenderer page={page} hasLayout={hasLayout} />
}
