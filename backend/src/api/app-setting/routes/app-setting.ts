export default {
  routes: [
    { method: 'GET', path: '/app-setting', handler: 'app-setting.find', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/app-setting', handler: 'app-setting.update', config: { policies: [], middlewares: [] } },
  ],
};
