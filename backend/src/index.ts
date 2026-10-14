import seed from './seed/seed';

export default {
  /**
   * An asynchronous register function that runs before the app is initialized.
   */
  register(/* { strapi }: { strapi: any } */) {},

  /**
   * An asynchronous bootstrap function that runs before the app gets started.
   * Seeds RBAC roles, permissions, demo accounts and sample catalogue data.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await seed();
    } catch (e) {
      strapi.log.error('FoodExpress seed failed');
      strapi.log.error(e);
    }
  },
};
