/**
 * Shared access helpers for FoodExpress panel-based RBAC.
 * Every user account carries a `panelRole`: customer | restaurant | rider | admin.
 */
export type PanelRole = 'customer' | 'restaurant' | 'rider' | 'admin';

export const panelRoleOf = (user: any): PanelRole => (user?.panelRole as PanelRole) || 'customer';

export const isAdmin = (user: any): boolean => panelRoleOf(user) === 'admin';

export const isRestaurantOwner = (user: any): boolean => panelRoleOf(user) === 'restaurant';

export const isRider = (user: any): boolean => panelRoleOf(user) === 'rider';

/** Returns the restaurant owned by a partner account (or null). */
export const findOwnedRestaurant = async (user: any) => {
  return strapi.db.query('api::restaurant.restaurant').findOne({
    where: { owner: { id: user.id } },
  });
};

/** Returns the rider profile linked to a user (or null). */
export const findRiderProfile = async (user: any) => {
  return strapi.db.query('api::rider.rider').findOne({
    where: { user: { id: user.id } },
  });
};

/** Merge query filters without dropping existing ones. */
export const mergeFilters = (ctx: any, extra: Record<string, any>) => {
  ctx.query = ctx.query || {};
  ctx.query.filters = { ...(ctx.query.filters || {}), ...extra };
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Safe, public projection of a user row (never expose password hashes etc.). */
export const publicUser = (u: any) =>
  u
    ? {
        documentId: u.documentId,
        username: u.username,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        phone: u.phone ?? null,
        panelRole: u.panelRole ?? null,
      }
    : null;

export const makeOrderNumber = () => {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FE-${time}-${rand}`;
};
