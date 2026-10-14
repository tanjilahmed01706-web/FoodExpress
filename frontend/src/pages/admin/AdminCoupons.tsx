import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Coupon } from '../../types'

usePageTitle('Coupons', 'Create, edit, and manage discount coupons for customers and restaurants.')

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)

  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 10,
    minOrder: 0,
    maxDiscount: 500,
    expiryDate: '',
    usageLimit: 100,
    isActive: true,
  })

  useEffect(() => {
    let cancelled = false
    fetchCoupons()
      .then((c) => { if (!cancelled) setCoupons(c.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const startEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      title: c.title ?? '',
      description: c.description ?? '',
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount ?? 500,
      expiryDate: c.expiryDate ?? '',
      usageLimit: c.usageLimit,
      isActive: c.isActive,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      code: '', title: '', description: '',
      type: 'percent', value: 10, minOrder: 0,
      maxDiscount: 500, expiryDate: '', usageLimit: 100,
      isActive: true,
    })
  }

  useEffect(() => { if (!showForm) resetForm() }, [showForm])

  const toggleActive = (c: Coupon) => {
    const next = { ...c, isActive: !c.isActive }
    setCoupons((prev) => prev.map((x) => (x.documentId === c.documentId ? next : x)))
    // In a full build: call createOrUpdateCoupon(adminToken, c.documentId, { isActive: next.isActive })
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Coupons</h2>
          <p className="admin-section-sub">{coupons.length} coupons · {coupons.filter((c) => c.isActive).length} active</p>
        </div>
        <div className="admin-actions">
          <Button onClick={() => { resetForm(); setShowForm(true) }}>+ New coupon</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><div className="h-10 w-1/2 bg-gray-200 rounded animate-pulse" /></Card>)}</div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <Card key={c.documentId} className="admin-coupon">
              <div className="admin-coupon-top">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="admin-coupon-code">{c.code}</span>
                    <Chip variant={c.isActive ? 'success' : 'outline'} size="sm">
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Chip>
                    {c.type === 'percent' ? <Chip variant="primary" size="sm">{c.value}%</Chip> : <Chip variant="primary" size="sm">৳{c.value}</Chip>}
                  </div>
                  {(c.title || c.description) && (
                    <p className="admin-coupon-meta">{c.title} — {c.description}</p>
                  )}
                  <div className="admin-coupon-stats">
                    <span>Min order: ৳{c.minOrder}</span>
                    {c.maxDiscount ? <span>Max discount: ৳{c.maxDiscount}</span> : null}
                    <span>Uses: {c.usedCount}/{c.usageLimit}</span>
                    {c.expiryDate ? <span>Expires: {new Date(c.expiryDate).toLocaleDateString('en-BD')}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`fe-btn fe-btn.ghost fe-btn.sm ${c.isActive ? 'text-[#6B7280]' : 'text-[#D70F64]'}`}
                    onClick={() => toggleActive(c)}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>Edit</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {coupons.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]"><p className="text-lg">No coupons yet.</p></div>
      )}

      {/* Create / edit form */}
      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base text-[#111] mb-4">{editing ? 'Edit coupon' : 'New coupon'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="fe-label mb-1">Coupon code</p>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
            </div>
            <div>
              <p className="fe-label mb-1">Title</p>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Welcome discount" />
            </div>
            <div>
              <p className="fe-label mb-1">Type</p>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} options={[{ value: 'percent', label: 'Percent' }, { value: 'fixed', label: 'Fixed amount' }]} />
            </div>
            <div>
              <p className="fe-label mb-1">{form.type === 'percent' ? 'Discount %' : 'Amount (৳)'}</p>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            </div>
            <div>
              <p className="fe-label mb-1">Minimum order (৳)</p>
              <Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
            </div>
            <div>
              <p className="fe-label mb-1">Max discount (৳)</p>
              <Input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} placeholder="No limit" />
            </div>
            <div>
              <p className="fe-label mb-1">Usage limit</p>
              <Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} />
            </div>
            <div>
              <p className="fe-label mb-1">Expiry date</p>
              <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <p className="fe-label mb-1">Description</p>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="For new customers" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
                Active
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={() => { /* createOrUpdateCoupon(adminToken, editing?.documentId ?? null, form) */ setShowForm(false) }}>
              {editing ? 'Save changes' : 'Create coupon'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

async function fetchCoupons() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/coupons?pagination[pageSize]=100`)
  return res.json()
}
