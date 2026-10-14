import { factories } from '@strapi/strapi';
import { isAdmin, panelRoleOf, findOwnedRestaurant, mergeFilters } from '../../../common/access';

export default factories.createCoreController('api::menu-category.menu-category', ({ strapi }: any) => ({
  async find(ctx: any) {
    const user = ctx.state.user;
    if (!isAdmin(user)) {
      if (user && panelRoleOf(user) === 'restaurant') {
        const owned = await findOwnedRestaurant(user);
        if (!owned) return ctx.forbidden('No store linked to this account');
        mergeFilters(ctx, { restaurant: { documentId: owned.documentId } });
      } else {
        mergeFilters(ctx, { restaurant: { isApproved: true } });
      }
    }
    return super.find(ctx);
  },

  async create(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'restaurant') return ctx.forbidden();
      const owned = await findOwnedRestaurant(user);
      if (!owned) return ctx.forbidden('No store linked to this account');
      const body = ctx.request.body?.data ?? ctx.request.body ?? {};
      if (body.restaurant && body.restaurant !== owned.documentId && body.restaurant?.documentId !== owned.documentId) {
        return ctx.forbidden('You can only add categories to your own store');
      }
      ctx.request.body = { data: { ...body, restaurant: owned.documentId } };
    }
    return super.create(ctx);
  },

  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::menu-category.menu-category').findOne({
      where: { documentId: ctx.params.id },
      populate: { restaurant: { populate: { owner: true } } },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'restaurant' || row.restaurant?.owner?.id !== user.id) {
        return ctx.forbidden('This category does not belong to your store');
      }
    }
    return super.update(ctx);
  },

  async delete(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const row = await strapi.db.query('api::menu-category.menu-category').findOne({
      where: { documentId: ctx.params.id },
      populate: { restaurant: { populate: { owner: true } } },
    });
    if (!row) return ctx.notFound();
    if (!isAdmin(user)) {
      if (panelRoleOf(user) !== 'restaurant' || row.restaurant?.owner?.id !== user.id) {
        return ctx.forbidden('This category does not belong to your store');
      }
    }
    return super.delete(ctx);
  },
}));
