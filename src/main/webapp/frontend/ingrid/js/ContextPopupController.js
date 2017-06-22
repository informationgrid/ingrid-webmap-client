goog.provide('ga_contextpopup_controller');
(function() {

  var module = angular.module('ga_contextpopup_controller', []);

  module.controller('GaContextPopupController',
      function($scope, gaGlobalOptions) {
        $scope.options = {
          heightUrl: gaGlobalOptions.apiUrl + '/rest/services/height',
          qrcodeUrl: gaGlobalOptions.apiUrl + '/qrcodegenerator',
          lv03tolv95Url: 'https://geodesy.geo.admin.ch/reframe/lv03tolv95',
          // INGRID: Add BWaStrLocator
          bwaLocatorUrl: '/ingrid-webmap-client/rest/jsonCallback/queryPost?',
          // INGRID: Add short URL
          shortenUrl: gaGlobalOptions.shortURLService
        };

      });

})();
