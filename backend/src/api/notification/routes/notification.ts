export default {
  routes: [
    { method: 'GET', path: '/notifications', handler: 'notification.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/notifications/:id', handler: 'notification.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/notifications', handler: 'notification.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/notifications/:id', handler: 'notification.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/notifications/:id', handler: 'notification.delete', config: { policies: [], middlewares: [] } },
  ],
};
