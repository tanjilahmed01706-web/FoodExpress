import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Cuisine } from '../../types'

usePageTitle('Cuisines', 'Manage cuisine categories — names, icons, images, sort order.')

export function AdminCuisines() {
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Cuisine | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    icon: '',
    description: '',
    sortOrder: 0,
  })

  useEffect(() => {
    let cancelled = false
    fetchCuisines()
      .then((c) => { if (!cancelled) setCuisines(c.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const resetForm = () => {
    setEditing(null)
    setForm({ name: '', slug: '', icon: '', description: '', sortOrder: cuisines.length })
  }

  useEffect(() => { if (!showForm) resetForm() }, [showForm])

  const updateSortOrder = (id: number, delta: number) => {
    setCuisines((prev) => prev.map((c) => (c.id === id ? { ...c, sortOrder: Math.max(0, c.sortOrder + delta) } : c)))
    // In full build: updateCuisine(adminToken, c.documentId, { sortOrder: next })
  }

  const emojis = ['🍜', '🍕', '🍔', '🦐', '🍰', '☕', '🥗', '🌶️', '🍛', '🥟']

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Cuisines</h2>
          <p className="text-sm text-[#6B7280]">{cuisines.length} cuisines</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>+ Add cuisine</Button>
      </div>

      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base text-[#111] mb-4">{editing ? 'Edit cuisine' : 'New cuisine'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="fe-label mb-1">Name</p>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bengali" />
            </div>
            <div>
              <p className="fe-label mb-1">Slug</p>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="bengali" />
            </div>
            <div>
              <p className="fe-label mb-1">Icon (emoji)</p>
              <Select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                options={emojis.map((e) => ({ value: e, label: e }))}
              />
            </div>
            <div>
              <p className="fe-label mb-1">Sort order</p>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <p className="fe-label mb-1">Description</p>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Traditional Bengali cuisine" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={() => { /* createOrUpdateCuisine(adminToken, editing?.documentId ?? null, form) */ setShowForm(false) }}>
              {editing ? 'Save cuisine' : 'Create cuisine'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><div className="h-20 bg-gray-200 rounded-xl animate-pulse" /></Card>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuisines.map((c) => (
            <Card key={c.documentId} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F2EEFF] flex items-center justify-center text-xl">
                  {c.icon ?? '🍽'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-[#111]">{c.name}</h3>
                    <div className="flex items-center gap-1">
                      <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#6B7280] p-1" onClick={() => updateSortOrder(c.id, -1)}>▲</button>
                      <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#D70F64] p-1" onClick={() => updateSortOrder(c.id, 1)}>▼</button>
                    </div>
                  </div>
                  {c.description && <p className="text-xs text-[#6B7280] mt-0.5 truncate">{c.description}</p>}
                  <div className="text-xs text-[#6B7280] mt-1">Slug: {c.slug} · Sort: {c.sortOrder}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cuisines.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]"><p className="text-lg">No cuisines yet.</p></div>
      )}
    </div>
  )
}

async function fetchCuisines() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/cuisines?sort=sortOrder&pagination[pageSize]=100`)
  return res.json()
}
