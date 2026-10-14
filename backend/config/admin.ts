export default {
  autoOpen: false,
  /**
   * In FoodExpress the admin UI is the custom FoodExpress admin app at
   * `frontend/admin/` (React + Tailwind + Leaflet), not the strapi-branded
   * `/admin` UI. We keep strapi running as the headless CMS / data layer only.
   *
   * The FoodExpress brand is served dynamically:
   *  - /favicon.png and /logo.png are resolved by strapi::public from
   *    backend/public/ (we keep the logo/favicon.png we imported from the
   *    attached FoodExpress artwork).
   *  - The live brand values (siteName, primaryColor, logo url, favicon url,
   *    heroTitle, announcement, fees, ...) are exposed through the
   *    `/api/app-setting` singleton, which every FoodExpress panel reads at
   *    startup and whenever the admin edits the branding.
   */
  app: {
    // Keep the strapi-branded admin iframe off the main route so FoodExpress
    // owns the experience. The FoodExpress admin app is served from the
    // `frontend/admin` build, proxied or deployed alongside the API.
    isDefaultAdmin: false,
  },
  /**
   * Where the strapi-branded admin panel would live. FoodExpress uses its own
   * admin app instead, but we keep this path configured so the CMS admin can
   * still be reached at /admin if an operator needs to inspect content types
   * directly during setup.
   */
  path: '/admin',
  watch: true,
  /**
   * Admin UI env passed to the strapi-branded admin app (kept minimal since we
   * run our own admin). FoodExpress branding lives on the API side in
   * app-setting.
   */
  auth: {
    secret: process.env.ADMIN_JWT_SECRET ?? '',
  },
};
