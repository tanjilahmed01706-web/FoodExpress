import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Page } from '../../types'

usePageTitle('CMS pages', 'Manage the content pages customers see on the storefront — home, about, help, etc.')

export function AdminPages() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<Page | null>(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    isPublished: true,
    seoTitle: '',
    seoDescription: '',
  })

  useEffect(() => {
    let cancelled = false
    fetchPages()
      .then((p) => { if (!cancelled) setPages(p.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = pages.filter((p) => {
    if (statusFilter === 'published') return p.isPublished
    if (statusFilter === 'draft') return !p.isPublished
    return true
  })

  const startEdit = (p: Page) => {
    setEditing(p)
    setForm({ title: p.title, slug: p.slug, isPublished: p.isPublished, seoTitle: p.seoTitle ?? '', seoDescription: p.seoDescription ?? '' })
    setShowEditor(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ title: '', slug: '', isPublished: true, seoTitle: '', seoDescription: '' })
  }

  useEffect(() => { if (!showEditor) resetForm() }, [showEditor])

  const togglePublished = (p: Page) => {
    const next = { ...p, isPublished: !p.isPublished }
    setPages((prev) => prev.map((x) => (x.documentId === p.documentId ? next : x)))
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">CMS pages</h2>
          <p className="text-sm text-[#6B7280]">{pages.length} pages · {pages.filter((p) => p.isPublished).length} published</p>
        </div>
        <Button onClick={() => { resetForm(); setShowEditor(true) }}>+ New page</Button>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-field">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><div className="h-12 w-1/2 bg-gray-200 rounded animate-pulse" /></Card>)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.documentId} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#111]">{p.title}</span>
                    <Chip variant={p.isPublished ? 'success' : 'outline'} size="sm">
                      {p.isPublished ? 'Published' : 'Draft'}
                    </Chip>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">/{p.slug}</p>
                  {p.seoTitle && <p className="text-xs text-[#6B7280] mt-1">SEO title: {p.seoTitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`fe-btn fe-btn.ghost fe-btn.sm ${p.isPublished ? 'text-[#6B7280]' : 'text-[#D70F64]'}`}
                    onClick={() => togglePublished(p)}
                  >
                    {p.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>Edit blocks</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pages.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]"><p className="text-lg">No CMS pages yet.</p></div>
      )}

      {showEditor && (
        <Card className="p-5">
          <h3 className="font-bold text-base text-[#111] mb-4">Page editor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="fe-label mb-1">Page title</p>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Home" />
            </div>
            <div>
              <p className="fe-label mb-1">Slug</p>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="home" />
            </div>
            <div>
              <p className="fe-label mb-1">SEO title</p>
              <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="Home — FoodExpress" />
            </div>
            <div>
              <p className="fe-label mb-1">SEO description</p>
              <Input value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} placeholder="Order food from the best restaurants…" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded border-gray-300" />
                Published
              </label>
              <div className="bg-[#F6F6F8] rounded-xl border border-[#E6E6EA] p-4 text-center text-sm text-[#6B7280]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fe-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Block editor placeholder
                <p className="mt-1">Add sections: hero, banners, cuisines, featured restaurants, features, how-it-works, map, CTA, text, FAQ.</p>
                <p className="mt-2 text-xs text-[#999]">Strapi pages content-type stores the layout as JSON; the frontend renderer renders it live.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={() => { /* createOrUpdatePage(adminToken, editing?.documentId ?? null, form) */ setShowEditor(false) }}>
              {editing ? 'Save changes' : 'Create page'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

async function fetchPages() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/pages?pagination[pageSize]=50`)
  return res.json()
}
