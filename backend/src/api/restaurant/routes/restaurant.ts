export default {
  routes: [
    { method: 'GET', path: '/restaurants', handler: 'restaurant.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/restaurants/:id', handler: 'restaurant.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/restaurants', handler: 'restaurant.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/restaurants/:id', handler: 'restaurant.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/restaurants/:id', handler: 'restaurant.delete', config: { policies: [], middlewares: [] } },
  ],
};
