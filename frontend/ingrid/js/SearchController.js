goog.provide('ga_search_controller');
(function() {

  var module = angular.module('ga_search_controller', []);

  module.controller('GaSearchController', function($scope, gaGlobalOptions) {

    // Set sr param if possible
    var sr = '?';
    if ($scope.map) {
      var epsgCode = $scope.map.getView().getProjection().getCode();
      sr += 'sr=' + epsgCode.split(':')[1] + '&';
    }

    $scope.options = {
      // INGRID: Change search layer URL
      searchUrl: '/ingrid-webmap-client/rest/search/query?',
      // INGRID: Add search service URL
      searchServiceUrl: gaGlobalOptions.searchServiceUrl,
      // INGRID: Add search nominatim URL
      searchNominatimUrl: gaGlobalOptions.searchNominatimUrl,
      // INGRID: Add search BWaStrLocator URL
      searchBwaLocatorUrl: gaGlobalOptions.searchBwaLocatorUrl,
      // INGRID: Add search BWaStrLocator URL
      searchEbaLocatorUrl: gaGlobalOptions.searchEbaLocatorUrl,
      // INGRID: Add zoom for coordinate search
      searchCoordsZoom: gaGlobalOptions.searchCoordsZoom,
      // INGRID: Add open import popup on service item
      searchServiceAdd: function(url) {
        $scope.globals.importPopupShown = true;
        $scope.globals.importExtService = url;
      },
      // INGRID: Close import popup
      searchServiceReset: function() {
        $scope.globals.importPopupShown = false;
      },
      featureUrl: gaGlobalOptions.cachedApiUrl +
          '/rest/services/{Topic}/MapServer/{Layer}/{Feature}' + sr
    };

  });
})();
