import { factories } from '@strapi/strapi';
import { isAdmin, mergeFilters, publicUser } from '../../../common/access';

export default factories.createCoreController('api::address.address', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) mergeFilters(ctx, { user: { id: user.id } });
    return super.find(ctx);
  },

  async findOne(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::address.address').findOne({
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
    ctx.request.body = { data: { ...body, user: user.id } };
    return super.create(ctx);
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::address.address').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    const { user: _u, ...safe } = body;
    ctx.request.body = { data: safe };
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::address.address').findOne({
      where: { documentId: ctx.params.id },
      populate: { user: true },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user) && row.user?.id !== user.id) return ctx.forbidden();
    return super.delete(ctx);
  },
}));
