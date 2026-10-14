import { factories } from '@strapi/strapi';
import { isAdmin, panelRoleOf, mergeFilters, publicUser } from '../../../common/access';

export default factories.createCoreController('api::rider.rider', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!isAdmin(user)) {
      if (user && panelRoleOf(user) === 'rider') {
        mergeFilters(ctx, { user: { id: user.id } });
      } else {
        return ctx.forbidden('Riders are only visible to admins and the rider themselves');
      }
    }
    return super.find(ctx);
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    const row = await strapi.db.query('api::rider.rider').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true, zone: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    row.user = publicUser(row.user);
    return { data: row, meta: {} };
  },

  /** Rider self-registration: profile is always tied to the caller and awaits admin approval. */
  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'rider') return ctx.forbidden('Only rider accounts can create a delivery profile');
      const existing = await strapi.db.query('api::rider.rider').findOne({ where: { user: { id: user.id } } });
      if (existing) return ctx.badRequest('A delivery profile already exists for this account');
      const body = ctx.request.body?.data ?? ctx.request.body ?? {};
      ctx.request.body = {
        data: {
          ...body,
          user: user.id,
          isApproved: false,
          isAvailable: false,
          name: body.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        },
      };
    }
    return super.create(ctx);
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::rider.rider').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'rider' || row.user?.id !== user.id) return ctx.forbidden('This profile is not yours');
      const body = ctx.request.body?.data ?? ctx.request.body ?? {};
      const { isApproved, rating, ratingCount, totalDeliveries, totalEarnings, user: _u, ...safe } = body;
      ctx.request.body = { data: safe };
    }
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::rider.rider').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && (panelRoleOf(user) !== 'rider' || row.user?.id !== user.id)) return ctx.forbidden();
    return super.delete(ctx);
  },
}));
