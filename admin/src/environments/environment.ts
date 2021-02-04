// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

declare const require: any;

export const environment = {
  production: false,
  httpServiceDomain: 'http://localhost:8080/ingrid-webmap-client',
  translatePath: '/assets/i18n/',
  mapURL: 'http://localhost:8080/kartendienste?',
  version: require('../../package.json').version
};
