import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Textarea, Select } from '../../components/ui/Input'
import type { Notification } from '../../types'

usePageTitle('Notifications', 'Send in-app notifications to customers, riders, or restaurants.')

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)

  const [compose, setCompose] = useState({
    title: '',
    message: '',
    link: '',
    type: 'info' as const,
    target: 'all' as 'all' | 'customers' | 'riders' | 'restaurants',
  })

  useEffect(() => {
    let cancelled = false
    fetchNotifications()
      .then((n) => { if (!cancelled) setNotifications(n.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const send = async () => {
    if (!compose.title || !compose.message) return
    const fake: Notification = {
      id: 0,
      documentId: Math.random().toString(36).slice(2),
      title: compose.title,
      message: compose.message,
      link: compose.link,
      type: compose.type,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setNotifications((prev) => [fake, ...prev])
    setCompose({ title: '', message: '', link: '', type: 'info', target: 'all' })
    setShowCompose(false)
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Notifications</h2>
          <p className="text-sm text-[#6B7280]">{notifications.length} notifications sent</p>
        </div>
        <div className="admin-actions">
          <Button onClick={() => setShowCompose(!showCompose)}>+ New notification</Button>
        </div>
      </div>

      {showCompose && (
        <div className="admin-notification-compose">
          <div>
            <div className="admin-compose-field">
              <label>Title</label>
              <Input value={compose.title} onChange={(e) => setCompose({ ...compose, title: e.target.value })} placeholder="Delivery update" />
            </div>
            <div className="admin-compose-field">
              <label>Message</label>
              <Textarea value={compose.message} onChange={(e) => setCompose({ ...compose, message: e.target.value })} placeholder="Your order is on the way!" rows={3} />
            </div>
            <div className="admin-compose-field">
              <label>Link (optional)</label>
              <Input value={compose.link} onChange={(e) => setCompose({ ...compose, link: e.target.value })} placeholder="/orders/FX-1023" />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="admin-compose-field" style={{ flex: '1 1 200px' }}>
                <label>Type</label>
                <Select
                  value={compose.type}
                  onChange={(e) => setCompose({ ...compose, type: e.target.value as any })}
                  options={[
                    { value: 'info', label: 'Info' },
                    { value: 'order', label: 'Order' },
                    { value: 'promo', label: 'Promo' },
                    { value: 'system', label: 'System' },
                  ]}
                />
              </div>
              <div className="admin-compose-field" style={{ flex: '1 1 200px' }}>
                <label>Target audience</label>
                <Select
                  value={compose.target}
                  onChange={(e) => setCompose({ ...compose, target: e.target.value as any })}
                  options={[
                    { value: 'all', label: 'All users' },
                    { value: 'customers', label: 'Customers' },
                    { value: 'riders', label: 'Riders' },
                    { value: 'restaurants', label: 'Restaurants' },
                  ]}
                />
              </div>
            </div>
          </div>
          <div className="admin-actions">
            <Button variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button onClick={send} disabled={!compose.title || !compose.message}>Send now</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Card key={i} className="p-4"><div className="h-12 bg-gray-200 rounded animate-pulse" /></Card>)}</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.documentId} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[#111]">{n.title}</span>
                    <Chip variant="outline" size="sm">{n.type}</Chip>
                    {!n.isRead && <Chip variant="primary" size="sm">New</Chip>}
                  </div>
                  {n.message && <p className="text-sm text-[#6B7280] mt-0.5">{n.message}</p>}
                  {n.link && <a href={n.link} className="text-xs text-[#D70F64] hover:underline mt-1 inline-block">View link →</a>}
                </div>
                <div className="text-xs text-[#6B7280] whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString('en-BD')}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {notifications.length === 0 && !loading && (
        <div className="text-center py-10 text-[#6B7280]"><p className="text-lg">No notifications yet.</p></div>
      )}
    </div>
  )
}

async function fetchNotifications() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/notifications?sort=createdAt:desc&pagination[pageSize]=50`)
  return res.json()
}
