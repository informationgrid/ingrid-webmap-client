goog.provide('ga_vector_service');

goog.require('ga_definepropertiesforlayer_service');
goog.require('ga_geomutils_service');
goog.require('ga_gpx_service');
goog.require('ga_kml_service');
goog.require('ga_maputils_service');
goog.require('ga_measure_service');
goog.require('ga_networkstatus_service');
goog.require('ga_storage_service');
goog.require('ga_urlutils_service');
goog.require('ga_file_service');

(function() {

  var module = angular.module('ga_vector_service', [
    'ga_definepropertiesforlayer_service',
    'ga_gpx_service',
    'ga_kml_service',
    'ga_maputils_service',
    'ga_networkstatus_service',
    'ga_storage_service',
    'ga_urlutils_service',
    'ga_measure_service',
    'ga_geomutils_service',
    'ga_file_service'
  ]);

  /**
   * Manage vector layers (KML, GPX ...)
   */
  module.provider('gaVector', function() {

    // INGRID: Add '$window'
    this.$get = function($http, $q, gaDefinePropertiesForLayer, gaMapUtils,
        gaNetworkStatus, gaStorage, gaUrlUtils, gaMeasure, gaGeomUtils,
        gaFile, gaGpx, gaKml, $window) {

      // Find the good parser according to the raw data
      var getService = function(data) {
        var srv = gaKml;
        if (gaFile.isGpx(data)) {
          srv = gaGpx;
        }
        return srv;
      };

      var readFeatures = function(data, mapProj) {

        // Find the good parser
        var srv = getService(data);

        // Sanitize raw data before parsing
        // INGRID: Check for data
        if (data && srv.sanitize) {
          data = srv.sanitize(data);
        }

        // Read features from raw data:  KML, GPX or GeoJSON file ...
        var features = srv.getFormat().readFeatures(data, {
          featureProjection: mapProj
        });

        // Get linked data, ex: NetworkLinks for KML.
        return srv.getLinkedData(data).then(function(responses) {
          var all = [];
          responses.forEach(function(response) {
            all.push(readFeatures(response.data, mapProj).
                then(function(resp) {
                  features = features.concat(resp.features);
                }))
          });

          return $q.all(all).then(function() {
            // Sanitize features found (geometry, style ...)
            var sanitizedFeatures = [];
            for (var i = 0, ii = features.length; i < ii; i++) {
              var feat = sanitizeFeature(features[i], srv);
              if (feat) {
                sanitizedFeatures.push(feat);
              }
            }

            return {
              features: sanitizedFeatures,
              data: data
            };
          });
        });
      };

      // Sanitize the feature's properties (id, geometry, style).
      var sanitizeFeature = function(feature, srv) {
        var geom = feature.getGeometry();

        // Remove feature without good geometry.
        if (!gaGeomUtils.isValid(geom)) {
          return;
        }
        // Ensure polygons are closed.
        // Reason: print server failed when polygons are not closed.
        gaGeomUtils.close(geom);

        return srv.sanitizeFeature(feature);
      };

      var Vector = function() {

        // Create a vector layer from a string (XML, GPX, GeoJson, ...).
        // INGRID: Add is secure vector
        var createLayer = function(data, options, isSecure) {
          options = options || {};
          // Find the good parser
          var srv = getService(data);
          var type = srv.getType();
          options.id = type + '||' + options.url;

          // Update data stored for offline or use it if xml is null
          var offlineData = gaStorage.getItem(options.id);
          if (offlineData) {
            if (data) {
              gaStorage.setItem(options.id, data);
            } else {
              data = offlineData;
            }
          // INGRID: Add check is secure vector
          } else if (!data && !isSecure) {
            var deferred = $q.defer();
            deferred.reject('No vector data found');
            return deferred.promise;
          }

          return readFeatures(data, options.mapProjection).
              then(function(resp) {
                var source = new ol.source.Vector({
                  features: resp.features
                });

                var layerOptions = {
                  id: options.id,
                  adminId: options.adminId,
                  url: options.url,
                  label: options.label || srv.getName(data) || type,
                  opacity: options.opacity,
                  visible: options.visible,
                  source: source,
                  //INGRID: Add isSecure
                  isSecure: options.isSecure || false,
                  attribution: options.attribution
                };

                // Be sure to remove all html tags
                layerOptions.label = $('<p>' + layerOptions.label + '<p>').
                    text();

                // INGRID: Add label
                if (layerOptions.label) {
                  layerOptions.id += '||' + encodeURIComponent(layerOptions.
                    label);
                } else {
                  layerOptions.id += '||';
                }

                // INGRID: Add isSecure
                if ((options.secureAuthLogin && options.secureAuthPassword) ||
                  options.isSecure) {
                  layerOptions.id += '||true';
                }

                var olLayer;
                if (options.useImageVector === true) {
                  layerOptions.renderMode = 'image';
                }
                olLayer = new ol.layer.Vector(layerOptions);
                gaDefinePropertiesForLayer(olLayer);
                olLayer.useThirdPartyData = true;
                olLayer.updateDelay = options.updateDelay;

                // Save the xml content for for offline and 3d parsing
                olLayer.getSource().setProperties({
                  'rawData': resp.data
                });
                return olLayer;
              });
        };

        // Add an ol layer to the map
        // INGRID: Add isSecure
        var addLayer = function(olMap, data, options, index, isSecure) {
          options.mapProjection = olMap.getView().getProjection();
          // INGRID: Add isSecure
          return createLayer(data, options, isSecure).then(function(olLayer) {
            if (olLayer) {
              if (index) {
                olMap.getLayers().insertAt(index, olLayer);
              } else {
                olMap.addLayer(olLayer);
              }

              var source = olLayer.getSource();

              // If the layer can contain measure features, we register some
              // events to add/remove correctly the overlays
              if (gaMapUtils.isKmlLayer(olLayer.id)) {
                if (olLayer.getVisible()) {
                  angular.forEach(source.getFeatures(),
                      function(feature) {
                        if (gaMapUtils.isMeasureFeature(feature)) {
                          gaMeasure.addOverlays(olMap, olLayer, feature);
                        }
                      });
                }
                gaMeasure.registerOverlaysEvents(olMap, olLayer);
              }

              if (options.zoomToExtent) {
                var sourceExtent = gaMapUtils.getVectorSourceExtent(source);
                var ext = gaMapUtils.intersectWithDefaultExtent(sourceExtent);
                if (ext) {
                  olMap.getView().fit(ext, {
                    size: olMap.getSize()
                  });
                }
              }
            }
            return olLayer;
          });
        };

        // Returns a promise
        this.readFeatures = function(data, mapProj) {
          return readFeatures(data, mapProj);
        };

        // INGRID: Add isSecure
        this.addToMap = function(map, data, options, index, isSecure) {
          // INGRID: Add isSecure
          return addLayer(map, data, options || {}, index, isSecure);
        };

        this.addToMapForUrl = function(map, url, options, index) {
          var that = this;
          options = options || {};
          options.url = url;
          
          // INGRID: Check secure
          var params = {};
          if (options.isSecure) {
            var baseUrl = decodeURIComponent(url);
            if ($window.sessionStorage.getItem(baseUrl)) {
              var sessionAuthService = JSON.parse($window.sessionStorage.
                  getItem(baseUrl));
              if (sessionAuthService) {
                params['login'] = sessionAuthService.login;
                params['password'] = sessionAuthService.password;
              }
            }
          }

          if (gaNetworkStatus.offline) {
            return this.addToMap(map, null, options, index);
          } else {
            return gaUrlUtils.proxifyUrl(url).then(function(proxyUrl) {
              // INGRID: Change to POST
              return $http.post(proxyUrl, params, {
                cache: true
              }).then(function(response) {
                var fileSize = response.headers('content-length');
                if (gaFile.isValidFileSize(fileSize)) {
                  options.useImageVector = that.useImageVector(fileSize);
                  return that.addToMap(map, response.data, options, index);
                }
              }, function(reason) {
                // INGRID: Check is secure vector
                if (reason.status === 401) {
                  return that.addToMap(map, null, options, index, true);
                }
                // Try to get offline data if exist
                return that.addToMap(map, null, options, index);
              });
            });
          }
        };

        // Defines if we should use a ol.layer.Image instead of a
        // ol.layer.Vector. Currently we define this, only testing the
        // file size but it could be another condition.
        this.useImageVector = function(fileSize) {
          return (!!fileSize && parseInt(fileSize) >= 1000000); // < 1mo
        };
      };
      return new Vector();
    };
  });
})();
