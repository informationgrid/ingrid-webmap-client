goog.provide('ga_mouseposition_controller');
(function() {

  var module = angular.module('ga_mouseposition_controller', [
    'pascalprecht.translate'
  ]);

  module.controller('GaMousePositionController',
      function($scope, $translate, $window) {
        var coordinatesFormat = function(coordinates) {
          return $translate.instant('coordinates_label') + ': ' +
              ol.coordinate.toStringXY(coordinates, 0).
                replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        };

        var coordinatesFormatUTM = function(coordinates, zone) {
          var coord = ol.coordinate.toStringXY(coordinates, 0).
            replace(/\B(?=(\d{3})+(?!\d))/g, "'");
          return coord + ' ' + zone;
        };
        // TODO INGRID: Change projections. Create by admin/json.
        $scope.mousePositionProjections = [{
          value: 'EPSG:3857',
          label: 'Mercator (Breite/Länge)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 2);
          }
        }, {
          value: 'EPSG:4326',
          label: 'WGS 84 (Breite/Länge)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 5) + ' (WGS 84)';
          }
        }, {
          value: 'EPSG:31466',
          label: 'GK2 - DHDN90 (Rechtswert/Hochwert)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 2) + ' (GK2)';
          }
        }, {
          value: 'EPSG:31467',
          label: 'GK3 - DHDN90 (Rechtswert/Hochwert)',
          format: function(coordinates) {
             return ol.coordinate.format(coordinates, '{y}, {x}', 2) + ' (GK3)';
          }
        }, {
          value: 'EPSG:31468',
          label: 'GK4 - DHDN90 (Rechtswert/Hochwert)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 2) + ' (GK4)';
          }
        }, {
          value: 'EPSG:31469',
          label: 'GK5 - DHDN90 (Rechtswert/Hochwert)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 2) + ' (GK5)';
          }
        }, {
          value: 'EPSG:25832',
          label: 'UTM 32N - ETRS89 (East/North)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 2) + ' (UTM 32N)';
          }
        }, {
          value: 'EPSG:25833',
          label: 'UTM 33N - ETRS89 (East/North)',
          format: function(coordinates) {
            return ol.coordinate.format(coordinates, '{y}, {x}', 2) + ' (UTM 33N)';
          }
        }
        ];

        $scope.options = {
          projection: $scope.mousePositionProjections[0]
        };

      });

})();
