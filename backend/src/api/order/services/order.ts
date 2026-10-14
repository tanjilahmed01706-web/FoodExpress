import { factories } from '@strapi/strapi';
import {
  makeOrderNumber,
  round2,
  findOwnedRestaurant,
  findRiderProfile,
} from '../../../common/access';

const ORDER_UID = 'api::order.order';

const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['picked_up'],
  picked_up: ['on_the_way'],
  on_the_way: ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Restaurant confirmed',
  preparing: 'Preparing your food',
  ready: 'Ready for pickup',
  picked_up: 'Picked up by rider',
  on_the_way: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default factories.createCoreService('api::order.order', (() => ({
  STATUS_LABELS,

  async getSettings() {
    const rows = await strapi.db.query('api::app-setting.app-setting').findMany();
    return rows[0] || {};
  },

  /**
   * Server-side authoritative price computation.
   * Prices are ALWAYS read from the database — never trusted from the client.
   */
  async computeTotals({ restaurantRow, items, couponCode }: any) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Your cart is empty');
    }
    const ids = items.map((i: any) => i.menuItemId).filter(Boolean);
    const menuRows = await strapi.db.query('api::menu-item.menu-item').findMany({
      where: { documentId: { $in: ids } },
      populate: { restaurant: true },
    });
    const byId = new Map(menuRows.map((m: any) => [m.documentId, m]));

    const orderItems: any[] = [];
    let subtotal = 0;
    for (const line of items) {
      const mi: any = byId.get(line.menuItemId);
      if (!mi) throw new Error('An item in your cart no longer exists');
      if (mi.restaurant?.documentId !== restaurantRow.documentId) {
        throw new Error('Cart items must belong to the same restaurant');
      }
      if (!mi.isAvailable) throw new Error(`${mi.name} is currently unavailable`);
      const qty = Math.max(1, Math.min(50, parseInt(String(line.qty), 10) || 1));
      const lineTotal = round2(Number(mi.price) * qty);
      subtotal += lineTotal;
      orderItems.push({
        menuItemId: mi.documentId,
        name: mi.name,
        price: Number(mi.price),
        qty,
        subtotal: lineTotal,
        note: (line.note || '').slice(0, 200),
      });
    }
    subtotal = round2(subtotal);

    const settings = await this.getSettings();

    // Coupon (validated again server-side)
    let discount = 0;
    let appliedCode: string | null = null;
    if (couponCode) {
      const coupon = await strapi.db.query('api::coupon.coupon').findOne({
        where: { code: String(couponCode).trim().toUpperCase() },
      });
      if (coupon && coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate).getTime() >= Date.now())) {
        const usageOk = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const minOk = Number(coupon.minOrder || 0) <= subtotal;
        const scopeOk = !coupon.restaurant || coupon.restaurant.id === restaurantRow.id;
        if (usageOk && minOk && scopeOk) {
          discount =
            coupon.type === 'percent' ? (subtotal * Number(coupon.value || 0)) / 100 : Number(coupon.value || 0);
          if (coupon.maxDiscount != null) discount = Math.min(discount, Number(coupon.maxDiscount));
          discount = round2(Math.min(discount, subtotal));
          appliedCode = coupon.code;
        }
      }
    }

    const taxRate = Number(settings.taxRate ?? 5);
    const tax = round2(((subtotal - discount) * taxRate) / 100);
    const threshold = Number(settings.freeDeliveryThreshold ?? 500);
    const baseDeliveryFee = Number(restaurantRow.deliveryFee ?? settings.defaultDeliveryFee ?? 40);
    const deliveryFee = subtotal >= threshold && threshold > 0 ? 0 : round2(baseDeliveryFee);
    const total = round2(subtotal - discount + tax + deliveryFee);

    return { items: orderItems, subtotal, discount, tax, deliveryFee, total, couponCode: appliedCode, taxRate };
  },

  async notifyUser(userId: number, payload: any) {
    if (!userId) return;
    try {
      await strapi.db.query('api::notification.notification').create({
        data: { user: userId, isRead: false, ...payload },
      });
    } catch (e) {
      strapi.log.warn(`notification failed: ${e}`);
    }
  },

  /** Push a timeline entry on the order. */
  timelinePush(order: any, status: string, note?: string) {
    const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
    timeline.push({ status, label: STATUS_LABELS[status] || status, at: new Date().toISOString(), note: note || '' });
    return timeline;
  },

  /**
   * Apply a status transition with all pipeline side effects.
   * Returns the updated order or throws a user-facing Error.
   */
  async changeStatus({ order, next, user, role, note }: any) {
    const allowed = TRANSITIONS[order.status] || [];
    if (!allowed.includes(next)) {
      throw new Error(`Cannot move order from "${order.status}" to "${next}"`);
    }

    const now = new Date().toISOString();
    const data: any = {
      status: next,
      timeline: this.timelinePush(order, next, note),
    };

    if (next === 'cancelled') {
      data.cancelReason = note || (role === 'customer' ? 'Cancelled by customer' : 'Cancelled by restaurant');
      if (order.paymentStatus === 'paid') data.paymentStatus = 'refunded';
      await this.notifyUser(order.customer?.id, {
        title: `Order ${order.orderNumber} cancelled`,
        message: data.cancelReason,
        type: 'order',
        link: `/orders/${order.documentId}`,
      });
      const restaurantOwner = order.restaurant?.owner;
      if (role === 'customer') {
        await this.notifyUser(restaurantOwner?.id, {
          title: `Order ${order.orderNumber} was cancelled`,
          message: data.cancelReason,
          type: 'order',
          link: '/orders',
        });
      }
    }

    if (next === 'ready') {
      await this.notifyUser(order.customer?.id, {
        title: `Order ${order.orderNumber} is ready`,
        message: 'Waiting for a rider to pick it up.',
        type: 'order',
        link: `/orders/${order.documentId}`,
      });
    }

    if (next === 'picked_up') {
      data.riderEarning = Number(order.deliveryFee || 0);
      await this.notifyUser(order.customer?.id, {
        title: `Order ${order.orderNumber} picked up`,
        message: 'Your rider is on the way to you.',
        type: 'order',
        link: `/orders/${order.documentId}`,
      });
    }

    if (next === 'delivered') {
      data.deliveredAt = now;
      data.paymentStatus = 'paid';
      await this.notifyUser(order.customer?.id, {
        title: `Order ${order.orderNumber} delivered`,
        message: 'Enjoy your meal! Please rate your experience.',
        type: 'order',
        link: `/orders/${order.documentId}`,
      });
      if (order.rider?.id) {
        await strapi.db.query('api::rider.rider').update({
          where: { id: order.rider.id },
          data: {
            totalDeliveries: Number(order.rider.totalDeliveries || 0) + 1,
            totalEarnings: round2(Number(order.rider.totalEarnings || 0) + Number(order.riderEarning || 0)),
          },
        });
      }
    }

    const updated = await strapi.db.query(ORDER_UID).update({ where: { id: order.id }, data });

    // Platform announcement for the admin panel feed
    if (next === 'delivered' || next === 'cancelled') {
      const adminUsers = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: { panelRole: 'admin' },
      });
      for (const admin of adminUsers) {
        await this.notifyUser(admin.id, {
          title: `Order ${order.orderNumber} ${next}`,
          message: `${order.restaurant?.name || 'Restaurant'} • ${order.total}`,
          type: 'system',
          link: '/orders',
        });
      }
    }
    return updated;
  },

  /** Aggregated metrics for admin / restaurant / rider / customer dashboards. */
  async statsFor({ user, scope }: any) {
    let where: any = {};
    if (scope === 'restaurant') {
      const owned = await findOwnedRestaurant(user);
      if (!owned) return { totals: { orders: 0, revenue: 0 }, byStatus: {}, series: [], recent: [] };
      where = { restaurant: { id: owned.id } };
    } else if (scope === 'rider') {
      const profile = await findRiderProfile(user);
      if (!profile) return { totals: { orders: 0, revenue: 0 }, byStatus: {}, series: [], recent: [] };
      where = { rider: { id: profile.id } };
    } else if (scope === 'customer') {
      where = { customer: { id: user.id } };
    }

    const rows = await strapi.db.query(ORDER_UID).findMany({
      where,
      populate: { restaurant: true, customer: true, rider: true },
      orderBy: { placedAt: 'desc' },
    });

    const byStatus: Record<string, number> = {};
    let revenue = 0;
    let earnings = 0;
    let delivered = 0;
    let cancelled = 0;
    const seriesMap = new Map<string, { date: string; orders: number; revenue: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      seriesMap.set(key, { date: key, orders: 0, revenue: 0 });
    }

    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      if (row.status === 'delivered') {
        delivered += 1;
        revenue += Number(row.total || 0);
        earnings += Number(row.riderEarning || 0);
      }
      if (row.status === 'cancelled') cancelled += 1;
      const placed = row.placedAt ? new Date(row.placedAt) : null;
      if (placed) {
        const key = placed.toISOString().slice(0, 10);
        const bucket = seriesMap.get(key);
        if (bucket) {
          bucket.orders += 1;
          if (row.status === 'delivered') bucket.revenue += Number(row.total || 0);
        }
      }
    }

    const active = (byStatus.pending || 0) + (byStatus.confirmed || 0) + (byStatus.preparing || 0) + (byStatus.ready || 0) + (byStatus.picked_up || 0) + (byStatus.on_the_way || 0);

    return {
      totals: {
        orders: rows.length,
        revenue: round2(revenue),
        earnings: round2(earnings),
        delivered,
        cancelled,
        active,
        avgTicket: delivered ? round2(revenue / delivered) : 0,
      },
      byStatus,
      series: [...seriesMap.values()],
      recent: rows.slice(0, 8).map((r: any) => ({
        documentId: r.documentId,
        orderNumber: r.orderNumber,
        status: r.status,
        total: r.total,
        placedAt: r.placedAt,
        restaurant: r.restaurant?.name || null,
        customer: r.customer ? `${r.customer.firstName || ''} ${r.customer.lastName || ''}`.trim() || r.customer.username : null,
        rider: r.rider?.name || null,
      })),
    };
  },
})) as any);
