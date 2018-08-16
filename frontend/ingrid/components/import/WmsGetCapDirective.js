goog.provide('ga_wmsgetcap_directive');

goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_wmsgetcap_directive', [
    'pascalprecht.translate',
    'ga_urlutils_service'
  ]);

  module.directive('gaWmsGetCap', function($window, $translate, gaUrlUtils) {

    // Get the layer extent defines in the GetCapabilities
    var getLayerExtentFromGetCap = function(getCapLayer, proj) {
      var wgs84 = 'EPSG:4326';
      var layer = getCapLayer;
      var projCode = proj.getCode();

      if (layer.BoundingBox) {
        for (var i = 0, ii = layer.BoundingBox.length; i < ii; i++) {
          var bbox = layer.BoundingBox[i];
          var code;
          // INGRID: Check extent for WMS version 1.1.1 and 1.3.0
          if (bbox.extent && bbox.crs) {
            code = bbox.crs;
            if (code && code.toUpperCase() === projCode.toUpperCase()) {
              return bbox.extent;
            }
          } else {
            code = bbox.CRS || bbox.SRS;
            if (code && code.toUpperCase() === projCode.toUpperCase()) {
              return [parseFloat(bbox.minx), parseFloat(bbox.miny),
                parseFloat(bbox.maxx), parseFloat(bbox.maxy)];
            }
          }
          code = bbox.crs || bbox.srs;
          if (code && code.toUpperCase() === projCode.toUpperCase()) {
            return bbox.extent;
          }
        }
      }

      var wgs84Extent = layer.EX_GeographicBoundingBox ||
          layer.LatLonBoundingBox;
      if (wgs84Extent) {
        // INGRID: Add 'extent'
        var extent = layer.EX_GeographicBoundingBox ||
          [
            parseFloat(wgs84Extent.minx),
            parseFloat(wgs84Extent.miny),
            parseFloat(wgs84Extent.maxx),
            parseFloat(wgs84Extent.maxy)
          ];
        // If only an extent in wgs 84 is available, we use the
        // intersection between proj extent and layer extent as the new
        // layer extent. We compare extients in wgs 84 to avoid
        // transformations errors of large wgs 84 extent like
        // (-180,-90,180,90)
        /* INGRID: Not in use
        var projWgs84Extent = ol.proj.transformExtent(proj.getExtent(),
            projCode, wgs84);
        var layerWgs84Extent = ol.extent.getIntersection(projWgs84Extent,
            wgs84Extent);
        */
        // INGRID: Change 'layerWgs84Extent' to 'extent'
        if (extent) {
          return ol.proj.transformExtent(extent, wgs84, projCode);
        }
      }
    };

    // Test if the layer can be displayed with a specific projection
    var canUseProj = function(layer, projCode) {
      var projCodeList = layer.CRS || layer.SRS || [];
      return projCodeList.indexOf(projCode.toUpperCase()) !== -1 ||
          projCodeList.indexOf(projCode.toLowerCase()) !== -1;
    };

    // Go through all layers, assign needed properties,
    // and remove useless layers (no name or bad crs without children
    // or no intersection between map extent and layer extent)
    // INGRID: Add parentLayer param
    var getChildLayers = function(getCap, layer, proj, parentLayer) {

      // If the WMS layer has no name, it can't be displayed
      if (!layer.Name) {
        layer.isInvalid = true;
        layer.Abstract = $translate.instant('layer_invalid_no_name');
      }

      if (!layer.isInvalid) {
        // INGRID: Edit check wmsUrl
        var dcpType = getCap.Capability.Request.GetMap.DCPType;
        if (dcpType instanceof Array) {
          layer.wmsUrl = dcpType[0].HTTP.Get.OnlineResource;
        } else {
          layer.wmsUrl = dcpType.HTTP.Get.OnlineResource['xlink:href'];
        }
        layer.wmsVersion = getCap.version;
        layer.id = 'WMS||' + layer.wmsUrl + '||' + layer.Name;
        layer.extent = getLayerExtentFromGetCap(layer, proj);

        // INGRID: inheritance of parent layer params
        if (parentLayer) {
          // INGRID: Check parents 'SRS' or 'CRS'
          var parentProjList = parentLayer.CRS || parentLayer.SRS ||
            parentLayer;
          if (parentProjList) {
            if (parentProjList instanceof Array) {
              if (layer.SRS) {
                if (layer.SRS instanceof Array) {
                  layer.SRS = layer.SRS.concat(parentProjList
                    .filter(function (item) {
                      return layer.SRS.indexOf(item) < 0;
                    })
                  );
                } else {
                  if(parentProjList.indexOf(layer.SRS) === -1){
                    layer.SRS = parentProjList.concat(layer.SRS);
                  }
                }
              } else if (layer.CRS) {
                layer.CRS = parentProjList.concat(layer.CRS
                  .filter(function (item) {
                    return parentProjList.indexOf(item) < 0;
                  })
                );
              } else if (layer.wmsVersion === '1.1.1') {
                layer.SRS = parentProjList; 
              } else if (layer.wmsVersion === '1.3.0') {
                layer.CRS = parentProjList;
              }
            }
          }

          // INGRID: Check parents 'BoundingBox'
          if (!layer.BoundingBox) {
            if (parentLayer.BoundingBox) {
              layer.BoundingBox = parentLayer.BoundingBox;
            }
          }

          // INGRID: Check parents 'LatLonBoundingBox'
          if (!layer.LatLonBoundingBox) {
            if (parentLayer.LatLonBoundingBox) {
              layer.LatLonBoundingBox = parentLayer.LatLonBoundingBox;
            }
          }

          // INGRID: Check parents 'extent'
          if (!layer.extent) {
            if (parentLayer.extent) {
              layer.extent = parentLayer.extent;
            }
          }
        
          // INGRID: Check parent 'queryable'
          if (!layer.queryable) {
            if (parentLayer.queryable) {
              layer.queryable = parentLayer.queryable;
            }
          }
        }

        // if the layer has no extent, it is set as invalid.
        // We don't have proj codes list for wms 1.1.1 so we assume the
        // layer can be displayed (wait for
        // https://github.com/openlayers/ol3/pull/2944)
        var projCode = proj.getCode();
        if (getCap.version === '1.3.0' && !canUseProj(layer, projCode)) {
          layer.useReprojection = true;

          if (!layer.extent) {
            layer.isInvalid = true;
            layer.Abstract = $translate.instant('layer_invalid_outside_map');
          }
        }
      }

      // Go through the child to get valid layers
      if (layer.Layer) {
        if(!layer.Layer.length) {
          var tmpLayers = [];
          tmpLayers.push(layer.Layer);
          layer.Layer = tmpLayers;
        }
        for (var i = 0; i < layer.Layer.length; i++) {
          // INGRID: Add parent param
          var parent = layer || parentLayer;
          var l = getChildLayers(getCap, layer.Layer[i], proj, parent);
          if (!l) {
            layer.Layer.splice(i, 1);
            i--;
          }
        }

        // No valid child
        if (!layer.Layer.length) {
          layer.Layer = undefined;
        }
      }

      if (layer.isInvalid && !layer.Layer) {
        return undefined;
      }

      return layer;
    };

    return {
      restrict: 'A',
      templateUrl: 'components/import/partials/wms-get-cap.html',
      scope: {
        'getCap': '=gaWmsGetCap',
        'map': '=gaWmsGetCapMap',
        'options': '=gaWmsGetCapOptions'
      },
      link: function(scope) {

        // List of layers available in the GetCapabilities.
        // The layerXXXX properties use layer objects from the parsing of
        // a  GetCapabilities file, not ol layer object.
        scope.layers = [];
        scope.options = scope.options || {};
        scope.$watch('getCap', function(val) {
          var err = void 0;
          try {
            /* INGRID: Read WMS version 1.1.1 as XML
            val = new ol.format.WMSCapabilities().read(val);
            // A wms GetCap never contains template url so if we want to use
            // template url for subdomains we need to force the value in the
            // GetCap.
            if (gaUrlUtils.hasSubdomainsTpl(scope.options.wmsGetCapUrl)) {
              val.Capability.Request.GetMap.DCPType[0].HTTP.Get.
                  OnlineResource = scope.options.wmsGetCapUrl;
            }
            */
            let capabilities = val.WMT_MS_Capabilities || val.WMS_Capabilities;
            if (capabilities) {
              let version = capabilities.version;
              if (version === '1.3.0') {
                val = new ol.format.WMSCapabilities().read(val.xmlResponse);
              } else {
                val = val.WMT_MS_Capabilities || val.WMS_Capabilities;
              }
            }
          } catch (e) {
            err = e;
          }

          if (err || !val) {
            $window.console.error('WMS GetCap parsing failed: ', err || val);
            scope.userMsg = $translate.instant('parsing_failed');
            return;
          }

          scope.limitations = '';
          scope.layers = [];
          scope.options.layerSelected = null; // the layer selected on click
          scope.options.layerHovered = null;

          if (val && val.Service && val.Capability) {
            if (val.Service.MaxWidth) {
              scope.limitations =
                  $translate.instant('wms_max_size_allowed') + ' ' +
                  val.Service.MaxWidth + ' * ' +
                  val.Service.MaxHeight;
            }

            if (val.Capability.Layer) {
              var root = getChildLayers(val, val.Capability.Layer,
                  scope.map.getView().getProjection());
              if (root) {
                scope.layers = root.Layer || [root];
              }
            }
          }
        });

        // Add the selected layer to the map
        scope.addLayerSelected = function() {
          var getCapLay = scope.options.layerSelected;
          if (getCapLay && scope.options.getOlLayerFromGetCapLayer) {
            var msg = $translate.instant('add_wms_layer_succeeded');
            try {
              var olLayer = scope.options.getOlLayerFromGetCapLayer(getCapLay);
              if (olLayer) {
                scope.map.addLayer(olLayer);
              }
            } catch (e) {
              $window.console.error('Add layer failed:' + e);
              msg = $translate.instant('add_wms_layer_failed') + e.message;
            }
            $window.alert(msg);
          }
        };

        // Get the abstract to display in the text area
        scope.getAbstract = function() {
          var l = scope.options.layerSelected || scope.options.layerHovered ||
              {};
          return l.Abstract || '';
        };
      }
    };
  });
})();
