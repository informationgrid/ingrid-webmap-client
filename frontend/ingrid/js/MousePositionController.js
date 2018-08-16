goog.provide('ga_mouseposition_controller');

goog.require('ga_measure_service');

(function() {

  var module = angular.module('ga_mouseposition_controller', [
    'ga_measure_service',
    'pascalprecht.translate'
  ]);

  // INGRID: Add 'gaGlobalOptions'
  module.controller('GaMousePositionController', function($scope, $translate,
      $window, gaMeasure, gaGlobalOptions) {

    /* INGRID: Not in used
    var coordinatesFormat = function(coordinates) {
      return $translate.instant('coordinates_label') + ': ' +
          gaMeasure.formatCoordinates(coordinates, 1);
    };

    var coordinatesFormatUTM = function(coordinates, zone) {
      return gaMeasure.formatCoordinates(coordinates) + ' ' + zone;
    };
    */

    // TODO INGRID: Change projections. Create by admin/json.
    var projections = [{
      value: 'EPSG:3857',
      label: 'Mercator (Breite/Länge)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{y}, {x}', 2);
      }
    }, {
      value: 'EPSG:4326',
      label: 'WGS 84 (Breite/Länge)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{y}, {x}', 5);
      }
    }, {
      value: 'EPSG:31466',
      label: 'GK2 - DHDN (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:31467',
      label: 'GK3 - DHDN (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:31468',
      label: 'GK4 - DHDN (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:31469',
      label: 'GK5 - DHDN (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:25832',
      label: 'UTM 32N - ETRS89 (East/North)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:25833',
      label: 'UTM 33N - ETRS89 (East/North)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:2166',
      label: 'GK3 - S42/83 (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:2167',
      label: 'GK4 - S42/83 (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }, {
      value: 'EPSG:2168',
      label: 'GK5 - S42/83 (Rechtswert/Hochwert)',
      format: function(coordinates) {
        return ol.coordinate.format(coordinates, '{x}, {y}', 2);
      }
    }];

    var sortProjections = [];
    for (var gp in gaGlobalOptions.defaultMouseProjections) {
      var gaProj = gaGlobalOptions.defaultMouseProjections[gp];
      for (var p in projections) {
        var proj = projections[p];
        if (gaProj === proj.value) {
          sortProjections.push(proj);
          break;
        }
      }
    }
    $scope.mousePositionProjections = sortProjections;

    $scope.options = {
      projection: $scope.mousePositionProjections[0]
    };
  });
})();
