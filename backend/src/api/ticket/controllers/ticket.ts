import { factories } from '@strapi/strapi';
import { isAdmin, mergeFilters, publicUser } from '../../../common/access';

export default factories.createCoreController('api::ticket.ticket', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) mergeFilters(ctx, { user: { id: user.id } });
    return super.find(ctx);
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::ticket.ticket').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    row.user = publicUser(row.user);
    return { data: row, meta: {} };
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    ctx.request.body = { data: { ...body, user: user.id, status: 'open' } };
    return super.create(ctx);
  },

  /** Authors may append follow-up messages; admins may reply + change status. */
  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::ticket.ticket').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    if (isAdmin(user)) {
      ctx.request.body = { data: body };
      return super.update(ctx);
    }
    if (row.user?.id !== user.id) return ctx.forbidden();
    const existing = Array.isArray(row.replies) ? row.replies : [];
    const incoming = Array.isArray(body.replies) ? body.replies : [];
    ctx.request.body = {
      data: {
        replies: [...existing, ...incoming].map((r: any) => ({ ...r, by: 'customer' })),
        status: row.status === 'closed' ? 'closed' : 'open',
      },
    };
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::ticket.ticket').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    return super.delete(ctx);
  },
}));
