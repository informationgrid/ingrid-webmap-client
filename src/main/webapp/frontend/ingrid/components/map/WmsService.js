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
// INGRID: Add parameter '$http'
    this.$get = function(gaDefinePropertiesForLayer, gaMapUtils, gaUrlUtils,
        gaGlobalOptions, $q, gaLang, $http) {
      var getCesiumImageryProvider = function(layer) {
        var params = layer.getSource().getParams();
        var proxy;
        if (!gaUrlUtils.isAdminValid(layer.url)) {
          proxy = {
            getURL: function(resource) {
               return gaGlobalOptions.ogcproxyUrl +
                   encodeURIComponent(resource);
            }
          };
        }
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
          styles: params.STYLES || 'default',
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
          proxy: proxy,
          tilingScheme: new Cesium.GeographicTilingScheme(),
          hasAlphaChannel: true,
          availableLevels: window.imageryAvailableLevels
        });

      };

      var Wms = function() {

        // Test WMS 1.1.1 with  https://wms.geo.bs.ch/wmsBS
        var createWmsLayer = function(params, options, index) {
          options = options || {};
          options.id = 'WMS||' + options.label + '||' + options.url + '||' +
              params.LAYERS;

          // If the WMS has a version specified, we add it in
          // the id. It's important that the layer keeps the same id as the
          // one in the url otherwise it breaks the asynchronous reordering of
          // layers.
          if (params.VERSION) {
            options.id += '||' + params.VERSION;
          }

          // INGRID: Add queryable 
          if (options.queryable) {
            options.id += '||' + options.queryable;
          }

          
          if (options.useReprojection) {
            options.projection = 'EPSG:4326';
            options.id += '||true';
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
            source: source
          });
          gaDefinePropertiesForLayer(layer);
          layer.preview = options.preview;
          layer.displayInLayerManager = !layer.preview;
          layer.useThirdPartyData = gaUrlUtils.isThirdPartyValid(options.url);
          layer.label = options.label;
          layer.getCesiumImageryProvider = function() {
            return getCesiumImageryProvider(layer);
          };
          return layer;
        };

        // INGRID: Add function to get layers
        var getChildLayers = function(layer, map, wmsVersion) {

            // If the WMS layer has no name, it can't be displayed
            if (!layer.Name) {
              layer.isInvalid = true;
              layer.Abstract = 'layer_invalid_no_name';
            }

            // Go through the child to get valid layers
            if (layer.Layer) {

              for (var i = 0; i < layer.Layer.length; i++) {
                var l = getChildLayers(layer.Layer[i], map, wmsVersion);
                if (!l) {
                  layer.Layer.splice(i, 1);
                  i--;
                }
              }

              // No valid child
              if (layer.Layer.length == 0) {
                layer.Layer = undefined;
              }
            }

            if (layer.isInvalid && !layer.Layer) {
              return undefined;
            }

            return layer;
          };
        // Create an ol WMS layer from GetCapabilities informations
        this.getOlLayerFromGetCapLayer = function(getCapLayer) {
          var wmsParams = {
            LAYERS: getCapLayer.Name,
            VERSION: getCapLayer.wmsVersion
          };
          var wmsOptions = {
            url: getCapLayer.wmsUrl,
            label: getCapLayer.Title,
            // INGRID: Remove function 'gaMapUtils.intersectWithDefaultExtent'
            extent: getCapLayer.extent,
            useReprojection: getCapLayer.useReprojection,
            // INGRID: Add queryable 
            queryable: getCapLayer.queryable
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
            var proxyUrl = gaGlobalOptions.ogcproxyUrl + encodeURIComponent(cap) +  "&toJson=true";

            // INGRID: Split host from params
            var capSplit = cap.split("?");
            var capParams = "?";
            cap = capSplit[0];
            if(capSplit.length > 0){
                var capSplitParams = capSplit[1].split("&");
                for (var i = 0; i < capSplitParams.length; i++) {
                    var capSplitParam = capSplitParams[0].toLowerCase();
                    // INGRID: Check for needed parameters like 'ID'
                    if(capSplitParam.indexOf("request") == -1 && capSplitParam.indexOf("service") == -1 && capSplitParam.indexOf("version") == -1){
                        if(capParams.startsWith("?")){
                            capParams = capParams + "?&" + capSplitParam;
                        }else{
                            capParams = capParams + "&" + capSplitParam;
                        }
                    }
                }
            }
            
            // Angularjs doesn't handle onprogress event
            $http.get(proxyUrl, {identifier: identifier, index: index, cap: cap + "" + capParams})
            .success(function(data, status, headers, config) {
                try {
                    var result = data.WMT_MS_Capabilities || data.WMS_Capabilities;
                    if (result.Capability.Layer) {
                      var root = getChildLayers(result.Capability.Layer,
                          map, result.version);
                      if(root){
                          if(root.Layer){
                              for (var i = 0; i < root.Layer.length; i++) {
                                  var layer = root.Layer[i];
                                  var layerParams = {
                                      LAYERS: layer.Name,
                                      VERSION: result.version
                                  };
                                  var visible = false;
                                  if(config.identifier){
                                      if(layer.Identifier && layer.Identifier.length > 0){
                                          if(layer.Identifier[0] == config.identifier){
                                              visible = true;
                                          }
                                      }
                                  }
                                  //westBoundLongitude:O(Oo),eastBoundLongitude:O(Oo),southBoundLatitude:O(Oo),northBoundLatitude:O(Oo)
                                  var extent = [parseFloat(layer.EX_GeographicBoundingBox.westBoundLongitude), parseFloat(layer.EX_GeographicBoundingBox.southBoundLatitude), parseFloat(layer.EX_GeographicBoundingBox.eastBoundLongitude), parseFloat(layer.EX_GeographicBoundingBox.northBoundLatitude)] || 
                                                    [ parseFloat(layer.LatLonBoundingBox.minx), parseFloat(layer.LatLonBoundingBox.miny), parseFloat(layer.LatLonBoundingBox.maxx), parseFloat(layer.LatLonBoundingBox.maxy)];
                                  var layerOptions = {
                                      url: config.cap,
                                      label: layer.Title,
                                      opacity: 1,
                                      visible: visible,
                                      queryable: parseInt(layer.queryable),
                                      extent: ol.proj.transformExtent(extent || gaGlobalOptions.defaultExtent, 'EPSG:4326', gaGlobalOptions.defaultEpsg)
                                  };
                                  var olLayer = createWmsLayer(layerParams, layerOptions);
                                  olLayer.visible = visible;
                                  if (config.index) {
                                    map.getLayers().insertAt(config.index + i, olLayer);
                                  } else {
                                    map.addLayer(olLayer);
                                  }
                              }
                          }
                      }
                    }
                  } catch (e) {
                  }
            })
            .error(function(data, status, headers, config) {
                console.log(data);
            });
        };
        
        
        // Make a GetLegendGraphic request
        this.getLegend = function(layer) {
          var defer = $q.defer();
          var params = layer.getSource().getParams();
            // INGRID: Get legend for all layer (intern and extern)
            var url = layer.url;
            if(url == undefined){
                if(layer.getSource()){
                    if(layer.getSource().urls){
                        if(layer.getSource().urls.length > 0){
                            url = layer.getSource().urls[0];
                        }
                    }
                }
            }
            var html = '<img alt="No legend available" src="' +
              gaUrlUtils.append(url, gaUrlUtils.toKeyValue({
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
            if(url == undefined){
                if(layer.getSource()){
                    if(layer.getSource().urls){
                        if(layer.getSource().urls.length > 0){
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
             version: params.version || '1.3.0',
             format: 'image/png',
             sld_version: '1.1.0'
           }));
        };
      };
      return new Wms();
    };
  });
})();
