export default {
  routes: [
    { method: 'GET', path: '/riders', handler: 'rider.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/riders/:id', handler: 'rider.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/riders', handler: 'rider.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/riders/:id', handler: 'rider.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/riders/:id', handler: 'rider.delete', config: { policies: [], middlewares: [] } },
  ],
};
