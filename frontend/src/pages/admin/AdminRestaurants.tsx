import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { mediaUrl } from '../../lib/api'
import type { Restaurant } from '../../types'

usePageTitle('Restaurants', 'Manage restaurant partners — approval, featuring, details, menu management.')

export function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all')
  useEffect(() => {
    let cancelled = false
    fetchRestaurants()
      .then((rs) => { if (!cancelled) setRestaurants(rs.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = restaurants.filter((r) => {
    if (!search.trim()) return true
    return r.name.toLowerCase().includes(search.toLowerCase()) || r.address.toLowerCase().includes(search.toLowerCase())
  }).filter((r) => {
    if (statusFilter === 'pending') return !r.isApproved
    if (statusFilter === 'approved') return r.isApproved
    if (statusFilter === 'featured') return r.isFeatured
    return true
  })

  const toggleFeatured = (r: Restaurant) => {
    const next = { ...r, isFeatured: !r.isFeatured }
    setRestaurants((prev) => prev.map((x) => (x.documentId === r.documentId ? next : x)))
  }

  const toggleApproved = (r: Restaurant) => {
    const next = { ...r, isApproved: !r.isApproved }
    setRestaurants((prev) => prev.map((x) => (x.documentId === r.documentId ? next : x)))
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Restaurant partners</h2>
          <p className="text-sm text-[#6B7280]">{restaurants.length} restaurants · {restaurants.filter((r) => !r.isApproved).length} pending approval</p>
        </div>
        <div className="admin-actions">
          <Button onClick={() => {}}>+ Add restaurant</Button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-field">
          <Input
            placeholder="Search restaurants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-filter-input"
          />
        </div>
        <div className="admin-filter-field">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'featured', label: 'Featured' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i} className="p-4"><div className="h-5 w-1/3 bg-gray-200 rounded mb-2 animate-pulse" /><div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" /></Card>)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.documentId} className="p-4">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl bg-[#F6F6F8] flex items-center justify-center text-2xl overflow-hidden shrink-0">
                  {r.logo ? <img src={mediaUrl(r.logo)} alt={r.name} className="max-w-full max-h-full object-contain" /> : <span className="opacity-30">🍽</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-[#111]">{r.name}</h3>
                    <Chip variant={r.isApproved ? 'success' : 'outline'} size="sm">
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </Chip>
                    {r.isFeatured && <Chip variant="primary" size="sm">Featured</Chip>}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-0.5 truncate">{r.tagline} — {r.address}, {r.city}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7280]">
                    <span>🍳 {r.cuisines?.map((c) => c.name).join(', ') ?? 'No cuisines'}</span>
                    <span>⏱ {r.deliveryTimeMin}–{r.deliveryTimeMax} min</span>
                    <span>💰 ৳{r.deliveryFee} delivery · ৳{r.minOrder} min</span>
                    <span>⭐ {r.rating} ({r.ratingCount})</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className={`fe-btn fe-btn.ghost fe-btn.sm ${r.isFeatured ? 'text-[#D70F64]' : 'text-[#6B7280]'}`}
                    onClick={() => toggleFeatured(r)}
                  >
                    {r.isFeatured ? '⭐ Unfeature' : '⭐ Feature'}
                  </button>
                  <button
                    className={`fe-btn fe-btn.ghost fe-btn.sm ${r.isApproved ? 'text-[#6B7280]' : 'text-[#D70F64] font-medium'}`}
                    onClick={() => toggleApproved(r)}
                  >
                    {r.isApproved ? '✓ Revoke' : '✓ Approve'}
                  </button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]">
          <p className="text-lg">No restaurants found</p>
        </div>
      )}
    </div>
  )
}

async function fetchRestaurants() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/restaurants?populate=logo,cover,cuisines,owner,zone&sort=name:asc&pagination[pageSize]=50`)
  return res.json()
}
