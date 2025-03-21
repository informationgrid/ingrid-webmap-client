goog.provide('ga_map_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_offline_service');
goog.require('ga_permalink');
goog.require('ga_styles_service');
(function() {

  var module = angular.module('ga_map_directive', [
    'ga_browsersniffer_service',
    'ga_debounce_service',
    'ga_offline_service',
    'ga_permalink',
    'ga_styles_service'
  ]);

  module.directive('gaCesiumInspector', function(gaPermalink) {
    return {
      restrict: 'A',
      scope: {
        ol3d: '=gaCesiumInspectorOl3d'
      },
      link: function(scope, element, attrs) {
        if (!gaPermalink.getParams().debug) {
          element.remove();
          return;
        }
        var inspector;
        scope.$watch('::ol3d', function(ol3d) {
          if (ol3d && !inspector) {
            var scene = ol3d.getCesiumScene();
            inspector = new Cesium.CesiumInspector(element[0], scene);

            // Hide the menu
            element.find('.cesium-cesiumInspector-button').trigger('click');
          }
        });
      }
    };
  });

  module.directive('gaCesium3dTilesInspector', function(gaPermalink) {
    return {
      restrict: 'A',
      scope: {
        ol3d: '=gaCesium3dTilesInspectorOl3d'
      },
      link: function(scope, element, attrs) {
        if (!gaPermalink.getParams().debug) {
          element.remove();
          return;
        }
        var inspector;
        scope.$watch('::ol3d', function(ol3d) {
          if (ol3d && !inspector) {
            var scene = ol3d.getCesiumScene();
            inspector = new Cesium.Cesium3DTilesInspector(element[0], scene);

            // Hide the menu
            element.find('.cesium-cesiumInspector-button').trigger('click');
          }
        });
      }
    };
  });

  // INGRID: Add parameter 'gaGlobalOptions', '$http'
  module.directive('gaMap', function($window, gaPermalink,
      gaStyleFactory, gaBrowserSniffer, gaLayers, gaDebounce, gaOffline,
      gaMapUtils, $translate, gaGlobalOptions, $http) {
    return {
      restrict: 'A',
      scope: {
        map: '=gaMapMap',
        ol3d: '=gaMapOl3d'
      },
      link: function(scope, element, attrs) {
        var map = scope.map;
        var view = map.getView();
        var isOpeningIn3d = false;

        // set view states based on URL query string
        var queryParams = gaPermalink.getParams();
        if ((queryParams.E && queryParams.N) ||
           (queryParams.X && queryParams.Y)) {
          var easting = queryParams.Y;
          var northing = queryParams.X;
          if (queryParams.E && queryParams.N) {
            easting = queryParams.E;
            northing = queryParams.N;
          }

          easting = parseFloat(easting.replace(/,/g, '.'));
          northing = parseFloat(northing.replace(/,/g, '.'));

          if (isFinite(easting) && isFinite(northing)) {
            var position = [easting, northing];
            /* INGRID: Not used
            if (ol.extent.containsCoordinate(
                [420000, 30000, 900000, 350000], position)) {
              position = ol.proj.transform([easting, northing],
                  'EPSG:21781', view.getProjection().getCode());
            }
            */
            view.setCenter(position);
          }
        }
        if (queryParams.zoom !== undefined && isFinite(queryParams.zoom)) {
          view.setZoom(+queryParams.zoom);
        }

        if (queryParams.crosshair !== undefined) {
          var crosshair = new ol.Feature({
            label: 'link_bowl_crosshair',
            geometry: new ol.geom.Point(view.getCenter())
          });
          var style = gaStyleFactory.getStyle(queryParams.crosshair);
          if (!style) {
            style = gaStyleFactory.getStyle('marker');
          }
          map.addLayer(gaMapUtils.getFeatureOverlay([crosshair], style));
          var unregister = view.on('propertychange', function() {
            gaPermalink.deleteParam('crosshair');
            ol.Observable.unByKey(unregister);
          });
        }

        // Update permalink based on view states.
        var updatePermalink = function() {
          // only update the permalink in 2d mode
          if (!scope.ol3d || !scope.ol3d.getEnabled()) {
            // remove 3d params
            gaPermalink.deleteParam('lon');
            gaPermalink.deleteParam('lat');
            gaPermalink.deleteParam('elevation');
            gaPermalink.deleteParam('heading');
            gaPermalink.deleteParam('pitch');
            var center = view.getCenter();
            var zoom = view.getZoom();
            // when the directive is instantiated the view may not
            // be defined yet.
            if (center && zoom !== undefined) {
              var e = center[0].toFixed(2);
              var n = center[1].toFixed(2);
              // INGRID: Check init position
              if(!gaMapUtils.hasXYZParams()) {
                map.getView().set('initPosE', e);
                map.getView().set('initPosN', n);
                map.getView().set('initPosZ', zoom);
              }
              gaPermalink.updateParams({E: e, N: n, zoom: zoom});
              gaPermalink.deleteParam('X');
              gaPermalink.deleteParam('Y');
            }
          }
        };
        view.on('propertychange', gaDebounce.debounce(updatePermalink, 1000,
            false));

        map.setTarget(element[0]);

        var updateDefaultExtent = function() {
          // INGRID: Add default zoom
          // Zoom to default extent
          if (!gaPermalink.getParams().E && !gaPermalink.getParams().N &&
            !gaPermalink.getParams().X && !gaPermalink.getParams().Y) {
            if (!gaBrowserSniffer.embed) {
              if (window.parent.resizeIframe !== undefined) {
                window.parent.resizeIframe();
                map.updateSize();
              }
            }
            var extent = ol.proj.transformExtent(gaMapUtils.defaultExtent,
                'EPSG:4326', gaGlobalOptions.defaultEpsg);
            var size = map.getSize();
            view.fit(extent, size);
          }
        };

        // INGRID: Add bwaStrId
        if (queryParams.bwaStrId && queryParams.bwaStrKm &&
          gaGlobalOptions.searchBwaLocatorGeoUrl) {
          var bwaStrKm = queryParams.bwaStrKm.replace(',', '.');
          var content = '{' +
            '"limit":200,' +
            '"queries":[' +
            '{' +
            '"qid":1,' +
            '"bwastrid":"' + queryParams.bwaStrId + '",' +
            '"stationierung":{';
          content = content + '"km_wert":' + bwaStrKm;
          content = content + ',';
          var offset = 0;
          if (queryParams.bwaStrOffset) {
            offset = queryParams.bwaStrOffset.replace(',', '.');
          }
          content = content + '"offset":' + offset;
          content = content + '},' +
            '"spatialReference":{' +
            '"wkid":' + gaGlobalOptions.defaultEpsg.split(':')[1] +
            '}' +
            '}' +
            ']' +
          '}';
          gaLayers.loadConfig().then(function(layers) {
            $http.get('/ingrid-webmap-client/rest/' +
                'jsonCallback/queryPost?', {
              cache: true,
              params: {
                'url': gaGlobalOptions.searchBwaLocatorGeoUrl,
                'data': content
              }
            }).then(function(response) {
              var data = response.data;
              var hasData = false;
              if (data) {
                var result = data.result;
                if (result) {
                  if (result.length > 0) {
                    var bwaStr = result[0];
                    if (bwaStr) {
                      var geo = bwaStr.geometry;
                      if (geo) {
                        if (geo.coordinates) {
                          hasData = true;
                          var label = bwaStr.bwastr_name +
                              ' (' + bwaStr.bwastrid + ') ' +
                              ' Km: ' + bwaStr.stationierung.km_wert +
                              ' Abstand: ' + bwaStr.stationierung.offset;
                          var visible = true;
                          if (queryParams.bwaStrVisible !== undefined) {
                            visible = (queryParams.bwaStrVisible === 'true');
                          }
                          var crosshair = new ol.Feature({
                            label: label,
                            geometry: new ol.geom.Point(geo.coordinates)
                          });
                          var style = gaStyleFactory.getStyle('marker');
                          map.addLayer(gaMapUtils.
                              getBwaStrFeatureOverlay(crosshair, style,
                                  map, label, visible));
                          var e = gaPermalink.getParams().E;
                          var n = gaPermalink.getParams().N;
                          if (!e && !n) {
                            var center = geo.coordinates;
                            var zoom = +queryParams.zoom || 15;
                            map.getView().setCenter(center);
                            map.getView().setZoom(zoom);
                            if (center && zoom !== undefined) {
                              e = center[0].toFixed(2);
                              n = center[1].toFixed(2);
                              gaPermalink.updateParams({
                                E: e,
                                N: n,
                                zoom: zoom
                              });
                            }
                          }
                          var bwaStrLayers = gaGlobalOptions.
                              bwaStrFinderLayers.split(',');
                          for (var index in bwaStrLayers) {
                            var layerId = bwaStrLayers[index];
                            if (layerId) {
                              var layer = gaLayers.getOlLayerById(layerId);
                              if (layer) {
                                map.addLayer(layer);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              if (!hasData) {
                updateDefaultExtent();
              }
            });
          });
        } else {
          updateDefaultExtent();
        }

        scope.$watch('::ol3d', function(ol3d) {
          if (ol3d) {
            var camera = ol3d.getCesiumScene().camera;
            var params = gaPermalink.getParams();

            // initial location based on query params
            var position, heading, pitch;
            if (isFinite(params.lon) && isFinite(params.lat) &&
                isFinite(params.elevation)) {
              isOpeningIn3d = true;
              var lon = parseFloat(params.lon);
              var lat = parseFloat(params.lat);
              var elevation = parseFloat(params.elevation);
              position = Cesium.Cartesian3.fromDegrees(lon, lat, elevation);
            }
            if (isFinite(params.heading)) {
              heading = Cesium.Math.toRadians(parseFloat(params.heading));
            }
            if (isFinite(params.pitch)) {
              pitch = Cesium.Math.toRadians(parseFloat(params.pitch));
            }
            camera.setView({
              destination: position,
              orientation: {
                heading: heading,
                pitch: pitch,
                roll: 0.0
              }
            });

            // update permalink
            camera.moveEnd.addEventListener(gaDebounce.debounce(function() {
              // remove 2d params
              gaPermalink.deleteParam('E');
              gaPermalink.deleteParam('N');
              gaPermalink.deleteParam('zoom');

              var position = camera.positionCartographic;
              gaPermalink.updateParams({
                lon: Cesium.Math.toDegrees(position.longitude).toFixed(5),
                lat: Cesium.Math.toDegrees(position.latitude).toFixed(5),
                elevation: position.height.toFixed(0),
                heading: Cesium.Math.toDegrees(camera.heading).toFixed(3),
                pitch: Cesium.Math.toDegrees(camera.pitch).toFixed(3)
              });
            }, 1000, false));

            var dereg = [];
            var setRealPosition = function(itemOrEvt) {
              var item = (itemOrEvt instanceof ol.Overlay) ? itemOrEvt :
                itemOrEvt.element;
              item.set('realPosition', item.getPosition());
              item.setPosition();
              dereg.push(item.on('change:position', function(evt) {
                var val = evt.target.getPosition();
                if (val) {
                  item.set('realPosition', val);
                  item.setPosition();
                }
              }));
            };

            // Management of 2d layer with a 3d config to display in 3d.
            var dflt3dStatus = [];
            var showDflt3dLayers = function(map) {
              // Add 2d layer which have a 3d configuration to display in 3d
              // by default.
              gaLayers.loadConfig().then(function(layers) {
                for (var bodId in layers) {
                  if (layers.hasOwnProperty(bodId) && layers[bodId].default3d &&
                      layers[bodId].config2d) {
                    var config2d = layers[bodId].config2d;
                    var overlay = gaMapUtils.getMapOverlayForBodId(map,
                        config2d);
                    // If the page is openinig directly in 3d we consider the
                    // default layers were not displayed in 2d initally.
                    if (isOpeningIn3d || !overlay) {
                      dflt3dStatus.push(config2d);
                      isOpeningIn3d = false;
                    }
                    if (!overlay) {
                      map.addLayer(gaLayers.getOlLayerById(config2d));
                    }
                  }
                }
              });
            };
            var hideDflt3dLayers = function(map) {
              dflt3dStatus.forEach(function(bodId) {
                var overlay = gaMapUtils.getMapOverlayForBodId(map, bodId);
                if (overlay) {
                  map.removeLayer(overlay);
                }
              });
              dflt3dStatus = [];
            };

            // Watch when 3d is enabled to show/hide overlays
            scope.$watch(function() {
              return ol3d.getEnabled();
            }, function(active) {
              if (active) {
                // Hide the overlays
                map.getOverlays().forEach(setRealPosition);
                dereg.push(map.getOverlays().on('add', setRealPosition));

                // Show layers we have to display in 3d
                showDflt3dLayers(map);

                // Display alert messages that layers can't be displayed in 3d
                var msg = '';
                map.getLayers().forEach(function(layer) {
                  if (!layer.displayIn3d) {
                    msg = msg + '\n' + layer.label;
                  }
                });
                if (msg) {
                  msg = $translate.instant('layer_cant_be_displayed_in_3d') +
                      msg;
                  $window.alert(msg);
                }
              } else {
                // Show the overlays
                dereg.forEach(function(key) {
                  ol.Observable.unByKey(key);
                });
                dereg = [];
                map.getOverlays().forEach(function(item) {
                  if (!item.getPosition()) {
                    item.setPosition(item.get('realPosition'));
                  }
                });

                // Hide layers we have to display in 3d, if it wasn't there in
                // 2d.
                hideDflt3dLayers(map);
              }
            });
          }
        });

        // Often when we use embed map the size of the map is fixed, so we
        // don't need to resize the map for printing (use case: print an
        // embed map in a tooltip.
        if (gaBrowserSniffer.embed) {
          // #3722: On mobile we need to update size of the map on iframe load.
          $($window).on('DOMContentLoaded', function() {
            map.updateSize();
          });
        }

        scope.$on('gaNetworkStatusChange', function(evt, offline) {
          gaOffline.refreshLayers(map.getLayers().getArray(), offline);
          if (offline) {
            gaOffline.showExtent(map);
          } else {
            gaOffline.hideExtent();
          }
        });

        var savedTimeStr = {};
        scope.$on('gaTimeChange', function(evt, time, oldTime) {
          var switchTimeActive = (!oldTime && time);
          var switchTimeDeactive = (oldTime && !time);
          var olLayer, olLayers = scope.map.getLayers().getArray();
          var singleModif = false;

          // Detection the time change has been triggered by a layer's
          // 'propertychange' event.
          // (ex: using layermanager)
          if (switchTimeDeactive) {
            for (var i = 0, ii = olLayers.length; i < ii; i++) {
              olLayer = olLayers[i];
              // We update only time enabled bod layers
              if (olLayer.timeEnabled &&
                  angular.isDefined(olLayer.time) &&
                  olLayer.time.substr(0, 4) !== oldTime &&
                  olLayer.time.substr(0, 4) !== '9999') {
                singleModif = true;
                break;
              }
            }
          }

          // In case the time change event has been triggered by a layer's
          // 'propertychange' event, we do nothing more.
          // (ex: using the layer manager)
          if (singleModif) {
            savedTimeStr = {};
            return;
          }
          // In case the user has done a global modification.
          // (ex: using the time selector toggle)
          for (var j = 0, jj = olLayers.length; j < jj; j++) {
            olLayer = olLayers[j];

            if (olLayer.timeEnabled && olLayer.visible) {

              var layerTimeStr =
                  gaLayers.getLayerTimestampFromYear(olLayer, time);
              if (switchTimeActive) {
                // We save the current value after a global activation.
                // (ex: using the time selector toggle)
                savedTimeStr[olLayer.id] = olLayer.time;
              } else if (switchTimeDeactive &&
                  savedTimeStr.hasOwnProperty(olLayer.id)) {
                // We apply the saved values after a global deactivation.
                // (ex: using the time selector toggle)
                layerTimeStr = savedTimeStr[olLayer.id];
                savedTimeStr[olLayer.id] = undefined;
              }
              olLayer.time = layerTimeStr;
            }
          }
        });
      }
    };
  });
})();
