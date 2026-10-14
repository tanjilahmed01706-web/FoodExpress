import { useState, useEffect } from 'react'
import { usePageTitle } from '../../hooks/useBrandedTitle'
import { Card } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Input'
import type { Order } from '../../types'
import { ORDER_STATUS, type OrderStatus } from '../../config'

usePageTitle('Orders', 'View and manage all orders — status, cancellations, and order details.')

const STATUS_FILTER = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'on_the_way', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOrders()
      .then((o) => { if (!cancelled) setOrders(o.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = orders.filter((o) => statusFilter === 'all' || o.status === statusFilter)

  const changeStatus = (order: Order, nextStatus: OrderStatus) => {
    const next = { ...order, status: nextStatus }
    setOrders((prev) => prev.map((x) => (x.documentId === order.documentId ? next : x)))
    if (selectedOrder?.documentId === order.documentId) {
      setSelectedOrder(next)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111]">Orders</h2>
          <p className="text-sm text-[#6B7280]">{orders.length} orders total</p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-field">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_FILTER}
          />
        </div>
      </div>

      <div className="admin-two-col">
        <Card className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Orders</h3>
          </div>
          <div className="admin-card-body">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="admin-skeleton h-14 w-full" />)}</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((o) => (
                  <div
                    key={o.documentId}
                    className={`admin-ticket ${selectedOrder?.documentId === o.documentId ? 'border-[#D70F64]' : ''}`}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111]">{o.orderNumber}</span>
                          <Chip variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'primary' : 'outline'} size="sm">
                            {o.status.replace('_', ' ')}
                          </Chip>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {o.restaurant?.name} · {new Date(o.placedAt).toLocaleString('en-BD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-[#111]">৳{o.total}</p>
                        <p className="text-xs text-[#6B7280]">{o.paymentMethod === 'cod' ? 'COD' : 'Card'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Order detail</h3>
          </div>
          <div className="admin-card-body">
            {selectedOrder ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base text-[#111]">{selectedOrder.orderNumber}</h3>
                  <Chip variant={selectedOrder.status === 'delivered' ? 'success' : selectedOrder.status === 'cancelled' ? 'primary' : 'outline'} size="sm">
                    {selectedOrder.status.replace('_', ' ')}
                  </Chip>
                </div>

                <p className="text-sm text-[#6B7280]">{selectedOrder.restaurant?.name}</p>
                <p className="text-xs text-[#6B7280]">{selectedOrder.deliveryAddress?.line}</p>

                <div className="mt-3 space-y-2 text-sm">
                  {selectedOrder.items.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between">
                      <span className="text-[#111] truncate">{item.qty}× {item.name}</span>
                      <span className="font-medium text-[#111] ml-2">৳{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[#E6E6EA] space-y-1 text-sm text-[#6B7280]">
                  <div className="flex justify-between"><span>Subtotal</span><span>৳{selectedOrder.subtotal}</span></div>
                  {selectedOrder.discount ? <div className="flex justify-between text-[#12A860]"><span>Discount</span><span>-৳{selectedOrder.discount}</span></div> : null}
                  <div className="flex justify-between"><span>Delivery fee</span><span>৳{selectedOrder.deliveryFee}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>৳{selectedOrder.tax}</span></div>
                  {selectedOrder.couponCode && <div className="flex justify-between text-[#6B7280]"><span>Coupon</span><span className="text-[#D70F64]">{selectedOrder.couponCode}</span></div>}
                  <div className="flex justify-between font-bold text-[#111] pt-1 border-t border-[#E6E6EA] text-base"><span>Total</span><span>৳{selectedOrder.total}</span></div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[#6B7280] mb-1.5">Update status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ORDER_STATUS.slice(0, 6).map((s) => (
                      <button
                        key={s.value}
                        className={`fe-btn fe-btn.sm ${selectedOrder.status === s.value ? 'border-[#D70F64] bg-[#F2EEFF] text-[#D70F64] font-bold' : 'border-[#E6E6EA] text-[#6B7280] hover:border-[#C9C9CD]'}`}
                        onClick={() => changeStatus(selectedOrder, s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrder.rider && (
                  <div className="mt-3 pt-3 border-t border-[#E6E6EA]">
                    <p className="text-xs text-[#6B7280] mb-1">Assigned rider</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-7 h-7 rounded-full bg-[#FF2B85] text-white flex items-center justify-center text-xs font-bold">{selectedOrder.rider.name?.[0] ?? 'R'}</span>
                      <div>
                        <span className="font-medium text-[#111]">{selectedOrder.rider.name}</span>
                        <span className="text-[#6B7280] mx-1">·</span>
                        <span className="text-[#6B7280] text-xs">{selectedOrder.rider.phone}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-[#6B7280]">
                <p className="text-base">Select an order to view details</p>
                <p className="text-sm mt-1">Click any order from the list.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

async function fetchOrders() {
  const res = await fetch(`${import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337'}/api/orders?sort=placedAt:desc&pagination[pageSize]=100`)
  return res.json()
}
