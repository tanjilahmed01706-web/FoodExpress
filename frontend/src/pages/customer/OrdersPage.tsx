import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth, usePanelRole } from '../../lib/auth'
import { useBrand } from '../../lib/brand'
import { fetchOrdersForCurrentUser, fetchOrder } from '../../lib/api'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { FoodExpressLogo } from '../../components/ui/Logo'
import type { Order } from '../../types'

usePageTitle('My orders', 'Track your food delivery orders and see your order history.')

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-[#2B6BE1]',
  confirmed: 'bg-[#2B6BE1]',
  preparing: 'bg-[#F5A623]',
  ready: 'bg-[#F5A623]',
  picked_up: 'bg-[#F5A623]',
  on_the_way: 'bg-[#FF2B85]',
  delivered: 'bg-[#12A860]',
  cancelled: 'bg-[#E22B4A]',
}

export function OrdersPage() {
  const { token, user, loading: authLoading } = useAuth()
  const role = usePanelRole()
  const { brand } = useBrand()
  const { orderId } = useParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !user) return
    setLoading(true)
    fetchOrdersForCurrentUser(token, { sort: 'placedAt:desc', pageSize: 50 })
      .then(({ data }) => setOrders(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, user])

  useEffect(() => {
    if (!orderId || !token || !user) return
    fetchOrder(orderId, token)
      .then((o) => {
        if (o && !orders.find((x) => x.documentId === o.documentId)) {
          setOrders((prev) => [o, ...prev])
        }
      })
      .catch(() => {})
  }, [orderId, token, user, orders])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F6F8]">
        <div className="text-center">
          <Skeleton width="200px" height={40} className="rounded-full mx-auto" />
          <p className="text-sm text-[#6B7280] mt-3">Loading orders…</p>
        </div>
      </div>
    )
  }

  if (role !== 'customer') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F6F6F8]">
        <div className="text-center max-w-md">
          <span className="text-4xl block mb-3">🔒</span>
          <h2 className="text-xl font-bold text-[#111]">Orders are for customers</h2>
          <p className="text-sm text-[#6B7280] mt-2">Restaurant and rider accounts have their own order panels.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      <div className="bg-white border-b border-[#E6E6EA] px-4 md:px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <FoodExpressLogo brand={brand} size={32} />
              <span className="font-extrabold text-[#111]">{brand.siteName ?? 'FoodExpress'}</span>
            </Link>
          </div>
          <span className="text-sm text-[#6B7280]">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6">
        <h1 className="text-xl font-bold text-[#111] mb-5">Your orders</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton width="40%" height={20} />
                  <Skeleton width={80} height={20} className="rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                </div>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center">
            <span className="text-5xl block mb-3">📦</span>
            <h2 className="text-lg font-bold text-[#111]">No orders yet</h2>
            <p className="text-sm text-[#6B7280] mt-1">Your order history will appear here once you place your first order.</p>
            <Link to="/" className="fe-btn fe-btn.primary mt-5 fe-btn.sm inline-block">Start ordering</Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard key={o.documentId} order={o} expanded={expandedId === o.documentId} onToggle={() => setExpandedId(expandedId === o.documentId ? null : o.documentId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const color = STATUS_COLOR[order.status] ?? 'bg-[#6B7280]'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-[#111]">{order.orderNumber}</span>
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
          </div>
          <p className="text-xs text-[#6B7280]">
            {new Date(order.placedAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {order.restaurant?.name ?? 'Restaurant'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-[#111]">৳{order.total}</div>
          <div className="text-xs text-[#6B7280]">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card'}</div>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-[#D70F64] hover:underline shrink-0"
          onClick={onToggle}
        >
          {expanded ? 'Hide' : 'View'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={expanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#E6E6EA] space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#6B7280]">Restaurant</p>
              <p className="font-medium text-[#111]">{order.restaurant?.name}</p>
              <p className="text-xs text-[#6B7280]">{order.restaurant?.address}</p>
            </div>
            <div>
              <p className="text-[#6B7280]">Delivery address</p>
              <p className="font-medium text-[#111]">{order.deliveryAddress?.label}</p>
              <p className="text-xs text-[#6B7280]">{order.deliveryAddress?.line}</p>
              {order.deliveryAddress?.note && <p className="text-xs text-[#6B7280] mt-1">Note: {order.deliveryAddress.note}</p>}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] mb-1">Items</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-[#111]">{item.qty}× {item.name}</span>
                  <span className="text-[#111] font-medium">৳{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-sm text-[#6B7280]">
            <span>Subtotal</span>
            <span>৳{order.subtotal}</span>
          </div>
          {order.discount ? <div className="flex justify-between text-sm text-[#12A860]"><span>Discount</span><span>-৳{order.discount}</span></div> : null}
          <div className="flex justify-between text-sm text-[#6B7280]">
            <span>Delivery fee</span>
            <span>৳{order.deliveryFee}</span>
          </div>
          <div className="flex justify-between text-sm text-[#6B7280]">
            <span>Tax</span>
            <span>৳{order.tax}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-[#111] pt-2 border-t border-[#E6E6EA]">
            <span>Total</span>
            <span>৳{order.total}</span>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] mb-1">Status timeline</p>
            <div className="space-y-2 text-xs">
              {order.timeline?.map((t, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.status === order.status ? 'bg-[#D70F64]' : 'bg-[#C9C9CD]'}`} />
                  <div>
                    <span className="font-medium text-[#111]">{t.label}</span>
                    <span className="text-[#6B7280] block">{new Date(t.at).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.rider && (
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Assigned rider</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-7 h-7 rounded-full bg-[#FF2B85] text-white flex items-center justify-center text-xs font-bold">{order.rider.name?.[0] ?? 'R'}</span>
                <div>
                  <span className="font-medium text-[#111]">{order.rider.name}</span>
                  <span className="text-[#6B7280] mx-1">·</span>
                  <span className="text-[#6B7280]">{order.rider.phone}</span>
                </div>
                {order.rider.isAvailable && <Chip variant="outline" size="sm">Available</Chip>}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
