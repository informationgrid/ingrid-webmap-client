goog.provide('ga_attribution_directive');

goog.require('ga_attribution_service');
goog.require('ga_debounce_service');
goog.require('ga_event_service');

(function() {

  var module = angular.module('ga_attribution_directive', [
    'ga_attribution_service',
    'ga_event_service',
    'ga_debounce_service'
  ]);

  // INGRID: Add 'gaPermalink', 'gaGlobalOptions'
  module.directive('gaAttribution', function($translate, $window,
      gaAttribution, $rootScope, gaDebounce, gaEvent, gaPermalink,
      gaGlobalOptions) {
    return {
      restrict: 'A',
      scope: {
        map: '=gaAttributionMap',
        ol3d: '=gaAttributionOl3d'
      },
      link: function(scope, element, attrs) {

        // Display the third party data tooltip, only on mouse events
        var tooltipOptions = {
          trigger: 'manual',
          selector: '.ga-warning-tooltip',
          title: function() {
            return $translate.instant('external_data_tooltip');
          },
          template:
            '<div class="tooltip ga-red-tooltip" role="tooltip">' +
              '<div class="tooltip-arrow"></div>' +
              '<div class="tooltip-inner"></div>' +
            '</div>'
        };

        gaEvent.onMouseOverOut(element, function(evt) {
          var link = $(evt.target);
          if (!link.data('bs.tooltip')) {
            link.tooltip(tooltipOptions);
          }
          link.tooltip('show');
        }, function(evt) {
          $(evt.target).tooltip('hide');
        }, tooltipOptions.selector);

        // Display the third party data alert msg
        element.on('click', '.ga-warning-tooltip', function(evt) {
          if(!$window.confirm($translate.instant('external_data_warning').
              replace('--URL--', $(evt.target).text()))) {
            $window.event.stopPropagation();
            $window.event.preventDefault();
          }
          $(evt.target).tooltip('hide');
        });

        var update = function(element, layers) {
          var attrs = {}, list = [], is3dActive = scope.is3dActive();
          if (is3dActive) {
            var tmp = [scope.ol3d.getCesiumScene().terrainProvider];
            Array.prototype.push.apply(tmp, layers);
            layers = tmp;
          }

          // INGRID: Add copyright for OSM layer
          if (gaPermalink.getParams().bgLayer) {
            if (gaPermalink.getParams().bgLayer === 'osmLayer') {
              list.push('<a target="new" href="http://www.openstreet' +
                    'map.org/copyright">OpenStreetMap contributors</a>');
            }
          }
          // INGRID: Add if
          if (layers) {
            var replacements = gaGlobalOptions.defaultDataOwnerReplacements;
            layers.forEach(function(layer) {
              var key = gaAttribution.getTextFromLayer(layer, is3dActive);
              if (!attrs[key]) {
                var attrib = gaAttribution.getHtmlFromLayer(layer, is3dActive);
                if (attrib) {
                  attrs[key] = attrib;
                  // if a replacement for the link description exists in the
                  // options, apply it here
                  if (replacements[key]) {
                    // append '</a>' as a quick fix to replace the key
                    // in the link description, not in the link itself
                    attrs[key] = attrib.replace(key + '</a>',
                        replacements[key][0] + '</a>');
                  }
                  list.push(attrs[key]);
                }
              }
            });
          }
          var text = ' ' + list.join(', ');
          element.html(text ? $translate.instant('copyright_data') + text :
            '');
        };
        var updateDebounced = gaDebounce.debounce(update, 133, false);

        // Watch layers with an attribution from 2d map
        var layersFiltered;
        scope.layers = scope.map.getLayers().getArray();
        scope.layerFilter = function(layer) {
          return (layer.background || layer.preview ||
            layer.displayInLayerManager) && layer.visible;
        };

        scope.$watchCollection('layers | filter:layerFilter', function(layers) {
          if (!layersFiltered && !layers.length) {
            return;
          }
          layersFiltered = layers;
          updateDebounced(element, layers);
        });

        $rootScope.$on('gaLayersTranslationChange', function() {
          updateDebounced(element, layersFiltered);
        });

        // Watch layers with attribution from 3d globe
        scope.is3dActive = function() {
          return scope.ol3d && scope.ol3d.getEnabled();
        };
        scope.$watch('::ol3d', function(val) {
          if (val) {
            // Listen when the app switch between 2d/3d
            scope.$watch(function() {
              return scope.ol3d.getEnabled();
            }, function() {
              updateDebounced(element, layersFiltered);
            });
          }
        });
      }
    };
  });

  /**
   * ga-attribution-warning displays a warning about the data in 2.5d.
   */
  module.directive('gaAttributionWarning', function(gaDebounce) {

    var update = function(element, layers) {
      element.toggle(!!(layers && layers.length));
    };
    var updateDebounced = gaDebounce.debounce(update, 50, false);

    return {
      restrict: 'A',
      scope: {
        ol3d: '=gaAttributionWarningOl3d'
      },
      link: function(scope, element, attrs) {
        element.hide();
        var layersFiltered = [], dereg = [];
        scope.layerFilter = function(layer) {
          return !layer.background && (layer.preview ||
            layer.displayInLayerManager) && layer.visible;
        };

        // Activate/deactivate the directive
        var toggle = function(active) {
          if (active) {
            scope.layers = scope.ol3d.getOlMap().getLayers().getArray();
            dereg.push(scope.$watchCollection('layers | filter:layerFilter',
                function(layers) {
                  layersFiltered = layers;
                  updateDebounced(element, layers);
                }));
            updateDebounced(element, layersFiltered);
          } else {
            dereg.forEach(function(deregFunc) {
              deregFunc();
            });
            dereg = [];
            element.hide();
          }
        };

        scope.$watch('::ol3d', function(val) {
          if (val) {
            // Listen when the app switch between 2d/3d
            scope.$watch(function() {
              return scope.ol3d.getEnabled();
            }, toggle);
          }
        });
      }
    };
  });
})();
