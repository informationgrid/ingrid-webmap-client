goog.provide('ga_search_controller');
(function() {

  var module = angular.module('ga_search_controller', []);

  module.controller('GaSearchController',
      function($scope, gaGlobalOptions) {
        $scope.options = {
          // INGRID: Change search service URL
          searchUrl: '/ingrid-mf-geoadmin3/rest/search/query?',
          featureUrl: gaGlobalOptions.cachedApiUrl +
              '/rest/services/{Topic}/MapServer/{Layer}/{Feature}'
        };
      });
})();

