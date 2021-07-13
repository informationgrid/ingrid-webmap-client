goog.provide('ga_wmsgetcap_directive');

goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_wmsgetcap_directive', [
    'pascalprecht.translate',
    'ga_urlutils_service'
  ]);

  // INGRID: Add 'gaPopup'
  module.directive('gaWmsGetCap', function($window, $translate, gaUrlUtils,
      gaPopup) {

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
        return ol.proj.transformExtent(extent, wgs84, projCode);
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

        // INGRID: Add attribution values
        var service = getCap.Service;
        if (service) {
          if (service.ContactInformation) {
            var servConInfo = service.ContactInformation;
            if (servConInfo.ContactPersonPrimary) {
              var servConInfoPerson = servConInfo.ContactPersonPrimary;
              if (servConInfoPerson.ContactOrganization) {
                layer.attribution = servConInfoPerson.ContactOrganization;
              }
            }
          }
          if (service.OnlineResource) {
            if (getCap.version === '1.1.1') {
              layer.attributionUrl = service.OnlineResource['xlink:href'];
            } else {
              layer.attributionUrl = service.OnlineResource;
            }
          }
        }

        // INGRID: inheritance of parent layer params
        if (parentLayer) {
          // INGRID: Check parents 'SRS' or 'CRS'
          var parentProjList = parentLayer.CRS || parentLayer.SRS ||
            parentLayer;
          if (parentProjList instanceof Array) {
            if (layer.SRS) {
              if (layer.SRS instanceof Array) {
                layer.SRS = layer.SRS.concat(parentProjList.
                    filter(function(item) {
                      return layer.SRS.indexOf(item) < 0;
                    })
                );
              } else {
                if (parentProjList.indexOf(layer.SRS) === -1) {
                  layer.SRS = parentProjList.concat(layer.SRS);
                }
              }
            } else if (layer.CRS) {
              layer.CRS = parentProjList.concat(layer.CRS.
                  filter(function(item) {
                    return parentProjList.indexOf(item) < 0;
                  })
              );
            } else if (layer.wmsVersion === '1.1.1') {
              layer.SRS = parentProjList;
            } else if (layer.wmsVersion === '1.3.0') {
              layer.CRS = parentProjList;
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
        // INGRID: Add parent param
        if (!layer.Layer.length) {
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
              // INGRID: Add 'importExtLayerIdent'
              if (scope.options.importExtLayerIdent) {
                var hasAddWMSByIdent = scope.addLayerByIdent(scope.layers,
                    scope.options.importExtLayerIdent);
                scope.options.rejectImport(hasAddWMSByIdent);
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
            // INGRID: Add popup
            var popup = gaPopup.create({
              title: $translate.instant('add_layer'),
              destroyOnClose: true,
              showReduce: false,
              content: msg,
              className: 'popup-front',
              x: 400,
              y: 200
            });
            popup.open(5000);
          }
        };

        // INGRID: Add all layers b< ident to the map
        scope.addLayerByIdent = function(layers, ident) {
          if (layers && scope.options.getOlLayerFromGetCapLayer) {
            var msg = $translate.instant('add_wms_layer_ident_succeeded');
            var hasAddLayer = false;
            if (ident) {
              try {
                for (var i = layers.length - 1; i >= 0; i--) {
                  var getCapLay = layers[i];
                  if (getCapLay.Identifier &&
                      getCapLay.Identifier.length > 0) {
                    var layerIdent = getCapLay.Identifier[0] ||
                    getCapLay.Identifier;
                    if (ident.indexOf(layerIdent) > -1) {
                      var olLayer = scope.options.
                          getOlLayerFromGetCapLayer(layers[i]);
                      if (olLayer) {
                        scope.map.addLayer(olLayer);
                        hasAddLayer = true;
                        if (layers.length - i < 10) {
                          msg += '<br>' + olLayer.label;
                        } else if (layers.length - i < 11) {
                          msg += '<br> ...';
                        }
                      }
                    }
                  }
                  if (getCapLay.Layer) {
                    scope.addLayerByIdent(getCapLay.Layer, ident);
                  }
                }
              } catch (e) {
                $window.console.error('Add layer failed:' + e);
                msg = $translate.instant('add_wms_layer_failed') + e.message;
              }
            }
            if (!hasAddLayer) {
              msg = $translate.instant('add_wms_layer_ident_empty');
            }
            msg = msg.replaceAll('{SERVICE}', scope.options.importExtService);
            if (ident.startsWith('http')) {
              msg = msg.replace('{IDENTIFIER}', '<a target="_blank" href="' +
                ident + '">' + ident + '</a>');
            } else {
              msg = msg.replace('{IDENTIFIER}', '<b>' + ident + '</b>');
            }
            // INGRID: Add popup
            var popup = gaPopup.create({
              title: $translate.instant('add_layer'),
              destroyOnClose: true,
              showReduce: false,
              content: msg,
              className: 'popup-front',
              x: 400,
              y: 200
            });
            popup.open(10000);

            return hasAddLayer;
          }
        };

        // INGRID: Add all layers to the map
        scope.addLayersAll = function() {
          var layersAll = scope.layers;
          if (layersAll && layersAll.length > 0 &&
            scope.options.getOlLayerFromGetCapLayer) {
            var msg = $translate.instant('add_wms_layers_succeeded');
            try {
              scope.addLayerList(layersAll,
                  scope.options.getOlLayerFromGetCapLayer);
            } catch (e) {
              $window.console.error('Add layer failed:' + e);
              msg = $translate.instant('add_wms_layer_failed') + e.message;
            }
            var popup = gaPopup.create({
              title: $translate.instant('add_all_layers'),
              destroyOnClose: true,
              showReduce: false,
              content: msg,
              className: 'popup-front',
              x: 400,
              y: 200
            });
            popup.open(5000);
          }
        };

        // INGRID: Add all layers to the map
        scope.addLayerList = function(layers, getOlLayerFromGetCapLayer) {
          layers.slice().reverse().forEach(function(getCapLay) {
            var olLayer = getOlLayerFromGetCapLayer(getCapLay);
            if (getCapLay.Layer) {
              scope.addLayerList(getCapLay.Layer, getOlLayerFromGetCapLayer);
            }
            if (olLayer) {
              scope.map.addLayer(olLayer);
            }
          });
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
