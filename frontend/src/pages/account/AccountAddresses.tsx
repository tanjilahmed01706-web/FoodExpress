import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { fetchAddressesForCurrentUser, createAddress as createAddressApi, updateAddress as updateAddressApi, deleteAddress as deleteAddressApi } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Badge'
import Toast from '../../components/ui/Toast'

usePageTitle('My addresses', 'Manage your saved delivery addresses.')

export function AccountAddresses() {
  const { token, user } = useAuth()
  
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState({ label: '', line: '', note: '', isDefault: false })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const toastMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500)
  }

  useEffect(() => {
    if (!token || !user) return
    let cancelled = false
    fetchAddressesForCurrentUser(token)
      .then(({ data }) => { if (!cancelled) setAddresses(data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token, user])

  const startEdit = (a: Address) => {
    setEditing(a)
    setForm({ label: a.label, line: a.line, note: a.note ?? '', isDefault: a.isDefault })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ label: '', line: '', note: '', isDefault: false })
    setShowForm(false)
  }

  const save = async () => {
    if (!token || !form.label.trim() || !form.line.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateAddressApi(token, editing.documentId, form)
        toastMsg('Address updated')
      } else {
        await createAddressApi(token, { ...form, isDefault: addresses.filter((a) => a.isDefault).length === 0 && !editing ? true : form.isDefault })
        toastMsg('Address saved')
      }
      resetForm()
      // refresh
      const { data } = await fetchAddressesForCurrentUser(token)
      setAddresses(data ?? [])
    } catch (err: any) {
      toastMsg(err?.message || 'Could not save address', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (a: Address) => {
    if (!token) return
    if (!confirm(`Remove "${a.label}"?`)) return
    try {
      await deleteAddressApi(token, a.documentId)
      setAddresses((prev) => prev.filter((x) => x.documentId !== a.documentId))
      toastMsg('Address removed')
    } catch (err: any) {
      toastMsg(err?.message || 'Could not delete address', 'error')
    }
  }

  const toggleDefault = async (a: Address) => {
    if (!token) return
    try {
      // Unset other defaults first
      const others = addresses.filter((x) => x.isDefault && x.documentId !== a.documentId)
      for (const o of others) {
        await updateAddressApi(token, o.documentId, { isDefault: false })
      }
      await updateAddressApi(token, a.documentId, { isDefault: !a.isDefault })
      toastMsg(`${a.isDefault ? 'Default changed' : `"${a.label}" set as default`}`)
      const { data } = await fetchAddressesForCurrentUser(token)
      setAddresses(data ?? [])
    } catch (err: any) {
      toastMsg(err?.message || 'Could not update default', 'error')
    }
  }

  const renderForm = () => (
    <Card className="p-5">
      <h3 className="font-bold text-base text-[#111] mb-4">{editing ? 'Edit address' : 'Add address'}</h3>
      <div className="space-y-4">
        <div>
          <p className="fe-label mb-1">Label</p>
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office…"
            disabled={saving} />
        </div>
        <div>
          <p className="fe-label mb-1">Address</p>
          <Input value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} placeholder="House no, road, area…"
            disabled={saving} />
        </div>
        <div>
          <p className="fe-label mb-1">Note (optional)</p>
          <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Gate code, call on arrival…"
            rows={2} disabled={saving} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#6B7280]">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-gray-300" disabled={saving} />
          Set as default address
        </label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={resetForm} disabled={saving}>Cancel</Button>
        <Button onClick={save} loading={saving} disabled={!form.label.trim() || !form.line.trim()}>
          {editing ? 'Save changes' : 'Add address'}
        </Button>
      </div>
    </Card>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#111]">My addresses</h1>
          <p className="text-sm text-[#6B7280]">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>+ Add address</Button>
      </div>

      {showForm && renderForm()}

      <div className="mt-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="h-5 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mt-2" />
            </Card>
          ))
        ) : addresses.length === 0 ? (
          <Card className="p-10 text-center">
            <span className="text-5xl block mb-3">📍</span>
            <h2 className="text-lg font-bold text-[#111]">No saved addresses yet</h2>
            <p className="text-sm text-[#6B7280] mt-1">Add a delivery address to checkout faster.</p>
            <Button onClick={() => { resetForm(); setShowForm(true) }} className="mt-4 fe-btn.primary fe-btn.sm">Add your first address</Button>
          </Card>
        ) : (
          addresses.map((a) => (
            <Card key={a.documentId} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-[#111]">{a.label}</h3>
                    {a.isDefault && <Chip variant="primary" size="sm">Default</Chip>}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-0.5">{a.line}</p>
                  {a.note && <p className="text-xs text-[#6B7280] mt-1">Note: {a.note}</p>}
                  <div className="text-xs text-[#6B7280] mt-1">
                    {a.lat != null && a.lng != null ? (
                      <>📍 {a.lat.toFixed(5)}, {a.lng.toFixed(5)}</>
                    ) : (
                      <>📍 No map location</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className={`fe-btn fe-btn.ghost fe-btn.sm ${a.isDefault ? 'text-[#D70F64] font-medium' : 'text-[#6B7280]'}`}
                    onClick={() => toggleDefault(a)}
                    title={a.isDefault ? 'Change default' : 'Set as default'}
                  >
                    {a.isDefault ? '✓ Default' : 'Set default'}
                  </button>
                  <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#6B7280] hover:text-[#D70F64]" onClick={() => startEdit(a)}>
                    Edit
                  </button>
                  <button className="fe-btn fe-btn.ghost fe-btn.sm text-[#6B7280] hover:text-[#E22B4A]" onClick={() => remove(a)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showForm && <div className="mt-6 text-center">
        <Link to="/checkout" className="fe-btn fe-btn.primary fe-btn.sm">Continue to checkout</Link>
      </div>}

      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </div>
  )
}

type Address = {
  id: number
  documentId: string
  label: string
  line: string
  note?: string
  lat: number | null
  lng: number | null
  isDefault: boolean
}
