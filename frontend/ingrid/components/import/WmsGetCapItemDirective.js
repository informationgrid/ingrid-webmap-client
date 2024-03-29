goog.provide('ga_wmsgetcapitem_directive');

(function() {

  var module = angular.module('ga_wmsgetcapitem_directive', []);

  module.controller('GaWmsGetCapItemDirectiveController', function($scope) {
    var options = $scope.options;

    // Add preview layer
    $scope.addPreviewLayer = function(evt, getCapLayer) {
      evt.stopPropagation();
      options.layerHovered = getCapLayer;
      if (getCapLayer.isInvalid) {
        return;
      }
      options.addPreviewLayer($scope.map, getCapLayer);
    };

    // Remove preview layer
    $scope.removePreviewLayer = function(evt) {
      evt.stopPropagation();
      options.layerHovered = null;
      options.removePreviewLayer($scope.map);
    };

    // Select the layer clicked
    $scope.toggleLayerSelected = function(evt, getCapLayer) {
      evt.stopPropagation();

      options.layerSelected = options.layerSelected &&
          options.layerSelected.Name === getCapLayer.Name ?
        null : getCapLayer;
    };
  });

  // INGRID: Add '$translate'
  module.directive('gaWmsGetCapItem', function($compile, $translate) {

    /** ** UTILS functions ****/
    // from OL2
    // TO FIX: utils function to get scale from an extent, should be
    // elsewhere?
    var getScaleFromExtent = function(view, extent, mapSize) {
      // Constants get from OpenLayers 2, see:
      // https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Util.js
      //
      // 39.37 INCHES_PER_UNIT
      // 72 DOTS_PER_INCH
      return view.getResolutionForExtent(extent, mapSize) * 39.37 * 72;
    };

    // INGRID: Add function getScaleForScaleHint
    var getScaleForScaleHint = function(view, scale) {
      var rad2 = Math.pow(2, 0.5);
      // var units = view.getProjection().getUnits();
      var ipm = 39.37;
      if (scale !== 0 && scale !== Infinity) {
        return parseFloat(
            ((scale / rad2) * ipm *
          72).toPrecision(13)
        );
      }
      return scale;
    };

    // Zoom to layer extent
    var zoomToLayerExtent = function(scope, layer, map) {
      var extent = layer.extent;
      if (scope.options.transformExtent) {
        extent = scope.options.transformExtent(layer.extent);
      }
      var view = map.getView();
      var mapSize = map.getSize();

      // INGRID: Get scale
      var scale = layer.MaxScaleDenominator;
      if (layer.ScaleHint) {
        scale = getScaleForScaleHint(view, layer.ScaleHint.max);
      }
      // Test this with this wms:
      // http://wms.vd.ch/public/services/VD_WMS/Mapserver/Wmsserver
      // If a minScale is defined
      // INGRID: use scale instead of 'layer.MaxScaleDenominator'
      if (scale && extent) {

        // We test if the layer extent specified in the
        // getCapabilities fit the minScale value.
        var layerExtentScale = getScaleFromExtent(view, extent, mapSize);

        if (layerExtentScale > scale) {
          var layerExtentCenter = ol.extent.getCenter(extent);
          var factor = layerExtentScale / scale;
          var width = ol.extent.getWidth(extent) / factor;
          var height = ol.extent.getHeight(extent) / factor;
          extent = [
            layerExtentCenter[0] - width / 2,
            layerExtentCenter[1] - height / 2,
            layerExtentCenter[0] + width / 2,
            layerExtentCenter[1] + height / 2
          ];
          extent = scope.options.transformExtent(extent);

          if (extent) {
            var res = view.constrainResolution(
                view.getResolutionForExtent(extent, mapSize), 0, -1);
            view.setCenter(layerExtentCenter);
            view.setResolution(res);
          }
          return;
        }
      }

      if (extent) {
        view.fit(extent, mapSize);
      }
    };

    return {
      restrict: 'A',
      templateUrl: 'components/import/partials/wms-get-cap-item.html',
      controller: 'GaWmsGetCapItemDirectiveController',
      compile: function(elt) {
        var contents = elt.contents().remove();
        var compiledContent;
        return function(scope, elt) {
          if (!compiledContent) {
            compiledContent = $compile(contents);
          }
          compiledContent(scope, function(clone, scope) {
            elt.append(clone);
          });

          var headerGroup = elt.find('> .ga-header-group');
          var toggleBt = headerGroup.find('.fa-plus');
          var childGroup;

          headerGroup.find('.fa-zoom-in').on('click', function(evt) {
            evt.stopPropagation();
            zoomToLayerExtent(scope, scope.layer, scope.map);
          });

          toggleBt.on('click', function(evt) {
            evt.stopPropagation();
            toggleBt.toggleClass('fa-minus');
            // INGRID: Add aria
            if (toggleBt.hasClass('fa-minus')) {
              toggleBt.attr('aria-pressed', true);
              toggleBt.attr('aria-expanded', true);
              toggleBt.attr('aria-label', $translate.
                  instant('fa_icon_layer_expanded'));
            } else {
              toggleBt.attr('aria-pressed', false);
              toggleBt.attr('aria-expanded', false);
              toggleBt.attr('aria-label', $translate.
                  instant('fa_icon_layer_unexpanded'));
            }
            if (!childGroup) {
              childGroup = elt.find('> .ga-child-group');
            }
            childGroup.slideToggle();
          });
        };
      }
    };
  });
})();
