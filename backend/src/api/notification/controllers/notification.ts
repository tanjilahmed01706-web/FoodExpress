import { factories } from '@strapi/strapi';
import { isAdmin, panelRoleOf, mergeFilters } from '../../../common/access';

export default factories.createCoreController('api::notification.notification', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) mergeFilters(ctx, { user: { id: user.id } });
    return super.find(ctx);
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::notification.notification').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    row.user = null;
    return { data: row, meta: {} };
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'admin') return ctx.forbidden('Notifications are server-generated');
    }
    return super.create(ctx);
  },

  /** Users may only toggle their own isRead flag. */
  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::notification.notification').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user)) {
      if (row.user?.id !== user.id) return ctx.forbidden();
      const body = ctx.request.body?.data ?? ctx.request.body ?? {};
      ctx.request.body = { data: { isRead: body.isRead ?? true } };
    }
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::notification.notification').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    return super.delete(ctx);
  },
}));
