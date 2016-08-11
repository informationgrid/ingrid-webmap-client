goog.provide('ga_importwms_controller');
(function() {

  var module = angular.module('ga_importwms_controller', []);

  module.controller('GaImportWmsController', function($scope, gaGlobalOptions) {
    $scope.options = {
      proxyUrl: gaGlobalOptions.ogcproxyUrl,
      defaultGetCapParams: 'SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0',
      // INGRID: Get list from settings
      defaultWMSList: gaGlobalOptions.settingDefaultWMSList
    };
  });
})();
