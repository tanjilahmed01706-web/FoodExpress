import { useBrand } from '../../lib/brand'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { FoodExpressLogo } from '../../components/ui/Logo'

usePageTitle('Dashboard', 'Overview of orders, restaurants, riders, revenue and delivery performance across Brahmanbaria.')

const STATS = [
  { label: 'Orders this week', value: '1,248', delta: '+12%', up: true, color: 'var(--fe-primary)' },
  { label: 'Revenue this month', value: '৳1,84,260', delta: '+8.4%', up: true, color: 'var(--fe-accent)' },
  { label: 'Active restaurants', value: '24', delta: '+2', up: true, color: 'var(--fe-success)' },
  { label: 'Active riders', value: '18', delta: '−1', up: false, color: 'var(--fe-warning)' },
  { label: 'Avg delivery', value: '31 min', delta: '−2 min', up: true, color: 'var(--fe-info)' },
]

const STATUS_BREAKDOWN = [
  { status: 'delivered', label: 'Delivered', count: 842, color: 'var(--fe-success)' },
  { status: 'on_the_way', label: 'On the way', count: 124, color: 'var(--fe-accent)' },
  { status: 'preparing', label: 'Preparing', count: 68, color: 'var(--fe-warning)' },
  { status: 'confirmed', label: 'Confirmed', count: 41, color: 'var(--fe-info)' },
  { status: 'pending', label: 'Pending', count: 23, color: 'var(--fe-subtext)' },
  { status: 'cancelled', label: 'Cancelled', count: 12, color: 'var(--fe-danger)' },
]

const TOP_RESTAURANTS = [
  { name: 'Nanna Biriyani House', orders: 324, revenue: '৳41,320', rating: 4.8 },
  { name: 'Brahmanbaria Kebab Point', orders: 218, revenue: '৳28,760', rating: 4.6 },
  { name: 'City Chinese Resto', orders: 196, revenue: '৳25,480', rating: 4.5 },
  { name: 'Pitha & Tealovers', orders: 163, revenue: '৳20,150', rating: 4.9 },
  { name: 'Royal Bakery & Cafe', orders: 142, revenue: '৳17,750', rating: 4.4 },
]

const RECENT_ORDERS = [
  { orderNumber: 'FX-1024', restaurant: 'Nanna Biriyani House', total: '৳650', status: 'delivered', at: '2 min ago' },
  { orderNumber: 'FX-1023', restaurant: 'City Chinese Resto', total: '৳420', status: 'on_the_way', at: '8 min ago' },
  { orderNumber: 'FX-1022', restaurant: 'Brahmanbaria Kebab Point', total: '৳840', status: 'preparing', at: '15 min ago' },
  { orderNumber: 'FX-1021', restaurant: 'Pitha & Tealovers', total: '৳320', status: 'confirmed', at: '22 min ago' },
  { orderNumber: 'FX-1020', restaurant: 'Royal Bakery & Cafe', total: '৳180', status: 'pending', at: '31 min ago' },
]

const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-[#12A860]',
  on_the_way: 'bg-[#FF2B85]',
  preparing: 'bg-[#FFA400]',
  confirmed: 'bg-[#2B6BE1]',
  pending: 'bg-[#6B7280]',
  cancelled: 'bg-[#E22B4A]',
}

export function AdminDashboard() {
  const { brand } = useBrand()

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Good morning, admin.</h2>
          <p className="admin-section-sub">Here's what's happening across FoodExpress today.</p>
        </div>
        <FoodExpressLogo brand={brand} size={42} />
      </div>

      <div className="admin-stats-grid">
        {STATS.map((s) => (
          <Card key={s.label} className="admin-stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="admin-stat-label">{s.label}</p>
                <p className="admin-stat-value">{s.value}</p>
              </div>
              <div className={`admin-stat-icon ${s.up ? 'up' : 'down'}`}>
                {s.up ? '📈' : '📉'}
              </div>
            </div>
            <div className={`admin-stat-delta ${s.up ? 'up' : 'down'}`}>
              <span>{s.delta}</span>
              <span>vs last period</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="admin-two-col">
        <Card className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent orders</h3>
            <a href="/admin/orders" className="fe-btn fe-btn.ghost fe-btn.sm">View all</a>
          </div>
          <div className="admin-card-body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Restaurant</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((o) => (
                  <tr key={o.orderNumber}>
                    <td className="font-medium">{o.orderNumber}</td>
                    <td>{o.restaurant}</td>
                    <td className="font-medium">{o.total}</td>
                    <td>
                      <span className="admin-status">
                        <span className="admin-status-dot" style={{ backgroundColor: STATUS_COLORS[o.status] }} />
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-[#6B7280]">{o.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Top restaurants</h3>
            <a href="/admin/restaurants" className="fe-btn fe-btn.ghost fe-btn.sm">Manage</a>
          </div>
          <div className="admin-card-body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {TOP_RESTAURANTS.map((r, i) => (
                  <tr key={r.name}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="admin-avatar primary" style={{ width: 26, height: 26, fontSize: 11 }}>{i + 1}</span>
                        <span>{r.name}</span>
                      </div>
                    </td>
                    <td>{r.orders}</td>
                    <td className="font-medium">{r.revenue}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--fe-primary)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {r.rating}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Order status breakdown</h3>
        </div>
        <div className="admin-card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUS_BREAKDOWN.map((s) => (
              <div key={s.status} className="text-center">
                <div className="admin-status inline-flex mb-2">
                  <span className="admin-status-dot" style={{ backgroundColor: s.color }} />
                  {s.label}
                </div>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs text-[#6B7280]">orders</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
