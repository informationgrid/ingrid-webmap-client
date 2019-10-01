goog.provide('ga_wms_service');

goog.require('ga_definepropertiesforlayer_service');
goog.require('ga_layers_service');
goog.require('ga_maputils_service');
goog.require('ga_tilegrid_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_wms_service', [
    'ga_definepropertiesforlayer_service',
    'pascalprecht.translate',
    'ga_layers_service',
    'ga_maputils_service',
    'ga_urlutils_service',
    'ga_translation_service',
    'ga_tilegrid_service'
  ]);

  /**
   * Manage external WMS layers
   */
  module.provider('gaWms', function() {
    // INGRID: Add parameter '$http', '$translate'
    this.$get = function(gaDefinePropertiesForLayer, gaMapUtils, gaUrlUtils,
        gaGlobalOptions, $q, gaLang, gaLayers, gaTileGrid, $http, $translate) {

      // Default subdomains for external WMS
      var DFLT_SUBDOMAINS = ['', '0', '1', '2', '3', '4'];

      var getCesiumImageryProvider = function(layer, subdomains) {
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

        if (wmsParams.version === '1.1.1') {
          wmsParams.srs = wmsParams.crs;
          delete wmsParams.crs;
          wmsParams.bbox = '{westProjected},{southProjected},' +
                           '{eastProjected},{northProjected}';
        }

        var extent = gaGlobalOptions.defaultExtent;
        return new Cesium.UrlTemplateImageryProvider({
          minimumRetrievingLevel: gaGlobalOptions.minimumRetrievingLevel,
          url: new Cesium.Resource({
            url: gaUrlUtils.append(layer.url, gaUrlUtils.toKeyValue(wmsParams)),
            proxy: gaUrlUtils.getCesiumProxy()
          }),
          rectangle: gaMapUtils.extentToRectangle(extent),
          tilingScheme: new Cesium.GeographicTilingScheme(),
          hasAlphaChannel: true,
          availableLevels: gaGlobalOptions.imageryAvailableLevels,
          metadataUrl: gaGlobalOptions.imageryMetadataUrl,
          subdomains: gaUrlUtils.parseSubdomainsTpl(layer.url) ||
              DFLT_SUBDOMAINS
        });
      };

      var Wms = function() {

        // Test WMS 1.1.1 with  https://wms.geo.bs.ch/wmsBS
        var createWmsLayer = function(params, options, index) {
          options = options || {};

          // We get the gutter and the tileGridMinRes from the layersConfig
          // if possible.
          var tileGridMinRes;
          var config = gaLayers.getLayer(params.LAYERS);
          if (config) {
            if (config.gutter) {
              options.gutter = config.gutter;
            }

            tileGridMinRes = config.tileGridMinRes;
            if (config.resolutions) {
              tileGridMinRes = config.resolutions.slice(-1)[0];
            }
          }

          // INGRID: Encode label
          options.id = 'WMS||' + encodeURIComponent(options.label) + '||' +
              options.url + '||' + params.LAYERS;

          // If the WMS has a version specified, we add it in
          // the id. It's important that the layer keeps the same id as the
          // one in the url otherwise it breaks the asynchronous reordering of
          // layers.
          if (params.VERSION) {
            options.id += '||' + params.VERSION;

            // INGRID: Add queryable
            if (options.queryable) {
              options.id += '||' + options.queryable;
            } else {
              options.id += '||false';
            }

            if (options.useReprojection) {
              options.projection = 'EPSG:4326';
              options.id += '||true';
            } else {
              options.id += '||false';
            }

            if (options.attribution) {
              options.id += '||' + encodeURIComponent(options.attribution);
            } else {
              options.id += '||';
            }

            if (options.attributionUrl) {
              options.id += '||' + options.attributionUrl;
            }
          } else {
            // Set the default wms version
            params.VERSION = '1.3.0';
          }

          // If the url contains a template for subdomains we display the layer
          // as tiled WMS.
          var urls = gaUrlUtils.getMultidomainsUrls(options.url,
              DFLT_SUBDOMAINS);
          var SourceClass = ol.source.ImageWMS;
          var LayerClass = ol.layer.Image;
          var tileGrid;

          if (urls.length > 1) {
            SourceClass = ol.source.TileWMS;
            LayerClass = ol.layer.Tile;
            tileGrid = gaTileGrid.get(tileGridMinRes, 'wms');
          }

          var source = new SourceClass({
            params: params,
            url: urls[0],
            urls: urls,
            gutter: options.gutter || 0,
            ratio: options.ratio || 1,
            projection: options.projection,
            tileGrid: tileGrid
          });

          var layer = new LayerClass({
            id: options.id,
            url: options.url,
            opacity: options.opacity,
            visible: options.visible,
            attribution: options.attribution,
            extent: options.extent,
            // INGRID: Add attributionUrl
            attributionUrl: options.attributionUrl,
            // INGRID: Add queryable
            queryable: !!(options.queryable === true ||
              options.queryable === 'true' ||
              options.queryable === '1'),
            // INGRID: Add minScale
            minScale: options.minScale,
            // INGRID: Add maxScale
            maxScale: options.maxScale,
            source: source,
            transition: 0
          });
          gaDefinePropertiesForLayer(layer);
          // INGRID: Set visible
          if (options.visible !== undefined) {
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
          if (layer) {
            if (layer.Layer) {
              if (!layer.Layer.length) {
                var tmpLayers = [];
                tmpLayers.push(layer.Layer);
                layer.Layer = tmpLayers;
              }
              for (var i = 0; i < layer.Layer.length; i++) {
                var tmpLayer = layer.Layer[i];

                // INGRID: Check parents 'SRS' or 'CRS'
                if (tmpLayer['SRS']) {
                  if (tmpLayer['SRS'] instanceof Array) {
                    tmpLayer['SRS'] = tmpLayer['SRS'].concat(layer['SRS'].
                        filter(function(item) {
                          return tmpLayer['SRS'].indexOf(item) < 0;
                        }));
                  } else {
                    if (layer['SRS'].indexOf(tmpLayer['SRS']) === -1) {
                      tmpLayer['SRS'] = layer['SRS'].concat(tmpLayer['SRS']);
                    }
                  }
                } else if (tmpLayer['CRS']) {
                  tmpLayer['CRS'] = layer['CRS'].concat(tmpLayer['CRS'].
                      filter(function(item) {
                        return layer['CRS'].indexOf(item) < 0;
                      }));
                } else if (wmsVersion === '1.1.1') {
                  tmpLayer['SRS'] = layer['SRS'];
                } else if (wmsVersion === '1.3.0') {
                  tmpLayer['CRS'] = layer['CRS'];
                }

                // INGRID: Check parents 'BoundingBox'
                if (!tmpLayer['BoundingBox']) {
                  if (layer['BoundingBox']) {
                    tmpLayer['BoundingBox'] = layer['BoundingBox'];
                  }
                }

                // INGRID: Check parents 'LatLonBoundingBox'
                if (!tmpLayer['LatLonBoundingBox']) {
                  if (layer['LatLonBoundingBox']) {
                    tmpLayer['LatLonBoundingBox'] = layer['LatLonBoundingBox'];
                  }
                }

                // INGRID: Check parents 'extent'
                if (!tmpLayer['extent']) {
                  if (layer['extent']) {
                    tmpLayer['extent'] = layer['extent'];
                  }
                }

                // INGRID: Check parent 'queryable'
                if (!tmpLayer['queryable']) {
                  if (layer['queryable']) {
                    tmpLayer['queryable'] = layer['queryable'];
                  }
                }

                if (tmpLayer.Name) {
                  layers.splice(0, 0, tmpLayer);
                }
                if (tmpLayer.Layer) {
                  getChildLayers(layers, tmpLayer, map, wmsVersion);
                }
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
          var minScale = null;
          var maxScale = null;
          if (getCapLayer.ScaleHint) {
            minScale = getCapLayer.ScaleHint.min;
            maxScale = getCapLayer.ScaleHint.max;
          }
          if (getCapLayer.MinScaleDenominator) {
            minScale = getCapLayer.MinScaleDenominator;
          }

          if (getCapLayer.MaxScaleDenominator) {
            maxScale = getCapLayer.MaxScaleDenominator;
          }

          var wmsOptions = {
            url: getCapLayer.wmsUrl,
            label: getCapLayer.Title,
            // INGRID: Remove function 'gaMapUtils.intersectWithDefaultExtent'
            extent: getCapLayer.extent,
            // INGRID: Add queryable
            queryable: !!(getCapLayer.queryable === true ||
              getCapLayer.queryable === 'true' ||
              getCapLayer.queryable === '1'),
            // INGRID: Add minScale
            minScale: minScale,
            // INGRID: Add maxScale
            maxScale: maxScale,
            // INGRID: Add attributions
            attribution: getCapLayer.attribution,
            attributionUrl: getCapLayer.attributionUrl,
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
          var proxyUrl = gaGlobalOptions.proxyUrl +
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
              if (capSplitParam.indexOf('request') === -1 &&
                      capSplitParam.indexOf('service') === -1 &&
                      capSplitParam.indexOf('version') === -1) {
                capParams = capParams + '&' + capSplitParam;
              }
            }
          }

          // Angularjs doesn't handle onprogress event
          $http.get(proxyUrl, {identifier: identifier,
            index: index,
            cap:
              cap + '' + capParams}).
              then(function(response) {
                try {
                  var config = response.config;
                  var data = response.data;
                  var result = data.WMT_MS_Capabilities ||
                  data.WMS_Capabilities;
                  var version = result.version;
                  var val;
                  if (version === '1.3.0') {
                    val = new ol.format.WMSCapabilities().
                        read(data.xmlResponse);
                  } else {
                    val = result;
                  }
                  if (val.Capability) {
                    if (val.Capability.Layer) {
                      var layers = [];
                      var tmpLayer = val.Capability.Layer;

                      // INGRID: Add layer
                      if (tmpLayer.Name) {
                        layers.splice(0, 0, tmpLayer);
                      }

                      // INGRID: Add child layers
                      if (tmpLayer.Layer) {
                        getChildLayers(layers, tmpLayer, map, version);
                      }

                      // INGRID: Check layers params
                      if (layers) {
                        var hasAddService = false;
                        for (var i = 0; i < layers.length; i++) {
                          var layer = layers[i];
                          var visible = false;
                          if (config.identifier) {
                            if (layer.Identifier) {
                              var identifier = layer.Identifier.content ||
                              layer.Identifier;
                              if (identifier === config.identifier) {
                                visible = true;
                              }
                            }
                          }

                          // INGRID: Get 'extent'
                          var extent;
                          var wgs84 = 'EPSG:4326';
                          var projCode = gaGlobalOptions.defaultEpsg;
                          if (layer.BoundingBox) {
                            for (var j = 0, jj = layer.BoundingBox.length;
                              j < jj; j++) {
                              var bbox = layer.BoundingBox[j];
                              var code;
                              // INGRID: Check extent for WMS version 1.1.1
                              // and 1.3.0
                              if (bbox.extent && bbox.crs) {
                                code = bbox.crs;
                                if (code && code.toUpperCase() === projCode.
                                    toUpperCase()) {
                                  extent = bbox.extent;
                                }
                              } else {
                                code = bbox.CRS || bbox.SRS;
                                if (code && code.toUpperCase() === projCode.
                                    toUpperCase()) {
                                  extent = [
                                    parseFloat(bbox.minx),
                                    parseFloat(bbox.miny),
                                    parseFloat(bbox.maxx),
                                    parseFloat(bbox.maxy)
                                  ];
                                }
                              }
                              code = bbox.crs || bbox.srs;
                              if (code && code.toUpperCase() === projCode.
                                  toUpperCase()) {
                                extent = bbox.extent;
                              }
                            }
                          }

                          if (!extent) {
                            var wgs84Extent = layer.EX_GeographicBoundingBox ||
                                layer.LatLonBoundingBox;
                            if (wgs84Extent) {
                              // INGRID: Add 'extent'
                              extent = layer.EX_GeographicBoundingBox ||
                                [
                                  parseFloat(wgs84Extent.minx),
                                  parseFloat(wgs84Extent.miny),
                                  parseFloat(wgs84Extent.maxx),
                                  parseFloat(wgs84Extent.maxy)
                                ];
                              // INGRID: Change 'layerWgs84Extent' to 'extent'
                              if (extent) {
                                extent = ol.proj.transformExtent(extent,
                                    wgs84, projCode);
                              }
                            }
                          }

                          // INGRID: Get 'SRS'
                          var minScale, maxScale;
                          if (layer.ScaleHint) {
                            minScale = layer.ScaleHint.min;
                            maxScale = layer.ScaleHint.max;
                          }
                          if (layer.MinScaleDenominator) {
                            minScale = layer.MinScaleDenominator;
                          }

                          if (layer.MaxScaleDenominator) {
                            maxScale = layer.MaxScaleDenominator;
                          }

                          var layerParams = {
                            LAYERS: layer.Name,
                            VERSION: version
                          };

                          // INGRID: Use GetMap instead of GetCapabilities-URL
                          var getMapUrl;
                          var dcpType = val.Capability.Request.GetMap.DCPType;
                          if (dcpType instanceof Array) {
                            getMapUrl = dcpType[0].HTTP.Get.OnlineResource;
                          } else {
                            getMapUrl = dcpType.HTTP.Get.
                                OnlineResource['xlink:href'];
                          }
                          if (getMapUrl) {
                            config.cap = getMapUrl;
                          }

                          var layerOptions = {
                            url: config.cap,
                            label: layer.Title,
                            opacity: 1,
                            visible: visible,
                            // INGRID: Add queryable
                            queryable: !!(layer.queryable === true ||
                            layer.queryable === 'true' ||
                            layer.queryable === '1'),
                            extent: extent,
                            minScale: minScale,
                            maxScale: maxScale
                          };

                          // INGRID: Create WMS layers
                          var olLayer = createWmsLayer(layerParams,
                              layerOptions);
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
          if (url === undefined) {
            if (layer.getSource()) {
              if (layer.getSource().getUrl) {
                url = layer.getSource().getUrl();
              } else if (layer.getSource().urls) {
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
        this.getLegendURL = function(layer, paramLayer) {
          var params = layer.getSource().getParams();
          // INGRID: Get legend for all layer (intern and extern)
          var url = layer.url;
          if (url === undefined) {
            if (layer.getSource()) {
              if (layer.getSource().getUrl) {
                url = layer.getSource().getUrl();
              } else if (layer.getSource().urls) {
                if (layer.getSource().urls.length > 0) {
                  url = layer.getSource().urls[0];
                }
              }
            }
          }
          return gaUrlUtils.append(url, gaUrlUtils.toKeyValue({
            request: 'GetLegendGraphic',
            layer: paramLayer || params.LAYERS,
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
