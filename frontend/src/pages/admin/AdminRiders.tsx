import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import type { Rider } from '../../types'

usePageTitle('Riders', 'Manage delivery partners — availability, approval, earnings, performance.')

export function AdminRiders() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable' | 'approved'>('all')

  useEffect(() => {
    let cancelled = false
    fetchRiders()
      .then((r) => { if (!cancelled) setRiders(r.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = riders.filter((r) => {
    if (filter === 'available') return r.isAvailable
    if (filter === 'unavailable') return !r.isAvailable
    if (filter === 'approved') return r.isApproved
    return true
  })

  const toggleAvailable = (r: Rider) => {
    const next = { ...r, isAvailable: !r.isAvailable }
    setRiders((prev) => prev.map((x) => (x.documentId === r.documentId ? next : x)))
  }

  const toggleApproved = (r: Rider) => {
    const next = { ...r, isApproved: !r.isApproved }
    setRiders((prev) => prev.map((x) => (x.documentId === r.documentId ? next : x)))
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Riders</h2>
          <p className="text-sm text-[#6B7280]">{riders.length} riders · {riders.filter((r) => !r.isApproved).length} pending approval</p>
        </div>
        <div className="admin-actions">
          <Button onClick={() => {}}>+ Add rider</Button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-field">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            options={[
              { value: 'all', label: 'All riders' },
              { value: 'available', label: 'Available' },
              { value: 'unavailable', label: 'Off duty' },
              { value: 'approved', label: 'Approved' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i} className="p-4"><div className="h-20 bg-gray-200 rounded-xl animate-pulse" /></Card>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card key={r.documentId} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FF2B85] text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {r.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#111]">{r.name}</h3>
                    <Chip variant={r.isApproved ? 'success' : 'outline'} size="sm">
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </Chip>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {r.vehicleType === 'motorbike' ? '🛵 Motorbike' : r.vehicleType === 'bicycle' ? '🚲 Bicycle' : '🚗 Car'}
                  </p>
                  <p className="text-xs text-[#6B7280]">{r.phone ?? 'No phone'}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#6B7280]">Rating</span>
                  <p className="font-medium text-[#111]">{r.rating} ({r.ratingCount})</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Deliveries</span>
                  <p className="font-medium text-[#111]">{r.totalDeliveries}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Earnings</span>
                  <p className="font-medium text-[#111]">৳{r.totalEarnings}</p>
                </div>
                <div>
                  <span className="text-[#6B7280]">Status</span>
                  <p className={`font-medium ${r.isAvailable ? 'text-[#12A860]' : 'text-[#E22B4A]'}`}>
                    {r.isAvailable ? 'Available' : 'Off duty'}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  className={`fe-btn fe-btn.ghost fe-btn.sm ${r.isAvailable ? 'text-[#6B7280]' : 'text-[#D70F64]'}`}
                  onClick={() => toggleAvailable(r)}
                >
                  {r.isAvailable ? '⏸ Mark off' : '▶ Mark available'}
                </button>
                <button
                  className={`fe-btn fe-btn.ghost fe-btn.sm ${r.isApproved ? 'text-[#6B7280]' : 'text-[#D70F64]'}`}
                  onClick={() => toggleApproved(r)}
                >
                  {r.isApproved ? '✓ Revoke' : '✓ Approve'}
                </button>
                <Button variant="ghost" size="sm" className="ml-auto">Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]">
          <p className="text-lg">No riders found</p>
        </div>
      )}
    </div>
  )
}

async function fetchRiders() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/riders?sort=name:asc&pagination[pageSize]=50`)
  return res.json()
}
