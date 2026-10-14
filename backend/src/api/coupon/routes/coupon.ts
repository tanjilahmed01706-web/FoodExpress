export default {
  routes: [
    { method: 'GET', path: '/coupons', handler: 'coupon.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/coupons/:id', handler: 'coupon.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/coupons', handler: 'coupon.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/coupons/:id', handler: 'coupon.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/coupons/:id', handler: 'coupon.delete', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/coupons/validate', handler: 'coupon.validate', config: { policies: [], middlewares: [] } },
  ],
};
