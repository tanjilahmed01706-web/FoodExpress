import { useState, useEffect } from 'react'

import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { MapView, OSMTileLayer, PinMarker, PolygonOverlay } from '../../lib/map'
import type { Zone } from '../../types'
import 'leaflet/dist/leaflet.css'

usePageTitle('Map zones', 'Draw and manage delivery zones on the map — each with its own fee and minimum order.')

export function AdminZones() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const [form, setForm] = useState({
    name: '',
    city: 'Brahmanbaria',
    color: '#D70F64',
    deliveryFee: 40,
    minOrder: 150,
    isActive: true,
    centerLat: 23.957,
    centerLng: 90.725,
    polygon: '',
  })

  useEffect(() => {
    let cancelled = false
    fetchZones()
      .then((z) => { if (!cancelled) setZones(z.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const startEdit = (z: Zone) => {
    setEditing(z)
    setForm({
      name: z.name,
      city: z.city,
      color: z.color,
      deliveryFee: z.deliveryFee,
      minOrder: z.minOrder,
      isActive: z.isActive,
      centerLat: z.centerLat,
      centerLng: z.centerLng,
      polygon: z.polygon ? JSON.stringify(z.polygon) : '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({
      name: '', city: 'Brahmanbaria', color: '#D70F64',
      deliveryFee: 40, minOrder: 150, isActive: true,
      centerLat: 23.957, centerLng: 90.725, polygon: '',
    })
  }

  useEffect(() => { if (!showForm) resetForm() }, [showForm])

  const toggleActive = (z: Zone) => {
    const next = { ...z, isActive: !z.isActive }
    setZones((prev) => prev.map((x) => (x.documentId === z.documentId ? next : x)))
  }

  const selectedZone = zones.find((z) => z.name === form.name && z.city === form.city) ?? null

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Map zones</h2>
          <p className="text-sm text-[#6B7280]">{zones.length} zones · {zones.filter((z) => z.isActive).length} active</p>
        </div>
        <div className="admin-actions">
          <Button onClick={() => { resetForm(); setShowForm(true) }}>+ New zone</Button>
        </div>
      </div>

      <div className="admin-two-col">
        <div>
          <Card>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Delivery area</h3>
              <p className="text-xs text-[#6B7280]">OpenStreetMap · drag to focus</p>
            </div>
            <div className="admin-map-card">
              <MapView center={selectedZone ? [selectedZone.centerLat, selectedZone.centerLng] : [23.957, 90.725]} zoom={14} style={{ height: '100%', width: '100%' }} />
              <OSMTileLayer />
              {zones.map((z) => (
                <PolygonOverlay
                  key={z.documentId}
                  coordinates={(z.polygon as [number, number][] | undefined) ?? [
                    [z.centerLng - 0.008, z.centerLat - 0.008],
                    [z.centerLng + 0.008, z.centerLat - 0.008],
                    [z.centerLng + 0.008, z.centerLat + 0.008],
                    [z.centerLng - 0.008, z.centerLat + 0.008],
                  ] as [number, number][]}
                  color={z.color}
                  fillOpacity={0.15}
                  strokeWeight={2}
                />
              ))}
              {selectedZone && (
                <PinMarker position={[selectedZone.centerLat, selectedZone.centerLng]} color={selectedZone.color} label={selectedZone.name} />
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="admin-card-header">
              <h3 className="admin-card-title">Zones</h3>
            </div>
            <div className="admin-card-body">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="admin-skeleton h-10 w-full" />)}</div>
              ) : (
                <div className="space-y-2">
                  {zones.map((z) => (
                    <div
                      key={z.documentId}
                      className={`admin-zone ${selectedZone?.documentId === z.documentId ? 'border-[#D70F64]' : ''}`}
                      onClick={() => startEdit(z)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="admin-zone-color" style={{ backgroundColor: z.color }} />
                          <span className="admin-zone-name">{z.name}</span>
                        </div>
                        <p className="admin-zone-meta">{z.city} · ৳{z.deliveryFee} · ৳{z.minOrder} min</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip variant={z.isActive ? 'success' : 'outline'} size="sm">
                          {z.isActive ? 'Active' : 'Inactive'}
                        </Chip>
                        <button
                          className={`text-xs ${z.isActive ? 'text-[#6B7280]' : 'text-[#D70F64]'}`}
                          onClick={(e) => { e.stopPropagation(); toggleActive(z) }}
                        >
                          {z.isActive ? 'Off' : 'On'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {zones.length === 0 && !loading && (
                <div className="text-center py-4 text-[#6B7280]"><p className="text-sm">No zones yet.</p></div>
              )}
            </div>
          </Card>

          {showForm && (
            <Card>
              <div className="admin-card-header">
                <h3 className="admin-card-title">{editing ? 'Edit zone' : 'New zone'}</h3>
              </div>
              <div className="admin-card-body">
                <div className="admin-form">
                  <div className="admin-form-field">
                    <label className="admin-form-label">Zone name</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="City Centre" />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">City</label>
                    <Select
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      options={[
                        { value: 'Brahmanbaria', label: 'Brahmanbaria' },
                        { value: 'Comilla', label: 'Comilla' },
                        { value: 'Chouddagram', label: 'Chouddagram' },
                      ]}
                    />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Zone color</label>
                    <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="admin-form-input h-10" />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Delivery fee (৳)</label>
                    <Input type="number" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })} />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Minimum order (৳)</label>
                    <Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-check">
                      <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                      Active zone
                    </label>
                  </div>
                  <div className="admin-form-field full">
                    <label className="admin-form-label">Polygon (lat,lng pairs, newlines)</label>
                    <Input
                      value={form.polygon}
                      onChange={(e) => setForm({ ...form, polygon: e.target.value })}
                      placeholder="23.95,90.72
23.96,90.73
23.95,90.74
23.94,90.73"
                    />
                    <p className="text-xs text-[#6B7280] mt-1">Leave blank to use a simple square around the centre point.</p>
                  </div>
                </div>
                <div className="admin-actions">
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button onClick={() => { /* updateZone(adminToken, editing?.documentId ?? null, form) */ setShowForm(false) }}>
                    {editing ? 'Save zone' : 'Create zone'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

async function fetchZones() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/zones?pagination[pageSize]=50`)
  return res.json()
}


