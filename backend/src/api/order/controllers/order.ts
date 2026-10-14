import { factories } from '@strapi/strapi';
import {
  isAdmin,
  panelRoleOf,
  makeOrderNumber,
  findOwnedRestaurant,
  findRiderProfile,
  mergeFilters,
  publicUser,
} from '../../../common/access';

const ORDER_UID = 'api::order.order';

export default factories.createCoreController('api::order.order', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const role = panelRoleOf(user);
    if (!isAdmin(user)) {
      if (role === 'customer') {
        mergeFilters(ctx, { customer: { id: user.id } });
      } else if (role === 'restaurant') {
        const owned = await findOwnedRestaurant(user);
        if (!owned) return ctx.forbidden('No store linked to this account');
        mergeFilters(ctx, { restaurant: { id: owned.id } });
      } else if (role === 'rider') {
        const profile = await findRiderProfile(user);
        if (!profile) return ctx.forbidden('No delivery profile linked to this account');
        ctx.query = ctx.query || {};
        ctx.query.filters = {
          ...(ctx.query.filters || {}),
          $or: [{ rider: { id: profile.id } }, { status: 'ready' }],
        };
      }
    }
    return super.find(ctx);
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query(ORDER_UID).findOne({
      where: { documentId: ctx.params.id },
      populate: { restaurant: true, rider: true, customer: true },
    });
    if (!row) return ctx.notFound('Order not found');
    row.customer = publicUser(row.customer);
    if (!isAdmin(user)) {
      const role = panelRoleOf(user);
      const isCustomer = role === 'customer' && row.customer?.id === user.id;
      const isOwner = role === 'restaurant' && row.restaurant?.owner?.id === user.id;
      const isRider = role === 'rider' && row.rider?.user?.id === user.id;
      if (!isCustomer && !isOwner && !isRider) return ctx.forbidden('You cannot view this order');
    }
    return { data: row, meta: {} };
  },

  /** Checkout: validates and prices the cart server-side, then creates the order. */
  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const role = panelRoleOf(user);
    if (role !== 'customer' && role !== 'admin') {
      return ctx.forbidden('Only customer accounts can place orders');
    }

    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    const service = strapi.service('api::order.order');

    const restaurant = await strapi.db.query('api::restaurant.restaurant').findOne({
      where: { documentId: body.restaurant },
      populate: { owner: true },
    });
    if (!restaurant) return ctx.badRequest('Restaurant not found');
    if (!restaurant.isApproved) return ctx.badRequest('This restaurant is not open for orders');
    if (!restaurant.isOpen) return ctx.badRequest('This restaurant is currently closed');

    const address = body.deliveryAddress;
    if (!address?.line || address.lat == null || address.lng == null) {
      return ctx.badRequest('A delivery address with map coordinates is required');
    }

    let totals: any;
    try {
      totals = await service.computeTotals({
        restaurantRow: restaurant,
        items: body.items,
        couponCode: body.couponCode,
      });
    } catch (e: any) {
      return ctx.badRequest(e.message);
    }

    const minOrder = Number(restaurant.minOrder || 0);
    if (totals.subtotal < minOrder) {
      return ctx.badRequest(`Minimum order for ${restaurant.name} is ${minOrder}`);
    }

    const paymentMethod = body.paymentMethod === 'card' ? 'card' : 'cod';
    const now = new Date().toISOString();
    const data: any = {
      orderNumber: makeOrderNumber(),
      customer: user.id,
      restaurant: restaurant.id,
      items: totals.items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      couponCode: totals.couponCode,
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
      status: 'pending',
      deliveryAddress: {
        label: address.label || 'Home',
        line: address.line,
        lat: Number(address.lat),
        lng: Number(address.lng),
        note: address.note || '',
      },
      customerNote: (body.customerNote || '').slice(0, 500),
      timeline: [{ status: 'pending', label: 'Order placed', at: now, note: '' }],
      placedAt: now,
    };

    const order = await strapi.db.query(ORDER_UID).create({ data });

    // Bump coupon usage
    if (totals.couponCode) {
      const coupon = await strapi.db.query('api::coupon.coupon').findOne({ where: { code: totals.couponCode } });
      if (coupon) {
        await strapi.db.query('api::coupon.coupon').update({
          where: { id: coupon.id },
          data: { usedCount: Number(coupon.usedCount || 0) + 1 },
        });
      }
    }

    await service.notifyUser(user.id, {
      title: `Order ${order.orderNumber} placed`,
      message: `We sent your order to ${restaurant.name}.`,
      type: 'order',
      link: `/orders/${order.documentId}`,
    });
    await service.notifyUser(restaurant.owner?.id, {
      title: `New order received`,
      message: `${order.orderNumber} • ${totals.total}`,
      type: 'order',
      link: '/orders',
    });

    const full = await strapi.db.query(ORDER_UID).findOne({
      where: { id: order.id },
      populate: { restaurant: true, rider: true, customer: true },
    });
    full.customer = publicUser(full.customer);
    return { data: full, meta: {} };
  },

  /** Direct updates are admin-only; everyone else uses the status state machine. */
  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) return ctx.forbidden('Use the order status action to progress an order');
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) return ctx.forbidden();
    return super.delete(ctx);
  },

  /** POST /orders/:id/status — role-checked pipeline transition. */
  async changeStatus(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const role = panelRoleOf(user);
    const next = ctx.request.body?.status ?? ctx.request.body?.data?.status;
    const note = ctx.request.body?.note ?? ctx.request.body?.data?.note ?? '';
    if (!next) return ctx.badRequest('Target status is required');

    const order = await strapi.db.query(ORDER_UID).findOne({
      where: { documentId: ctx.params.id },
      populate: { restaurant: { populate: { owner: true } }, customer: true, rider: { populate: { user: true } } },
    });
    if (!order) return ctx.notFound('Order not found');

    // Role guards
    if (role === 'customer') {
      if (order.customer?.id !== user.id) return ctx.forbidden('This is not your order');
      if (next !== 'cancelled') return ctx.forbidden('Customers can only cancel their order');
      if (!['pending', 'confirmed'].includes(order.status)) {
        return ctx.badRequest('This order can no longer be cancelled');
      }
    } else if (role === 'restaurant') {
      if (order.restaurant?.owner?.id !== user.id) return ctx.forbidden('This is not your store order');
      if (!['confirmed', 'preparing', 'ready', 'cancelled'].includes(next)) {
        return ctx.forbidden('Restaurants cannot set this status');
      }
    } else if (role === 'rider') {
      const profile = await findRiderProfile(user);
      if (!profile) return ctx.forbidden('No delivery profile linked to this account');
      if (next === 'picked_up') {
        if (order.status !== 'ready') return ctx.badRequest('Order is not ready for pickup');
        if (order.rider && order.rider.id !== profile.id) return ctx.badRequest('Already assigned to another rider');
        if (!order.rider) {
          await strapi.db.query(ORDER_UID).update({ where: { id: order.id }, data: { rider: profile.id } });
          order.rider = profile;
        }
      } else if (['on_the_way', 'delivered'].includes(next)) {
        if (!order.rider || order.rider.id !== profile.id) return ctx.forbidden('Order is not assigned to you');
      } else {
        return ctx.forbidden('Riders cannot set this status');
      }
    } else if (!isAdmin(user)) {
      return ctx.forbidden();
    }

    try {
      const updated = await strapi.service('api::order.order').changeStatus({ order, next, user, role, note });
      return { data: updated, meta: {} };
    } catch (e: any) {
      return ctx.badRequest(e.message);
    }
  },

  /** GET /orders/stats?scope=admin|restaurant|rider|customer */
  async stats(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const role = panelRoleOf(user);
    let scope = ctx.query.scope || (role === 'admin' ? 'admin' : role);
    if (!isAdmin(user) && scope !== role) scope = role;
    const data = await strapi.service('api::order.order').statsFor({ user, scope });
    return { data: { scope, ...data }, meta: {} };
  },
}));
