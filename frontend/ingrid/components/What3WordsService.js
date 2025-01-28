goog.provide('ga_what3words_service');
(function() {

  var module = angular.module('ga_what3words_service', []);

  module.provider('gaWhat3Words', function() {
    this.$get = function($http, $q, gaGlobalOptions, gaLang) {

      var urlW3W = gaGlobalOptions.w3wUrl + '/v3/convert-to-coordinates';
      var urlPosition = gaGlobalOptions.w3wUrl + '/v3/convert-to-3wa';
      var regExp = new RegExp('^[a-zàâäèéêëîïôöœùûüÿç]{3,}' +
                              '\\.[a-zàâäèéêëîïôöœùûüÿç]{3,}' +
                              '\\.[a-zàâäèéêëîïôöœùûüÿç]{3,}$');
      var canceler;

      var is3WordString = function(q) {
        return regExp.test(q);
      };

      var cancel = function(q) {
        if (canceler !== undefined) {
          canceler.resolve();
          canceler = undefined;
        }
      };

      var What3Words = function() {
        // Cancel outstanding requests
        this.cancel = function() {
          cancel();
        };

        // Returns a promise which is resolved
        // with response from what3words api call
        // or null when given word is not w3w.
        this.getCoordinate = function(q) {
          cancel();
          if (!is3WordString(q)) {
            return null;
          }
          canceler = $q.defer();
          return $http.get(urlW3W, {
            timeout: canceler.promise,
            params: {
              key: gaGlobalOptions.w3wApiKey,
              words: q
            }
          });
        };

        // Returns a promise which is resolved
        // with the result as text. If an error
        // occurs, then '-' is returned
        this.getWords = function(lon, lat) {
          cancel();
          canceler = $q.defer();

          return $http.get(urlPosition, {
            timeout: canceler.promise,
            params: {
              key: gaGlobalOptions.w3wApiKey,
              coordinates: lon + ',' + lat,
              language: gaLang.get()
            }
          }).then(function(response) {
            var words = response.data.words;
            if (words) {
              return words;
            }
            return '-';
          });
        };
      };
      return new What3Words();
    };
  });
})();
