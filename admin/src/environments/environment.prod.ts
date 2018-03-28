declare const require: any;

export const environment = {
  production: true,
  httpServiceDomain: '',
  translatePath: '/ingrid-webmap-client/admin',
  version: require('../../package.json').version
};
