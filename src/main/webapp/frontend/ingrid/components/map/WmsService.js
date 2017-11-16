goog.provide('ga_wms_service');

goog.require('ga_map_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_wms_service', [
    'pascalprecht.translate',
    'ga_map_service',
    'ga_urlutils_service',
    'ga_translation_service'
  ]);

  /**
   * Manage external WMS layers
   */
  module.provider('gaWms', function() {
    // INGRID: Add parameter '$http', '$translate'
    this.$get = function(gaDefinePropertiesForLayer, gaMapUtils, gaUrlUtils,
        gaGlobalOptions, $q, gaLang, $http, $translate) {

      var getCesiumImageryProvider = function(layer) {
        var params = layer.getSource().getParams();
        var wmsParams = {
          layers: params.LAYERS,
          format: params.FORMAT || 'image/png',
          service: 'WMS',
          version: params.VERSION || '1.3.0',
          request: 'GetMap',
          crs: 'EPSG:4326',
          bbox: '{southProjected},{westProjected},' +
                '{northProjected},{eastProjected}',
          width: '256',
          height: '256',
          styles: params.STYLES || '',
          transparent: 'true'
        };

        if (wmsParams.version == '1.1.1') {
          wmsParams.srs = wmsParams.crs;
          delete wmsParams.crs;
          wmsParams.bbox = '{westProjected},{southProjected},' +
                           '{eastProjected},{northProjected}';
        }

        var extent = gaGlobalOptions.defaultExtent;
        return new Cesium.UrlTemplateImageryProvider({
          minimumRetrievingLevel: window.minimumRetrievingLevel,
          url: gaUrlUtils.append(layer.url, gaUrlUtils.toKeyValue(wmsParams)),
          rectangle: gaMapUtils.extentToRectangle(extent),
          proxy: gaUrlUtils.getCesiumProxy(),
          tilingScheme: new Cesium.GeographicTilingScheme(),
          hasAlphaChannel: true,
          availableLevels: window.imageryAvailableLevels
        });

      };

      var Wms = function() {

        // Test WMS 1.1.1 with  https://wms.geo.bs.ch/wmsBS
        var createWmsLayer = function(params, options, index) {
          options = options || {};
          // INGRID: Encode label
          options.id = 'WMS||' + encodeURIComponent(options.label) + '||' +
            options.url + '||' + params.LAYERS;

          // If the WMS has a version specified, we add it in
          // the id. It's important that the layer keeps the same id as the
          // one in the url otherwise it breaks the asynchronous reordering of
          // layers.
          if (params.VERSION) {
            options.id += '||' + params.VERSION;

            if (options.useReprojection) {
              options.projection = 'EPSG:4326';
              options.id += '||true';
            }
          } else {
            // INGRID: Add empty version
            params.VERSION = '';
          }

          // INGRID: Add queryable
          if (options.queryable) {
            options.id += '||' + options.queryable;
          } else {
            options.id += '||';
          }

          var source = new ol.source.ImageWMS({
            params: params,
            url: options.url,
            ratio: options.ratio || 1,
            projection: options.projection
          });

          var layer = new ol.layer.Image({
            id: options.id,
            url: options.url,
            type: 'WMS',
            opacity: options.opacity,
            visible: options.visible,
            attribution: options.attribution,
            extent: options.extent,
            // INGRID: Add queryable
            queryable: options.queryable,
            // INGRID: Add minScale
            minScale: options.minScale,
            // INGRID: Add maxScale
            maxScale: options.maxScale,
            source: source
          });
          gaDefinePropertiesForLayer(layer);
          // INGRID: Set visible
          if (options.visible != undefined) {
              layer.visible = options.visible;
          }
          layer.preview = !!options.preview;
          layer.displayInLayerManager = !layer.preview;
          layer.useThirdPartyData = gaUrlUtils.isThirdPartyValid(options.url);
          layer.label = options.label;
          layer.getCesiumImageryProvider = function() {
            return getCesiumImageryProvider(layer);
          };
          return layer;
        };

        // INGRID: Add function to get layers
        var getChildLayers = function(layers, layer, map, wmsVersion) {
            // Go through the child to get valid layers
            if (layer.Layer) {
                if (layer.Layer.length) {
                    for (var i = 0; i < layer.Layer.length; i++) {
                        var tmpLayer = layer.Layer[i];
                        if (tmpLayer.Name) {
                            layers.splice(0, 0, tmpLayer);
                        }
                        if (tmpLayer.Layer) {
                            getChildLayers(layers, tmpLayer, map, wmsVersion);
                        }
                    }
                } else {
                    var tmpLayer = layer.Layer;
                    if (tmpLayer.Name) {
                        layers.splice(0, 0, tmpLayer);
                    }
                    if (tmpLayer.Layer) {
                        getChildLayers(layers, tmpLayer, map, wmsVersion);
                    }
                }
            }
        };

        // Create an ol WMS layer from GetCapabilities informations
        this.getOlLayerFromGetCapLayer = function(getCapLayer) {
          var wmsParams = {
            LAYERS: getCapLayer.Name,
            VERSION: getCapLayer.wmsVersion
          };

          // INGRID: Add scales
          var minScale;
          var maxScale;
          if (getCapLayer.ScaleHint) {
            minScale = getCapLayer.ScaleHint.min;
            maxScale = getCapLayer.ScaleHint.max;
          }
          if (getCapLayer.MinScaleDenominator) {
            minScale = getCapLayer.MinScaleDenominator;
          } else if (getCapLayer.MaxScaleDenominator) {
            maxScale = getCapLayer.MaxScaleDenominator;
          }

          var wmsOptions = {
            url: getCapLayer.wmsUrl,
            label: getCapLayer.Title,
            // INGRID: Remove function 'gaMapUtils.intersectWithDefaultExtent'
            extent: getCapLayer.extent,
            // INGRID: Add queryable
            queryable: getCapLayer.queryable,
            // INGRID: Add minScale
            minScale: minScale,
            // INGRID: Add maxScale
            maxScale: maxScale,
            useReprojection: getCapLayer.useReprojection
          };
          return createWmsLayer(wmsParams, wmsOptions);
        };

        // Create a WMS layer and add it to the map
        this.addWmsToMap = function(map, layerParams, layerOptions, index) {
          var olLayer = createWmsLayer(layerParams, layerOptions);
          if (index) {
            map.getLayers().insertAt(index, olLayer);
          } else {
            map.addLayer(olLayer);
          }
          return olLayer;
        };

        // INGRID: Add service and add it to map
        this.addWmsServiceToMap = function(map, service, identifier, index) {
            var cap = service;
            var proxyUrl = gaGlobalOptions.ogcproxyUrl +
              encodeURIComponent(cap) + '&toJson=true';

            // INGRID: Split host from params
            var capSplit = cap.split('?');
            var capParams = '?';
            cap = capSplit[0];
            if (capSplit.length > 0) {
                var capSplitParams = capSplit[1].split('&');
                for (var i = 0; i < capSplitParams.length; i++) {
                    var capSplitParam = capSplitParams[i].toLowerCase();
                    // INGRID: Check for needed parameters like 'ID'
                    if (capSplitParam.indexOf('request') == -1 &&
                      capSplitParam.indexOf('service') == -1 &&
                      capSplitParam.indexOf('version') == -1) {
                        capParams = capParams + '&' + capSplitParam;
                    }
                }
            }

            // Angularjs doesn't handle onprogress event
            $http.get(proxyUrl, {identifier: identifier, index: index, cap:
              cap + '' + capParams})
            .then(function(response) {
              try {
              var config = response.config;
              var data = response.data;
              var result = data.WMT_MS_Capabilities ||
                data.WMS_Capabilities;
              if (result.Capability) {
                if (result.Capability.Layer) {
                    var layers = [];
                    getChildLayers(layers, result.Capability.Layer,
                       map, result.version);
                      if (layers) {
                        var hasAddService = false;
                        for (var i = 0; i < layers.length; i++) {
                          var layer = layers[i];
                          var layerParams = {
                            LAYERS: layer.Name,
                            VERSION: result.version
                          };
                          var visible = false;
                          if (config.identifier) {
                            if (layer.Identifier) {
                                if (layer.Identifier.content) {
                                    if (layer.Identifier.content ==
                                      config.identifier) {
                                        visible = true;
                                    }
                                }
                            }
                          }
                          var extent = gaGlobalOptions.defaultExtent;
                          if (layer.EX_GeographicBoundingBox) {
                            var bbox = layer.EX_GeographicBoundingBox;
                            extent = [parseFloat(bbox.westBoundLongitude),
                              parseFloat(bbox.southBoundLatitude),
                              parseFloat(bbox.eastBoundLongitude),
                              parseFloat(bbox.northBoundLatitude)];
                          }else if (layer.LatLonBoundingBox) {
                            var bbox = layer.LatLonBoundingBox;
                            extent = [parseFloat(bbox.minx),
                              parseFloat(bbox.miny),
                              parseFloat(bbox.maxx),
                              parseFloat(bbox.maxy)];
                          }

                          var layerOptions = {
                            url: config.cap,
                            label: layer.Title,
                            opacity: 1,
                            visible: visible,
                            queryable: parseInt(layer.queryable) == 1 ? true :
                              false,
                            extent: ol.proj.transformExtent(extent,
                              'EPSG:4326', gaGlobalOptions.defaultEpsg)
                        };

                        var olLayer = createWmsLayer(layerParams, layerOptions);
                        olLayer.visible = visible;
                        if (config.index) {
                          map.getLayers().insertAt(config.index + i, olLayer);
                        } else {
                          map.addLayer(olLayer);
                        }
                        hasAddService = true;
                      }
                      if (hasAddService) {
                        alert('Dienst ' + config.cap + ' wurde hinzugefügt.');
                      }
                    }
                  }
                } else {
                  alert('Fehler beim Laden der URL ' + config.cap + '.');
                }
              } catch (e) {
                alert('Fehler beim Laden der URL ' + config.cap + '.');
              }
            }, function(response) {
                alert('Fehler beim Laden der URL ' + response.config.cap + '.');
            });
        };


        // Make a GetLegendGraphic request
        this.getLegend = function(layer) {
          var defer = $q.defer();
          var params = layer.getSource().getParams();
            // INGRID: Get legend for all layer (intern and extern)
            var url = layer.url;
            if (url == undefined) {
                if (layer.getSource()) {
                    if (layer.getSource().urls) {
                        if (layer.getSource().urls.length > 0) {
                            url = layer.getSource().urls[0];
                        }
                    }
                }
            }
            // INGRID: Change alt
            var html = '<img alt="' +
              $translate.instant('no_legend_available') + '" src="' +
              gaUrlUtils.append(layer.url, gaUrlUtils.toKeyValue({
            request: 'GetLegendGraphic',
            layer: params.LAYERS,
            style: params.STYLES || 'default',
            service: 'WMS',
            version: params.VERSION || '1.3.0',
            format: 'image/png',
            sld_version: '1.1.0',
            lang: gaLang.get()
          })) + '"></img>';
          defer.resolve({data: html});
          return defer.promise;
        };
        // INGRID: Add function to get the layer legend url
        this.getLegendURL = function(layer) {
            var params = layer.getSource().getParams();
            // INGRID: Get legend for all layer (intern and extern)
            var url = layer.url;
            if (url == undefined) {
                if (layer.getSource()) {
                    if (layer.getSource().urls) {
                        if (layer.getSource().urls.length > 0) {
                            url = layer.getSource().urls[0];
                        }
                    }
                }
            }
            return gaUrlUtils.append(url, gaUrlUtils.toKeyValue({
             request: 'GetLegendGraphic',
             layer: params.LAYERS,
             style: params.style || 'default',
             service: 'WMS',
             // INGRID: Add 'params.VERSION'
             version: params.version || params.VERSION || '1.3.0',
             format: 'image/png',
             sld_version: '1.1.0'
           }));
        };
      };
      return new Wms();
    };
  });
})();
