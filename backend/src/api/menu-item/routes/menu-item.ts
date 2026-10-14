export default {
  routes: [
    { method: 'GET', path: '/menu-items', handler: 'menu-item.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/menu-items/:id', handler: 'menu-item.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/menu-items', handler: 'menu-item.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/menu-items/:id', handler: 'menu-item.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/menu-items/:id', handler: 'menu-item.delete', config: { policies: [], middlewares: [] } },
  ],
};
