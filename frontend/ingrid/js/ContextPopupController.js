goog.provide('ga_contextpopup_controller');

(function() {

  var module = angular.module('ga_contextpopup_controller', []);

  module.controller('GaContextPopupController', function($scope,
      gaGlobalOptions) {
    $scope.options = {
      qrcodeUrl: gaGlobalOptions.apiUrl + '/qrcodegenerator',
      // INGRID: Add BWaStrLocator
      bwaLocatorUrl: '/ingrid-webmap-client/rest/jsonCallback/queryPost?',
      // INGRID: Add EbaStrLocator
      ebaLocatorUrl: '/ingrid-webmap-client/rest/jsonCallback/query?',
      // INGRID: Add short URL
      shortenUrl: gaGlobalOptions.shortURLService
    };
  });
})();
