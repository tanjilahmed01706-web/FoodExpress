import { useLocation } from 'react-router-dom'

const LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/restaurants': 'Restaurants',
  '/admin/riders': 'Riders',
  '/admin/orders': 'Orders',
  '/admin/coupons': 'Coupons',
  '/admin/notifications': 'Notifications',
  '/admin/tickets': 'Support',
  '/admin/pages': 'CMS pages',
  '/admin/zones': 'Map zones',
  '/admin/settings': 'Settings',
}

export function AdminBreadcrumb() {
  const location = useLocation()
  const base = '/admin'
  const path = location.pathname
  const segment = path === base ? 'Dashboard' : LABELS[path] ?? path.split('/').pop() ?? ''
  const parent = LABELS[base] ?? 'Admin'
  return (
    <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-4">
      <span>{parent}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      <span className="text-[#111] font-medium">{segment}</span>
    </div>
  )
}
