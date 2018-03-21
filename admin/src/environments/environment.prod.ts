declare const require: any;

export const environment = {
  production: true,
  httpServiceDomain: "",
  translatePath: "/ingrid-webmap-client/",
  version: require("../../package.json").version
};
