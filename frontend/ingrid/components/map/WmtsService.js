goog.provide('ga_wmts_service');

goog.require('ga_definepropertiesforlayer_service');
goog.require('ga_maputils_service');
goog.require('ga_translation_service');
goog.require('ga_urlutils_service');

(function() {

  var module = angular.module('ga_wmts_service', [
    'ga_definepropertiesforlayer_service',
    'ga_maputils_service',
    'ga_urlutils_service'
  ]);

  /**
   * Manage external WMTS layers
   */
  module.provider('gaWmts', function() {
    this.$get = function(gaDefinePropertiesForLayer, gaMapUtils, gaUrlUtils,
        gaGlobalOptions, $window, $http) {

      // Store getCapabilitites
      var store = {};
      var epsg4326 = ol.proj.get('EPSG:4326');
      var epsg3857 = ol.proj.get('EPSG:3857');
      var projSupported = [epsg4326, epsg3857];

      var getCesiumImageryProvider = function(layer) {
        if (!layer.displayIn3d) {
          return;
        }
        var source = layer.getSource();
        var proj = source.getProjection();
        var matrixSet = source.getMatrixSet();
        var matrixSetFound = false;
        var tilingScheme;

        var isGoodMatrixSet = function(sourceMatrixSet, sourceProj, proj3d) {

          if (ol.proj.equivalent(sourceProj, proj3d)) {
            matrixSet = sourceMatrixSet;
            tilingScheme = proj3d.getCode() === 'EPSG:4326' ?
              new Cesium.GeographicTilingScheme() :
              new Cesium.WebMercatorTilingScheme();
            return true;
          }
        };

        // Display in 3d only layers with a matrixSet compatible
        if (proj) {
          matrixSetFound = projSupported.some(function(p) {
            return isGoodMatrixSet(matrixSet, proj, p);
          });
        }
        if (!matrixSetFound && store[layer.url]) {
          matrixSetFound = projSupported.some(function(p) {
            var opt = ol.source.WMTS.optionsFromCapabilities(store[layer.url], {
              layer: source.getLayer(),
              projection: p
            });
            return isGoodMatrixSet(opt.matrixSet, opt.projection, p);
          });
        }

        if (!matrixSetFound) {
          layer.displayIn3d = false;
          return;
        }

        /* INGRID: Change to WebMapTileServiceImageryProvider
        var tpl = source.getUrls()[0];
        if (source.getRequestEncoding() === 'KVP') {
          tpl += 'service=WMTS&version=1.0.0&request=GetTile' +
              '&layer=' + source.getLayer() +
              '&format=' + source.getFormat() +
              '&style={Style}' +
              '&time={Time}' +
              '&tilematrixset={TileMatrixSet}' +
              '&tilematrix={TileMatrix}' +
              '&tilecol={TileCol}' +
              '&tilerow={TileRow}';
        }

        tpl = tpl.replace('{Style}', source.getStyle()).
            replace('{Time}', layer.time).
            replace('{TileMatrixSet}', matrixSet).
            replace('{TileMatrix}', '{z}').
            replace('{TileCol}', '{x}').
            replace('{TileRow}', '{y}');

        return new Cesium.UrlTemplateImageryProvider({
          minimumRetrievingLevel: gaGlobalOptions.minimumRetrievingLevel,
          url: new Cesium.Resource({
            url: tpl,
            proxy: gaUrlUtils.getCesiumProxy()
          }),
          rectangle: gaMapUtils.extentToRectangle(layer.getExtent()),
          tilingScheme: tilingScheme,
          hasAlphaChannel: !/jp/i.test(source.getFormat()),
          availableLevels: gaGlobalOptions.imageryAvailableLevels
        });
        */
        var provider = new Cesium.WebMapTileServiceImageryProvider({
          url: source.getUrls()[0],
          layer: source.getLayer(),
          style: source.getStyle(),
          format: source.getFormat(),
          tilingScheme: tilingScheme,
          tileMatrixSetID: matrixSet
        });
        return provider;
      };

      // Create an WMTS layer
      var createWmtsLayer = function(options) {
        // INGRID: Add dummy layer
        if (!options.sourceConfig) {
          var dummyLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
            })
          });
          gaDefinePropertiesForLayer(dummyLayer);
          dummyLayer.label = options.label;
          dummyLayer.useThirdPartyData = true;
          dummyLayer.opacity = options.opacity || 1;
          dummyLayer.visible = options.visible;
          dummyLayer.id = options.id;
          dummyLayer.isSecure = options.isSecure;
          return dummyLayer;
        }

        options.sourceConfig.transition = 0;

        var tileLoadFunction = function(id) {
          return function(imageTile, src) {
            var onSuccess = function(content, id) {
              var baseUrl = id.split('||')[2];
              var isSecure = id.split('||')[5];
              if (isSecure) {
                if ($window.sessionStorage.getItem(baseUrl)) {
                  var sessionAuthService = JSON.parse($window.sessionStorage.
                      getItem(baseUrl));
                  var xhr = new XMLHttpRequest();
                  xhr.responseType = 'blob';
                  xhr.open('GET', src);
                  xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(
                      sessionAuthService.login + ':' +
                    sessionAuthService.password)
                  );
                  xhr.onload = function() {
                    if (this.response) {
                      var objectUrl = URL.createObjectURL(xhr.response);
                      imageTile.getImage().onload = function() {
                        URL.revokeObjectURL(objectUrl);
                      };
                      imageTile.getImage().src = objectUrl;
                      if (!layer.hasLoggedIn) {
                        layer.hasLoggedIn = true;
                      }
                    } else {
                      imageTile.setState(3);
                    }
                  };
                  xhr.onerror = function() {
                    imageTile.setState(3);
                    if (!layer.hasLoggedIn) {
                      layer.hasLoggedIn = true;
                    }
                  };
                  xhr.send();
                } else {
                  imageTile.getImage().src = (content) || src;
                }
              } else {
                imageTile.getImage().src = (content) || src;
              }
            };
            onSuccess(null, id);
          };
        };

        var id = 'WMTS||' + options.layer + '||' + options.capabilitiesUrl;
        if (options.attribution) {
          id += '||' + options.attribution;
        } else {
          id += '||';
        }
        if (options.attributionUrl) {
          id += '||' + options.attributionUrl;
        } else {
          id += '||';
        }
        // INGRID: Add label
        if (options.label) {
          id += '||' + encodeURIComponent(options.label);
        } else {
          id += '||';
        }
        if ((options.secureAuthLogin && options.secureAuthPassword) ||
            options.isSecure) {
          id += '||true';
        }

        var source = new ol.source.WMTS(options.sourceConfig);
        source.tileLoadFunction = tileLoadFunction(id);

        // INGRID: Set featureInfoTpl
        if (options.sourceConfig.featureInfoTpl) {
          source.set('featureInfoTpl', options.sourceConfig.featureInfoTpl);
        }

        // INGRID: Check auth
        var sessionAuthService = JSON.parse($window.sessionStorage.
          getItem(options.capabilitiesUrl));

        var layer = new ol.layer.Tile({
          id: id,
          source: source,
          extent: gaMapUtils.intersectWithDefaultExtent(options.extent),
          preload: gaMapUtils.preload,
          opacity: options.opacity,
          visible: options.visible,
          // INGRID: Add attributionUrl
          attributionUrl: options.attributionUrl,
          // INGRID: Add isSecure
          isSecure: options.isSecure,
          // INGRID: Add hasLoggedIn
          hasLoggedIn: sessionAuthService ? true : false,
          attribution: options.attribution
        });
        gaDefinePropertiesForLayer(layer);
        layer.useThirdPartyData =
            gaUrlUtils.isThirdPartyValid(options.sourceConfig.urls[0]);
        layer.label = options.label;
        layer.url = options.capabilitiesUrl;
        layer.timestamps = options.timestamps;
        layer.timeEnabled = (layer.timestamps && layer.timestamps.length > 1);
        if (layer.timestamps && layer.timestamps.length === 2 &&
              layer.timestamps[0] === 'current') {
          layer.timeEnabled = false;
        }
        layer.getCesiumImageryProvider = function() {
          return getCesiumImageryProvider(layer);
        };
        return layer;
      };

      var getTimestamps = function(getCapLayer) {
        if (getCapLayer.Dimension) {
          // Enable time selector if layer has multiple values for the time
          // dimension if the layers has dimensions.
          for (var i = 0; i < getCapLayer.Dimension.length; i++) {
            var dimension = getCapLayer.Dimension[i];
            if (dimension.Identifier === 'Time') {
              return dimension.Value;
            }
          }
        }
      };

      // Get the layer extent defines in the GetCapabilities
      var getLayerExtentFromGetCap = function(map, getCapLayer) {
        var wgs84Extent = getCapLayer.WGS84BoundingBox;
        var proj = map.getView().getProjection();
        if (wgs84Extent) {
          var wgs84 = 'EPSG:4326';
          var projCode = proj.getCode();
          // If only an extent in wgs 84 is available, we use the
          // intersection between proj extent and layer extent as the new
          // layer extent. We compare extients in wgs 84 to avoid
          // transformations errors of large wgs 84 extent like
          // (-180,-90,180,90)
          var projWgs84Extent = ol.proj.transformExtent(proj.getExtent(),
              projCode, wgs84);
          var layerWgs84Extent = ol.extent.getIntersection(projWgs84Extent,
              wgs84Extent);

          if (layerWgs84Extent) {
            // INGRID: Add check infinity values
            var hasInfinityValue = false;

            layerWgs84Extent.forEach(function(coord) {
              if (!isFinite(coord)) {
                hasInfinityValue = true;
              }
            });

            if (!hasInfinityValue) {
              return ol.proj.transformExtent(layerWgs84Extent, wgs84, projCode);
            }
          }
          return ol.proj.transformExtent(wgs84Extent, wgs84, projCode);
        }
      };

      var getLayerOptions = function(map, getCapLayer, getCap, getCapUrl) {

        var extent = getLayerExtentFromGetCap(map, getCapLayer);
        var sourceConfig = ol.source.WMTS.optionsFromCapabilities(getCap, {
          layer: getCapLayer.Identifier,
          projection: map.getView().getProjection()
        });

        // INGRID: Check getFeatureInfo
        if (getCapLayer['ResourceURL']) {
          getCapLayer['ResourceURL'].forEach(function(element) {
            if (element['resourceType'] === 'FeatureInfo') {
              sourceConfig.featureInfoTpl = element['template'];
            }
          });
        }

        var options = {
          capabilitiesUrl: getCapUrl,
          label: getCapLayer.Title,
          layer: getCapLayer.Identifier,
          timestamps: getTimestamps(getCapLayer),
          extent: extent,
          sourceConfig: sourceConfig
        };
        return options;
      };

      var getLayerOptionsFromIdentifier = function(map, getCap, identifier,
          getCapUrl) {
        store[getCapUrl] = getCap;
        var options;
        if (getCap.Contents && getCap.Contents.Layer) {
          getCap.Contents.Layer.some(function(layer) {
            if (layer.Identifier === identifier) {
              options = getLayerOptions(map, layer, getCap, getCapUrl);
              return true;
            }
          });
        }

        return options;
      };

      var Wmts = function() {

        this.getOlLayerFromGetCap = function(map, getCap, layerIdentifier,
            options) {

          if (angular.isString(getCap)) {
            // INGRID: Check empty dummy layer
            if (getCap !== '') {
              getCap = new ol.format.WMTSCapabilities().read(getCap);
            } else {
              return createWmtsLayer(options);
            }
          }
          var layerOptions = getLayerOptionsFromIdentifier(map, getCap,
              layerIdentifier, options.capabilitiesUrl);
          if (layerOptions) {
            layerOptions.opacity = options.opacity || 1;
            layerOptions.visible = options.visible && true;
            // INGRID: Add attribution
            if (getCap['ServiceProvider']) {
              var getCapService = getCap['ServiceProvider'];
              layerOptions.attribution = getCapService['ProviderName'];
              layerOptions.attributionUrl = getCapService['ProviderSite'];
            }
            // INGRID: Add secure
            if (options.isSecure) {
              layerOptions.isSecure = options.isSecure;
            }
            if (options.secureAuthLogin) {
              layerOptions.secureAuthLogin = options.secureAuthLogin;
            }
            if (options.secureAuthPassword) {
              layerOptions.secureAuthPassword = options.secureAuthPassword;
            }
            return createWmtsLayer(layerOptions);
          }
        };

        // Create a WMTS layer from a GetCapabilities string or an ol object
        // and a layer's identifier.
        // This function is not used outside gaWmts but it's convenient for
        // test.
        this.addWmtsToMapFromGetCap = function(map, getCap, layerIdentifier,
            options) {
          var olLayer = this.getOlLayerFromGetCap(map, getCap, layerIdentifier,
              options);
          // INGRID: Add hasLoggedIn
          if (options.hasLoggedIn) {
            olLayer.hasLoggedIn = options.hasLoggedIn;
          }
          // INGRID: Add url
          if (options.url) {
            olLayer.url = options.url;
          }
          if (options.index) {
            map.getLayers().insertAt(options.index, olLayer);
          } else {
            map.addLayer(olLayer);
          }
          return olLayer;
        };

        // Create a WMTS layer from a GetCapabiltiies url and a layer's
        // identifier.
        this.addWmtsToMapFromGetCapUrl = function(map, getCapUrl,
            layerIdentifier, layerOptions) {
          var that = this;
          var url = gaUrlUtils.buildProxyUrl(getCapUrl);
          var id = 'WMTS||' + layerIdentifier + '||' + getCapUrl;
          if (layerOptions.attribution) {
            id += '||' + layerOptions.attribution;
          } else {
            id += '||';
          }
          if (layerOptions.attributionUrl) {
            id += '||' + layerOptions.attributionUrl;
          } else {
            id += '||';
          }
          // INGRID: Add label
          if (layerOptions.label) {
            id += '||' + encodeURIComponent(layerOptions.label);
          } else {
            id += '||';
          }
          if ((layerOptions.secureAuthLogin &&
              layerOptions.secureAuthPassword) ||
            layerOptions.isSecure) {
            id += '||true';
          }
          // INGRID: Get session auth
          var params = {};
          if ($window.sessionStorage.getItem(getCapUrl)) {
            var sessionAuthService = JSON.parse($window.sessionStorage.
                getItem(getCapUrl));
            if (sessionAuthService) {
              params['login'] = sessionAuthService.login;
              params['password'] = sessionAuthService.password;
            }
          }
          // INGRID: Load with POST
          return $http.post(url, params, {
            cache: true
          }).then(function(response) {
            var data = response.data;
            layerOptions.capabilitiesUrl = getCapUrl;
            return that.addWmtsToMapFromGetCap(map, data, layerIdentifier,
                layerOptions);

          }, function(reason) {
            $window.console.error('Loading of external WMTS layer ' +
                layerIdentifier +
                ' failed. Failed to get capabilities from server.' +
                'Reason : ' + reason);
            // INGRID: Create dummy layer
            if (reason.status === 401) {
              layerOptions.id = id;
              layerOptions.url = getCapUrl;
              return that.addWmtsToMapFromGetCap(map, '', layerIdentifier,
                  layerOptions);
            }
          });
        };
      };
      return new Wmts();
    };
  });
})();
