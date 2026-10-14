import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import type { MenuCategory } from '../../types'

usePageTitle('Menu categories', 'Manage category groups for restaurant menus — names and sort order.')

export function AdminMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantFilter, setRestaurantFilter] = useState<'all' | string>('all')

  useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((c) => { if (!cancelled) setCategories(c.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = restaurantFilter === 'all' ? categories : categories.filter((c) => c.restaurantId?.toString() === restaurantFilter)

  const updateSortOrder = (id: number, delta: number) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, sortOrder: Math.max(0, c.sortOrder + delta) } : c)))
    // In full build: updateMenuCategory(adminToken, c.documentId, { sortOrder: next })
  }

  const toggleAvailable = (c: MenuCategory) => {
    const next = { ...c, isAvailable: !c.isAvailable }
    setCategories((prev) => prev.map((x) => (x.documentId === c.documentId ? next : x)))
    // In full build: updateMenuCategory(adminToken, c.documentId, { isAvailable: next.isAvailable })
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Menu categories</h2>
          <p className="text-sm text-[#6B7280]">{categories.length} categories</p>
        </div>
        <Button onClick={() => {}}>+ Add category</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="fe-select w-48"
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
        >
          <option value="all">All restaurants</option>
          {categories.map((c) => (c.restaurant?.name ? <option key={c.restaurantId} value={String(c.restaurantId)}>{c.restaurant.name}</option> : null))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><div className="h-10 w-1/2 bg-gray-200 rounded animate-pulse" /></Card>)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.documentId} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#111]">{c.name}</span>
                    <Badge variant={c.isAvailable ? 'success' : 'outline'}>
                      {c.isAvailable ? 'Available' : 'Hidden'}
                    </Badge>
                    {c.restaurant && <Badge variant="outline">{c.restaurant.name}</Badge>}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">Sort order: {c.sortOrder}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#6B7280]" onClick={() => updateSortOrder(c.id, -1)}>▲</button>
                  <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#D70F64]" onClick={() => toggleAvailable(c)}>
                    {c.isAvailable ? 'Hide' : 'Show'}
                  </button>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]"><p className="text-lg">No menu categories yet.</p></div>
      )}
    </div>
  )
}

async function fetchCategories() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/menu-categories?populate=restaurant&sort=sortOrder&pagination[pageSize]=100`)
  return res.json()
}
