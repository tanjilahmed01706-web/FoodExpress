export default {
  routes: [
    { method: 'GET', path: '/menu-categories', handler: 'menu-category.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/menu-categories/:id', handler: 'menu-category.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/menu-categories', handler: 'menu-category.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/menu-categories/:id', handler: 'menu-category.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/menu-categories/:id', handler: 'menu-category.delete', config: { policies: [], middlewares: [] } },
  ],
};
