import { factories } from '@strapi/strapi';
import { isAdmin, round2 } from '../../../common/access';

export default factories.createCoreController('api::coupon.coupon', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!isAdmin(user)) {
      // Only the admin panel should browse the full coupon catalogue.
      ctx.query = ctx.query || {};
      ctx.query.filters = { ...(ctx.query.filters || {}), isActive: true };
    }
    return super.find(ctx);
  },

  /**
   * Checkout validation. Body: { code, subtotal, restaurant? }
   * Returns { valid, discount, coupon } or throws a 400 with the reason.
   */
  async validate(ctx: any) {
    const { code, subtotal, restaurant } = (ctx.request.body?.data ?? ctx.request.body ?? {}) as any;
    if (!code) return ctx.badRequest('Coupon code is required');

    const coupon = await strapi.db.query('api::coupon.coupon').findOne({
      where: { code: String(code).trim().toUpperCase() },
      populate: { restaurant: true },
    });
    if (!coupon) return ctx.badRequest('Invalid coupon code');
    if (!coupon.isActive) return ctx.badRequest('This coupon is no longer active');
    if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now()) {
      return ctx.badRequest('This coupon has expired');
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return ctx.badRequest('This coupon has reached its usage limit');
    }
    const amount = Number(subtotal || 0);
    if (Number(coupon.minOrder || 0) > amount) {
      return ctx.badRequest(`Minimum order for this coupon is ${coupon.minOrder}`);
    }
    if (coupon.restaurant?.documentId && restaurant && coupon.restaurant.documentId !== restaurant) {
      return ctx.badRequest('This coupon is only valid for a specific restaurant');
    }

    let discount =
      coupon.type === 'percent' ? (amount * Number(coupon.value || 0)) / 100 : Number(coupon.value || 0);
    if (coupon.maxDiscount != null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = round2(Math.min(discount, amount));

    return {
      valid: true,
      discount,
      coupon: {
        documentId: coupon.documentId,
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount ?? null,
      },
    };
  },
}));
