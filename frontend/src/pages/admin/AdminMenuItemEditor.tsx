import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Badge, Chip } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { mediaUrl } from '../../lib/api'
import { useMediaUpload } from '../../hooks/useMediaUpload'
import type { MenuItem, MenuCategory } from '../../types'

usePageTitle('Menu items', 'Create and edit menu items — price, description, image, availability, taggings.')

interface Props {
  categoryId?: string
}

export function AdminMenuItemEditor({ categoryId }: Props) {
  const { uploadMedia } = useMediaUpload()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MenuItem | null>(null)

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 100,
    comparePrice: 0,
    prepTime: 15,
    isVegetarian: false,
    isSpicy: false,
    isAvailable: true,
    imageId: '',
    categoryId: categoryId ?? '',
  })

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchItems(), fetchCategories()])
      .then(([its, cats]) => {
        if (!cancelled) {
          setItems(its.data ?? [])
          setCategories(cats.data ?? [])
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const resetForm = () => {
    setEditing(null)
    setForm({
      name: '', description: '', price: 100, comparePrice: 0,
      prepTime: 15, isVegetarian: false, isSpicy: false,
      isAvailable: true, imageId: '', categoryId: categoryId ?? '',
    })
  }

  const startEdit = (item: MenuItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      comparePrice: item.comparePrice ?? 0,
      prepTime: item.prepTime,
      isVegetarian: item.isVegetarian,
      isSpicy: item.isSpicy,
      isAvailable: item.isAvailable,
      imageId: item.image?.id?.toString() ?? '',
      categoryId: item.categoryId?.toString() ?? '',
    })
    setShowForm(true)
  }

  const toggleAvailable = (item: MenuItem) => {
    const next = { ...item, isAvailable: !item.isAvailable }
    setItems((prev) => prev.map((x) => (x.documentId === item.documentId ? next : x)))
    // In full build: updateMenuItem(adminToken, item.documentId, { isAvailable: next.isAvailable })
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Menu items</h2>
          <p className="text-sm text-[#6B7280]">{items.length} items</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>+ New item</Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base text-[#111] mb-4">{editing ? 'Edit item' : 'New menu item'}</h3>
          <div className="space-y-4">
            <div>
              <p className="fe-label mb-1">Item name</p>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Chicken Biriyani" />
            </div>
            <div>
              <p className="fe-label mb-1">Description</p>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Serve hot with raita and salad" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="fe-label mb-1">Price (৳)</p>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <p className="fe-label mb-1">Compare price (৳)</p>
                <Input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: Number(e.target.value) })} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="fe-label mb-1">Prep time (min)</p>
                <Input type="number" value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })} />
              </div>
              <div>
                <p className="fe-label mb-1">Category</p>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  options={[{ value: '', label: 'Select category' }, ...categories.map((c) => ({ value: c.documentId, label: c.name }))]}
                />
              </div>
            </div>
            <div>
              <p className="fe-label mb-1">Image</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#F6F6F8] flex items-center justify-center overflow-hidden border border-[#E6E6EA]">
                  {form.imageId ? (
                    <img src={`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/uploads/${form.imageId}_preview.jpg`} alt="item" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span className="text-2xl opacity-30">🍽</span>
                  )}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const uploaded = await uploadMedia(new FormData().append('file', file) as any)
                    setForm({ ...form, imageId: uploaded.id?.toString() ?? '' })
                  } catch (err) { console.error('image upload failed', err) }
                }} className="text-xs text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Upload image</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input type="checkbox" checked={form.isVegetarian} onChange={(e) => setForm({ ...form, isVegetarian: e.target.checked })} className="rounded border-gray-300" />
                Vegetarian 🌱
              </label>
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input type="checkbox" checked={form.isSpicy} onChange={(e) => setForm({ ...form, isSpicy: e.target.checked })} className="rounded border-gray-300" />
                Spicy 🌶️
              </label>
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="rounded border-gray-300" />
                Available
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={() => { /* createOrUpdateMenuItem(adminToken, editing?.documentId ?? null, form) */ setShowForm(false) }}>
              {editing ? 'Save item' : 'Create item'}
            </Button>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><div className="h-14 bg-gray-200 rounded animate-pulse" /></Card>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <Card key={item.documentId} className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#F6F6F8] flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? <img src={mediaUrl(item.image)} alt={item.name} className="max-w-full max-h-full object-contain" /> : <span className="opacity-30 text-xl">🍽</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#111]">{item.name}</span>
                    {!item.isAvailable && <Badge variant="outline" size="sm">Unavailable</Badge>}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">৳{item.price}{item.comparePrice ? ` · was ৳${item.comparePrice}` : ''}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280]">
                    {item.isVegetarian && <Chip size="sm">🌱 Veg</Chip>}
                    {item.isSpicy && <Chip size="sm">🌶️ Spicy</Chip>}
                    <span>Prep {item.prepTime} min</span>
                    {item.category?.name && <span className="text-[#999]">· {item.category.name}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#D70F64]" onClick={() => toggleAvailable(item)}>
                  {item.isAvailable ? 'Hide' : 'Show'}
                </button>
                <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {items.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]"><p className="text-lg">No menu items yet.</p></div>
      )}
    </div>
  )
}

async function fetchItems() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/menu-items?populate=category,image&sort=name:asc&pagination[pageSize]=100`)
  return res.json()
}

async function fetchCategories() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/menu-categories?sort=sortOrder&pagination[pageSize]=100`)
  return res.json()
}
