goog.provide('ga_search_controller');
(function() {

  var module = angular.module('ga_search_controller', []);

  module.controller('GaSearchController',
      function($scope, gaGlobalOptions) {
        $scope.options = {
          // INGRID: Change search layer URL
          searchUrl: '/ingrid-webmap-client/rest/search/query?',
          // INGRID: Add search service URL
          searchServiceUrl: gaGlobalOptions.searchServiceUrl,
          // INGRID: Add search nominatim URL
          searchNominatimUrl: gaGlobalOptions.searchNominatimUrl,
          // INGRID: Add search BWaStrLocator URL
          searchBwaLocatorUrl: gaGlobalOptions.searchBwaLocatorUrl,
          featureUrl: gaGlobalOptions.cachedApiUrl +
              '/rest/services/{Topic}/MapServer/{Layer}/{Feature}'
        };
      });
})();
