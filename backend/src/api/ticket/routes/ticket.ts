export default {
  routes: [
    { method: 'GET', path: '/tickets', handler: 'ticket.find', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/tickets/:id', handler: 'ticket.findOne', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/tickets', handler: 'ticket.create', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/tickets/:id', handler: 'ticket.update', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/tickets/:id', handler: 'ticket.delete', config: { policies: [], middlewares: [] } },
  ],
};
