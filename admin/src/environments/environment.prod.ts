declare const require: any;

export const environment = {
  production: true,
  httpServiceDomain: '',
  translatePath: '/ingrid-webmap-client/rest/config/locales/',
  version: require('../../package.json').version
};
