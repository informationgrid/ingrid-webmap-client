goog.provide('ga_help_service');

goog.require('ga_translation_service');

(function() {

  var module = angular.module('ga_help_service', [
    'ga_translation_service'
  ]);

 /**
   * The gaHelp service.
   *
   * The service provides the following functionality:
   *
   * - Allows the gaHelpDirective to get a html snipped
   *   for a given help-id
   */
  module.provider('gaHelp', function() {
    this.$get = function($http, gaLang) {

      var Help = function() {
        var helpTpl = '//help.geo.admin.ch?id={id}&lang={lang}';
        /* INGRID: Change 'url'
        var url = 'https://www.googleapis.com/fusiontables/v1/query?' +
                  'callback=JSON_CALLBACK';
        */
        var url = '/ingrid-webmap-client/rest/config/help';
        /* INGRID: Not in used
        var apiKey = 'AIzaSyDT7wmEx97gAG5OnPwKyz2PnCx3yT4j7C0';
        var sqlTmpl = 'select * from 1Tx2VSM1WHZfDXzf8rweRLG1kd23AA4aw8xnZ_3c' +
                      ' where col0={id} and col5=\'{lang}\'';
        */

        // Returns a promise
        this.get = function(id) {
          var lang = gaLang.getNoRm();

          // get it from fusion tables
          /* INGRID: Not in used
          var sql = sqlTmpl.
              replace('{id}', id).
              replace('{lang}', lang);
          */
          // INGRID: Change '$http.jsonp' to '$http.get' and add replacing.
          return $http.get(url + '/' + lang + '/' + id, {
            cache: true
          }).then(function(response) {
            return response.data;
          });
        };

        // Opens a new window
        this.open = function(id) {
          var lang = gaLang.getNoRm();
          var url = helpTpl.
              replace('{id}', id).
              replace('{lang}', lang);
          window.open(url);
        };
      };

      return new Help();
    };
  });
})();
