goog.provide('ga_measure_directive');

goog.require('ga_measure_service');

(function() {

  var module = angular.module('ga_measure_directive', [
    'ga_measure_service'
  ]);

  module.directive('gaMeasure', function(gaMeasure, gaGlobalOptions) {
    return {
      restrict: 'A',
      templateUrl: 'components/measure/partials/measure.html',
      scope: {
        feature: '=gaMeasure',
        precision: '=gaCoordinatePrecision'
      },
      link: function(scope, elt) {
        var deregisterKey;
        var update = function(feature) {
          scope.coord = undefined;
          scope.distance = undefined;
          scope.surface = undefined;
          scope.azimuth = undefined;

          var geom = feature.getGeometry();
          if (geom instanceof ol.geom.Point) {
            /* INGRID: Remove format coordinates
            scope.coord = gaMeasure.formatCoordinates(geom.getCoordinates(),
                scope.precision);
            */
            if (gaGlobalOptions.defaultEpsg === 'EPSG:4326' ||
              gaGlobalOptions.defaultEpsg === 'EPSG:3857' ) {
              scope.coord = ol.coordinate.format(geom.getCoordinates(),
                '{y}, {x}', 2);
            } else {
              scope.coord = ol.coordinate.format(geom.getCoordinates(),
                '{x}, {y}', 2);
            }
          } else {
            // INGRID: Add check 'useGeodesic'
            scope.distance = gaMeasure.getLength(geom,
              gaGlobalOptions.useGeodesic);
            scope.surface = gaMeasure.getArea(geom, undefined,
              gaGlobalOptions.useGeodesic);
            // scope.azimuth = gaMeasure.getAzimuth(geom);
          }
        };
        var useFeature = function(newFeature) {
          if (deregisterKey) {
            ol.Observable.unByKey(deregisterKey);
            deregisterKey = undefined;
          }
          if (newFeature) {
            deregisterKey = newFeature.on('change', function(evt) {
              scope.$applyAsync(function() {
                update(evt.target);
              });
            });
            update(newFeature);
          }
        };
        scope.$watch('feature', useFeature);
      }
    };
  });
})();
