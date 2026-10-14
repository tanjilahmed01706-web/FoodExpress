import { factories } from '@strapi/strapi';
import { isAdmin, panelRoleOf, mergeFilters, publicUser } from '../../../common/access';

export default factories.createCoreController('api::restaurant.restaurant', ({ strapi }: any) => ({
  /** Public sees approved stores only; partners see their own store; admins see everything. */
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!isAdmin(user)) {
      if (user && panelRoleOf(user) === 'restaurant') {
        mergeFilters(ctx, { owner: { id: user.id } });
      } else {
        mergeFilters(ctx, { isApproved: true });
      }
    }
    return super.find(ctx);
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    const row = await strapi.db.query('api::restaurant.restaurant').findOne({
      where: { documentId: ctx.params.id },
      populate: { owner: true, cuisines: true, zone: true, logo: true, cover: true },
    });
    if (!row) return ctx.notFound('Restaurant not found');
    if (!isAdmin(user)) {
      if (user && panelRoleOf(user) === 'restaurant') {
        if (row.owner?.id !== user.id) return ctx.forbidden('This store does not belong to you');
      } else if (!row.isApproved) {
        return ctx.notFound('Restaurant not found');
      }
    }
    row.owner = publicUser(row.owner);
    return { data: row, meta: {} };
  },

  /** Restaurant partners onboard themselves; approval is granted by the platform admin. */
  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'restaurant') {
        return ctx.forbidden('Only restaurant partner accounts can register a store');
      }
      const existing = await strapi.db.query('api::restaurant.restaurant').findOne({
        where: { owner: { id: user.id } },
      });
      if (existing) return ctx.badRequest('You already own a store. Contact support to add more.');
      const body = ctx.request.body?.data ?? ctx.request.body ?? {};
      ctx.request.body = {
        data: {
          ...body,
          owner: user.id,
          isApproved: false,
          isOpen: body.isOpen ?? true,
          rating: 0,
          ratingCount: 0,
        },
      };
    }
    return super.create(ctx);
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::restaurant.restaurant').findOne({
      where: { documentId: ctx.params.id },
      populate: { owner: true },
    });
    if (!row) return ctx.notFound('Restaurant not found');
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'restaurant' || row.owner?.id !== user.id) {
        return ctx.forbidden('This store does not belong to you');
      }
      const body = ctx.request.body?.data ?? ctx.request.body ?? {};
      // Partners can never escalate approval/feature/rating/ownership fields.
      const { isApproved, isFeatured, rating, ratingCount, owner, commissionRate, ...safe } = body;
      ctx.request.body = { data: safe };
    }
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::restaurant.restaurant').findOne({
      where: { documentId: ctx.params.id },
      populate: { owner: true },
    });
    if (!row) return ctx.notFound('Restaurant not found');
    if (!isAdmin(user) && (panelRoleOf(user) !== 'restaurant' || row.owner?.id !== user.id)) {
      return ctx.forbidden('This store does not belong to you');
    }
    return super.delete(ctx);
  },
}));
