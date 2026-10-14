export default {
  routes: [
    { method: 'GET', path: '/reviews', handler: 'review.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/reviews/:id', handler: 'review.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/reviews', handler: 'review.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/reviews/:id', handler: 'review.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/reviews/:id', handler: 'review.delete', config: { policies: [], middlewares: [] } },
  ],
};
