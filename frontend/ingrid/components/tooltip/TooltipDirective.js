goog.provide('ga_tooltip_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_event_service');
goog.require('ga_identify_service');
goog.require('ga_iframecom_service');
goog.require('ga_layers_service');
goog.require('ga_mapclick_service');
goog.require('ga_maputils_service');
goog.require('ga_popup_service');
goog.require('ga_previewfeatures_service');
goog.require('ga_sanitize_service');
goog.require('ga_time_service');
goog.require('ga_topic_service');
goog.require('ga_window_service');

(function() {

  var module = angular.module('ga_tooltip_directive', [
    'ga_browsersniffer_service',
    'ga_debounce_service',
    'ga_event_service',
    'ga_identify_service',
    'ga_iframecom_service',
    'ga_layers_service',
    'ga_maputils_service',
    'ga_mapclick_service',
    'ga_popup_service',
    'ga_previewfeatures_service',
    'ga_sanitize_service',
    'ga_time_service',
    'ga_topic_service',
    'ga_window_service',
    'pascalprecht.translate'
  ]);

  module.directive('gaTooltip',
      function($timeout, $http, $q, $translate, $sce, $rootScope, gaPopup,
          gaLayers, gaBrowserSniffer, gaMapClick, gaDebounce, gaPreviewFeatures,
          gaMapUtils, gaTopic, gaIdentify, gaPermalink, gaIFrameCom, gaUrlUtils,
          gaLang, gaSanitize, gaEvent, gaWindow, gaGlobalOptions) {
        var popupContent =
          '<div ng-repeat="html in options.htmls track by $index" ' +
               'ng-mouseenter="options.onMouseEnter($event,' +
                   'options.htmls.length)" ' +
               'ng-mouseleave="options.onMouseLeave($event)">' +
            '<div ng-bind-html="html.snippet"></div>' +
            '<div ng-if="html.showVectorInfos" class="ga-vector-tools">' +
              '<div ga-measure="html.feature" ' +
                    'ga-coordinate-precision="3"></div>' +
              '<div ng-if="html.showProfile" ' +
                   'ga-profile-bt="html.feature"></div>' +
            '</div>' +
            '<div ga-shop ' +
                 'ga-shop-map="::html.map" ' +
                 'ga-shop-feature="html.feature" ' +
                 'ga-shop-clipper-geometry="html.clickGeometry"></div>' +
            '<div class="ga-tooltip-separator" ' +
                 'ng-show="!$last"></div>' +
          '</div>';

        // Get all the queryable layers
        var getLayersToQuery = function(map, is3dActive) {
          var layersToQuery = {
            bodLayers: [],
            vectorLayers: [],
            wmsLayers: [],
            // INGRID: Add 'wmtsLayers'
            wmtsLayers: []
          };
          map.getLayers().forEach(function(l) {
            if (!l.visible || l.preview) {
              return;
            }

            if (gaMapUtils.isVectorLayer(l)) {
              layersToQuery.vectorLayers.push(l);
            // INGRID: Check wms and wmts
            } else if (gaLayers.hasTooltipBodLayer(l, is3dActive) &&
                !gaMapUtils.isWMSLayer(l) &&
                !gaMapUtils.isWMTSLayer(l)) {
              layersToQuery.bodLayers.push(l);
            } else if (gaMapUtils.isWMSLayer(l) &&
                (gaLayers.hasTooltipBodLayer(l) || l.get('queryable'))) {
              // INGRID: Check tooltip param
              // INGRID: Add wms layers to 'wmsLayers'
              layersToQuery.wmsLayers.push(l);
            } else if (gaMapUtils.isWMTSLayer(l) &&
                (gaLayers.hasTooltipBodLayer(l) || l.get('queryable') ||
                (gaMapUtils.isExternalWmtsLayer(l) &&
                    l.getSource().get('featureInfoTpl')))) {
              // INGRID: Add check external wmts with featureInfoTpl
              layersToQuery.wmtsLayers.push(l);
            }
          });
          return layersToQuery;
        };

        // Test if a feature is queryable.
        var isFeatureQueryable = function(feature) {
          if (!feature) {
            return false;
          }
          var geom = feature.getGeometry();
          // INGRID: Add 'bwastrid', 'feature.get('desc')'
          return feature.get('name') || feature.get('description') ||
              feature.get('desc') ||
              !(geom instanceof ol.geom.MultiPoint ||
              geom instanceof ol.geom.MultiLineString ||
              geom instanceof ol.geom.MultiPolygon ||
              geom instanceof ol.geom.GeometryCollection) ||
              feature.get('bwastrid');
        };

        // Find the closest feature from pixel in a vector layer
        var findVectorFeature = function(map, pixel, tolerance, vectorLayer) {
          var featureFound;
          map.forEachFeatureAtPixel(pixel,
              function(feature, layer) {
              // checking if feature can be selected by users
              // we pick the first of the stack, so that features with higher
              // z-index (in the KML) will be chosen over deeper ones.
                if (!feature.getProperties().unselectable && !featureFound) {
                  featureFound = feature;
                }
              },
              // options for method forEachFeatureAtPixel
              {
              // see TooltipController.js for default tolerance values
                hitTolerance: tolerance,
                // filtering layers so that only the current layer is queried
                layerFilter: function(layerCandidate) {
                  return layerCandidate && vectorLayer &&
                  // if both layers have a bodId we filter by bodId
                  ((layerCandidate.bodId && vectorLayer.bodId &&
                       layerCandidate.bodId === vectorLayer.bodId) ||
                      // otherwise we look at OL unique ID for both layers
                      layerCandidate.ol_uid === vectorLayer.ol_uid)
                  ;
                }
              }
          );
          return featureFound;
        };

        // Change cursor style on mouse move, only on desktop
        var mapDiv;
        var updateCursorStyle = function(map, pixel) {
          var feature;
          var hasQueryableLayer = false;
          if (!mapDiv) {
            mapDiv = $(map.getTarget());
          }
          if (!gaBrowserSniffer.msie || gaBrowserSniffer.msie > 10) {
            /* INGRID: Not in use
            var coord = map.getCoordinateFromPixel(pixel);
            */
            hasQueryableLayer = map.forEachLayerAtPixel(pixel,
                function() {
                  return true;
                }, {
                  'layerFilter': function(layer) {
                  /* INGRID: Add check for crossOrigin
                  // EDGE: An IndexSizeError is triggered by the
                  // map.forEachLayerAtPixel when the mouse is outside the
                  // extent of switzerland (west, north). So we avoid triggering
                  // this function outside a layer's extent.
                  var extent = layer.getExtent();
                  if (extent && !ol.extent.containsXY(extent, coord[0],
                      coord[1])) {
                    return false;
                  }
                  return gaLayers.hasTooltipBodLayer(layer);
                  */
                    return gaLayers.hasTooltipBodLayer(layer) &&
                    layer.getSource().crossOrigin;
                  }
                });
          }
          if (!hasQueryableLayer) {
            feature = findVectorFeature(map, pixel);
          }
          if (hasQueryableLayer || feature) {
            mapDiv.addClass('ga-pointer');
          } else {
            mapDiv.removeClass('ga-pointer');
          }
        };
        var updateCursorStyleDebounced = gaDebounce.debounce(
            updateCursorStyle, 10, false, false);

        // Register click/touch/mousemove events on map
        var deregMapEvents = angular.noop;
        var registerMapEvents = function(scope, onClick) {
          if (deregMapEvents !== angular.noop) {
            return;
          }
          var map = scope.map;
          var onMapClick = function(evt) {
            var coordinate = (evt.originalEvent) ?
              map.getEventCoordinate(evt.originalEvent) :
              evt.coordinate;

            // A digest cycle is necessary for $http requests to be
            // actually sent out. Angular-1.2.0rc2 changed the $evalSync
            // function of the $rootScope service for exactly this. See
            // Angular commit 6b91aa0a18098100e5f50ea911ee135b50680d67.
            // We use a conservative approach and call $apply ourselves
            // here, but we instead could also let $evalSync trigger a
            // digest cycle for us.

            scope.$applyAsync(function() {
              onClick(coordinate);
            });
          };
          var deregMapClick = gaMapClick.listen(map, onMapClick);
          var deregPointerMove = map.on('pointermove', function(evt) {
            if (!gaEvent.isMouse(evt)) {
              return;
            }
            updateCursorStyleDebounced(map, evt.pixel);
          });
          deregMapEvents = function() {
            deregMapClick();
            ol.Observable.unByKey(deregPointerMove);
            deregMapEvents = angular.noop;
          };
        };

        // Register leftclick event on globe
        var deregGlobeEvents = angular.noop;
        var registerGlobeEvents = function(scope, onClick) {
          if (deregGlobeEvents !== angular.noop) {
            return;
          }
          var ms = 0;
          var blockNextLeftClick = false;
          var scene = scope.ol3d.getCesiumScene();
          var ellipsoid = scene.globe.ellipsoid;
          var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
          handler.setInputAction(function(evt, a, b) {
            if (blockNextLeftClick && (new Date() - ms) < 1000) {
              blockNextLeftClick = false;
              return;
            }
            var cartesian = olcs.core.pickOnTerrainOrEllipsoid(scene,
                evt.position);
            if (cartesian) {
              var cartographic = ellipsoid.cartesianToCartographic(cartesian);
              var coordinate = ol.proj.transform([
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude)
              ], 'EPSG:4326', scope.map.getView().getProjection());
            }
            scope.$applyAsync(function() {
              onClick(coordinate, evt.position);
            });
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

          handler.setInputAction(function(evt, a, b) {
            blockNextLeftClick = true;
            ms = new Date();
          }, Cesium.ScreenSpaceEventType.PINCH_END);

          deregGlobeEvents = function() {
            if (!handler.isDestroyed()) {
              handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
              handler.removeInputAction(Cesium.ScreenSpaceEventType.PINCH_END);
              handler.destroy();
              deregGlobeEvents = angular.noop;
            }
          };
        };

        return {
          restrict: 'A',
          scope: {
            map: '=gaTooltipMap',
            ol3d: '=gaTooltipOl3d',
            options: '=gaTooltipOptions',
            isActive: '=gaTooltipActive'
          },
          link: function(scope, element, attrs) {
            var htmls = [],
              featuresByLayerId = {},
              onCloseCB = angular.noop,
              map = scope.map,
              popup,
              canceler,
              listenerKey,
              parser = new ol.format.GeoJSON();

            var is3dActive = function() {
              return scope.ol3d && scope.ol3d.getEnabled();
            };

            // Destroy the popup specified when needed
            var destroyPopup = function() {
              $timeout(function() {
                // We destroy the popup only if it's still closed
                if (popup && popup.scope && popup.scope.toggle === false) {
                  popup.destroy();
                  popup = undefined;
                }
              }, 0);
            };

            var cancelRequests = function() {
              // Cancel all pending requests
              if (canceler) {
                canceler.resolve();
              }
              // Create new cancel object
              canceler = $q.defer();
            };

            // Destroy popup and highlight
            var initTooltip = function() {
              cancelRequests();
              // htmls = [] would break the reference in the popup
              htmls.splice(0, htmls.length);
              featuresByLayerId = {};
              if (popup) {
                popup.close();
              }

              // Clear the preview features
              gaPreviewFeatures.clear(map);

              // Close the profile popup
              $rootScope.$broadcast('gaProfileActive');

              // Remove the remove layer listener if exist
              if (listenerKey) {
                ol.Observable.unByKey(listenerKey);
              }
            };
            scope.$on('gaTopicChange', initTooltip);
            scope.$on('gaTriggerTooltipInit', initTooltip);
            scope.$on('gaTriggerTooltipRequest', function(event, data) {
              if (!data.nohighlight) {
                initTooltip();
              }

              // We use $timeout to execute the showFeature when the
              // popup is correctly closed.
              $timeout(function() {
                showFeatures(data.features, null, data.nohighlight);
                onCloseCB = data.onCloseCB;
              }, 0);
            });
            var reloadHtmlByIndex = function(i) {
              var feat = htmls[i].feature;
              if (feat && feat.layerBodId) {
                getFeaturePopupHtml(feat.layerBodId, feat.id).
                    then(function(response) {
                      htmls[i].snippet = $sce.trustAsHtml(response.data);
                    });
              }
            };
            // TODO handle vector layer toolip
            $rootScope.$on('$translateChangeEnd', function() {
              if (scope.isActive && htmls.length) {
                cancelRequests();
                for (var i = 0; i < htmls.length; i++) {
                  reloadHtmlByIndex(i);
                }
              }
            });

            scope.$on('gaTriggerTooltipInitOrUnreduce', function(event) {
              if (popup && popup.scope.options.isReduced) {
                popup.close();
              } else {
                initTooltip();
              }
            });

            // Register the click on globe when ol3d is ready
            scope.$watch('::ol3d', function(ol3d) {
              if (ol3d) {
                // Listen when the app switch between 2d/3d
                scope.$watch(function() {
                  return scope.ol3d.getEnabled();
                }, function(enabled) {
                  if (scope.isActive) {
                    if (enabled) {
                      deregMapEvents();
                      registerGlobeEvents(scope, findFeatures);
                    } else {
                      deregGlobeEvents();
                      registerMapEvents(scope, findFeatures);
                    }
                  }
                });
              }
            });

            var activate = function() {
              if (is3dActive()) {
                registerGlobeEvents(scope, findFeatures);
              } else {
                registerMapEvents(scope, findFeatures);
              }
            };

            var deactivate = function() {
              // Remove the highlighted feature when we deactivate the tooltip
              initTooltip();
              deregMapEvents();
              deregGlobeEvents();
            };

            scope.$watch('isActive', function(active) {
              if (scope.map && active) {
                activate();
              } else {
                if (scope.isActive === true) {
                  scope.isActive = false;
                }
                deactivate();
              }
            });

            scope.$on('destroy', function() {
              deactivate();
            });

            // Find features for all type of layers
            var findFeatures = function(coordinate, position3d) {
              initTooltip();
              /* INGRID: Remove check not needed
              if (!coordinate ||
                 !ol.extent.containsCoordinate(gaMapUtils.defaultExtent,
                     coordinate)) {
                return;
              }
              */
              // Use by the ga-shop directive
              scope.clickCoordinate = coordinate;
              var pointerShown = $(map.getTarget()).css('cursor') === 'pointer';
              var mapRes = map.getView().getResolution();
              var mapProj = map.getView().getProjection();
              var pixel = map.getPixelFromCoordinate(coordinate);
              var all = []; // List of promises launched
              var layersToQuery = getLayersToQuery(map, is3dActive());

              // When 3d is Active we use the cesium native function to get the
              // first queryable feature.
              if (is3dActive()) {
                // 10 is to avoid an infinite loop see:
                // https://github.com/AnalyticalGraphicsInc/cesium/issues/5971
                var pickedObjects = scope.ol3d.getCesiumScene().
                    drillPick(position3d, 10);
                for (var i = 0, ii = pickedObjects.length; i < ii; i++) {
                  var feat;
                  var prim = pickedObjects[i].primitive;
                  var entity = pickedObjects[i].id;
                  if (prim && prim.olFeature) {
                    feat = prim.olFeature;
                  } else if (entity && entity.olFeature) {
                    feat = entity.olFeature;
                  }
                  if (isFeatureQueryable(feat)) {
                    var lay = prim.olLayer || entity.olLayer;
                    showVectorFeature(feat, lay);
                    all.push($q.when(1));
                    break;
                  }
                }
              } else {
                // Go through queryable vector layers
                // Launch no requests.
                layersToQuery.vectorLayers.forEach(function(layerToQuery) {
                  var config = gaLayers.getLayer(layerToQuery.bodId);
                  var shopLayer = config && config.shop && !config.shopMulti;
                  var tolerance = shopLayer ? 0 : scope.options.tolerance;
                  var feature = findVectorFeature(map, pixel, tolerance,
                      layerToQuery);
                  if (feature) {
                    showVectorFeature(feature, layerToQuery);
                    all.push($q.when(1));
                  }
                });
              }

              // Go through all queryable bod layers.
              // Launch identify requests.
              layersToQuery.bodLayers.forEach(function(layerToQuery) {
                var config = gaLayers.getLayer(layerToQuery.bodId);
                var geometry = new ol.geom.Point(coordinate);
                var returnGeometry = !!config.highlightable;
                var shopLayer = config.shop && !config.shopMulti;
                var shopMultiLayer = config.shopMulti;

                var order = shopMultiLayer ? 'distance' : null;
                var tol = shopLayer ? 0 : scope.options.tolerance;

                all.push(gaIdentify.get(map, [layerToQuery], geometry, tol,
                    returnGeometry, canceler.promise, 10, order).then(
                    function(response) {
                      showFeatures(response.data.results, coordinate);
                      return response.data.results.length;
                    }));
              });

              // Go through queryable wms layers
              // Launch GetFeatureInfo requests.
              layersToQuery.wmsLayers.forEach(function(layerToQuery) {
                var extent = layerToQuery.getExtent();
                if (extent && !ol.extent.containsCoordinate(extent,
                    coordinate)) {
                  return;
                }
                // INGRID: Add queryLayers, set TRANSPARENT param
                var params = {
                  'INFO_FORMAT': 'text/html',
                  'LANG': gaLang.get(),
                  'TRANSPARENT': false,
                  'FEATURE_COUNT': layerToQuery.featureCount || 10
                };
                if (layerToQuery.queryLayers) {
                  angular.extend(params, {
                    'QUERY_LAYERS': layerToQuery.queryLayers.trim()
                  });
                }
                var url = layerToQuery.getSource().getGetFeatureInfoUrl(
                    coordinate, mapRes, mapProj,
                    params
                );
                if (!is3dActive() && url) {
                  gaUrlUtils.proxifyUrl(url).then(function(proxyUrl) {
                    if (layerToQuery.get('auth')) {
                      proxyUrl += '&login=' +
                      encodeURIComponent(layerToQuery.get('auth'));
                    }
                    proxyUrl += '&isFeatureInfo=true';
                    all.push($http.get(proxyUrl, {
                      timeout: canceler.promise,
                      layer: layerToQuery
                    }).then(function(response) {
                      var text = response.data;
                      if (/(Server Error|ServiceException)/.test(text)) {
                        return 0;
                      }
                      var feat = new ol.Feature({
                        geometry: null,
                        // INGRID: Remove '<pre>' HTML tag
                        description: text
                      });
                      showVectorFeature(feat, response.config.layer);
                      return 1;
                    }));
                  });
                }
              });

              // INGRID: Add WMTS GetFeatureInfo
              layersToQuery.wmtsLayers.forEach(function(layerToQuery) {
                var extent = layerToQuery.getExtent();
                if (extent && !ol.extent.containsCoordinate(extent,
                    coordinate)) {
                  return;
                }
                // INGRID: Add queryLayers, featureCount
                var params = {
                  'INFO_FORMAT': 'text/html',
                  'LANG': gaLang.get(),
                  'FEATURE_COUNT': layerToQuery.featureCount || 10
                };
                if (layerToQuery.queryLayers) {
                  angular.extend({
                    'QUERY_LAYERS': layerToQuery.queryLayers.trim()
                  }, params);
                }
                var url = gaMapUtils.getWMTSFeatureInfoUrl(layerToQuery.
                    getSource(), coordinate, mapRes, mapProj, params);
                if (!is3dActive() && url) {
                  gaUrlUtils.proxifyUrl(url).then(function(proxyUrl) {
                    proxyUrl += '&isFeatureInfo=true';
                    all.push($http.get(proxyUrl, {
                      timeout: canceler.promise,
                      layer: layerToQuery
                    }).then(function(response) {
                      var text = response.data;
                      if (/(Server Error|ServiceException)/.test(text)) {
                        return 0;
                      }
                      var feat = new ol.Feature({
                        geometry: null,
                        // INGRID: Remove '<pre>' HTML tag
                        description: text
                      });
                      showVectorFeature(feat, response.config.layer);
                      return 1;
                    }));
                  });
                }
              });

              // When all the requests are finished we test how many features
              // are displayed. If there is none and the cursor was a pointer
              // in the moment of the click, we show a no-info box for
              // 3 seconds. As we show pointer only on desktop, this also
              // means that no-info box is never shown on mobile
              if (all.length > 0) {
                $q.all(all).then(function(nbResults) {
                  var sum = nbResults.reduce(function(a, b) {
                    return a + b;
                  });
                  if (sum === 0 && pointerShown) {
                    showNoInfo();
                  }
                });
              }
            };

            var getFeaturePopupHtml = function(bodId, featureId, coordinate) {
              var mapSize = map.getSize();
              var mapExtent = map.getView().calculateExtent(mapSize);
              var htmlUrl = scope.options.htmlUrlTemplate.
                  replace('{Topic}', gaTopic.get().id).
                  replace('{Layer}', bodId).
                  replace('{Feature}', featureId);
              return $http.get(htmlUrl, {
                timeout: canceler.promise,
                cache: true,
                params: {
                  lang: gaLang.get(),
                  mapExtent: mapExtent.toString(),
                  coord: (coordinate) ? coordinate.toString() : undefined,
                  imageDisplay: mapSize.toString() + ',96',
                  sr: map.getView().getProjection().getCode().split(':')[1]
                }
              });
            };

            var storeFeature = function(layerId, feature) {
              if (!featuresByLayerId[layerId]) {
                featuresByLayerId[layerId] = {};
              }
              var featureId = feature.getId();
              featuresByLayerId[layerId][featureId] = feature;
            };

            // Highlight the features found
            var showFeatures = function(foundFeatures, coordinate,
                nohighlight) {
              // if url param disableTooltip is eq to true, no tooltip is to
              // be shown for this instance of map.
              if (gaGlobalOptions.disableTooltip) {
                return;
              }
              if (foundFeatures && foundFeatures.length > 0) {
                // Remove the tooltip, if a layer is removed, we don't care
                // which layer. It worked like that in RE2.
                listenerKey = map.getLayers().on('remove',
                    function(evt) {
                      if (evt.element.displayInLayerManager) {
                        initTooltip();
                      }
                    }
                );
                angular.forEach(foundFeatures, function(value) {
                  if (value instanceof ol.Feature) {
                    if (!nohighlight) {
                      var layerId = value.get('layerId');
                      var feature = new ol.Feature(value.getGeometry());
                      feature.setId(value.getId());
                      feature.set('layerId', layerId);
                      gaPreviewFeatures.add(map, feature);
                      // Store the ol feature for highlighting
                      storeFeature(layerId, feature);
                    }
                    if (value.get('htmlpopup')) {
                      showPopup(gaSanitize.html(value.get('htmlpopup')), value);
                    } else if (value.getProperties()['description']) {
                      showPopup(gaSanitize.html(
                          value.getProperties()['description']), value);
                    }
                  } else {
                    // draw feature, but only if it should be drawn
                    if (!nohighlight &&
                        gaLayers.getLayer(value.layerBodId) &&
                        gaLayers.getLayerProperty(value.layerBodId,
                            'highlightable')) {
                      var features = parser.readFeatures(value);
                      for (var i = 0, ii = features.length; i < ii; ++i) {
                        features[i].set('layerId', value.layerBodId);
                        gaPreviewFeatures.add(map, features[i]);
                        storeFeature(value.layerBodId, features[i]);
                      }
                    }
                    getFeaturePopupHtml(value.layerBodId, value.featureId,
                        coordinate).then(function(response) {
                      showPopup(response.data, value);
                    });
                  }
                });
              }
            };

            // Create the html popup for a feature then display it.
            var showVectorFeature = function(feature, layer) {
              var label = layer.label ||
                  $translate.instant(feature.getProperties().label);
              var htmlpopup =
                '<div id="{{id}}" class="htmlpopup-container">' +
                  '<div class="htmlpopup-header">' +
                    '<span>' + label + ' &nbsp;</span>' +
                    '{{name}}' +
                  '</div>' +
                  '<div class="htmlpopup-content">' +
                    '{{descr}}' +
                  '</div>' +
                '</div>';
              var name = feature.get('name');
              var featureId = feature.getId();
              var layerId = feature.get('layerId') || layer.id;
              var id = layerId + '#' + featureId;
              // INGRID: Change description
              var descr = '';
              if (feature.get('description') || feature.get('desc')) {
                descr = feature.get('description') || feature.get('desc');
                if (descr.indexOf('<html') === -1) {
                  descr = descr.replaceAll('\n', '<br>');
                }
              }
              htmlpopup = htmlpopup.
                  replace('{{id}}', id).
                  replace('{{descr}}', descr).
                  replace('{{name}}', (name) ? '(' + name + ')' : '');

              // INGRID: Add pop up for 'bwalocator'
              var downloadName = ''
              var props = feature.getProperties();
              if (feature.get('bwastrid')) {
                downloadName += props.bwastrid;
                downloadName += '-';
                downloadName += props.bwastr_name;
                if (props.strecken_name) {
                  downloadName += '-';
                  downloadName += props.strecken_name;
                }
                downloadName += '.csv';
                htmlpopup = getBWaStrHtmlPopup(layer, feature, downloadName);
              } else if (feature.get('track_nr')) {
                downloadName += props.track_nr;
                downloadName += '-';
                downloadName += props.name;
                if (props.from_kilometry) {
                  downloadName += '-';
                  downloadName += props.from_kilometry;
                }
                if (props.to_kilometry) {
                  downloadName += '-';
                  downloadName += props.to_kilometry;
                }
                downloadName += '.json';
                htmlpopup = getEbaStrHtmlPopup(layer, feature, downloadName);
              }
              feature.set('htmlpopup', htmlpopup);
              if (!isFeatureQueryable(feature)) {
                feature.set('htmlpopup', undefined);
              }
              feature.set('layerId', layerId);
              showFeatures([feature]);

              // INGRID: IE download
              if (navigator.msSaveBlob) {
                $(document).on('click', '.activated', function() {
                  if (this.className) {
                    var blob = null;
                    if (this.className.
                        indexOf('bwastr_download_csv activated') > -1) {
                      if (this.bwastrContent) {
                        blob = new Blob([decodeURI(this.bwastrContent)],
                            {type: 'text/csv;charset=utf-8;'});
                        navigator.msSaveBlob(blob, downloadName);
                        $(this).removeClass('activated');
                      }
                    } else if (this.className.
                        indexOf('ebastr_download_json activated') > -1) {
                      if (this.ebastrContent) {
                        blob = new Blob([decodeURI(this.ebastrContent)],
                            {type: 'text/csv;charset=utf-8;'});
                        navigator.msSaveBlob(blob, downloadName);
                        $(this).removeClass('activated');
                      }
                    }
                  }
                });
              }

              // Iframe communication from inside out
              if (layer.get('type') === 'KML') {
                layerId = layer.label;
                if (name && name.length) {
                  featureId = name;
                }
              }
              gaIFrameCom.send('gaFeatureSelection', {
                layerId: layerId,
                featureId: featureId
              });

              // We leave the old code to not break existing clients
              // Once they have adapted to new implementation, we
              // can remove the code below
              if (window.top !== window) {
                if (featureId && layerId) {
                  window.parent.postMessage(id, '*');
                }
              }
            };

            var getBWaStrHtmlPopup = function(layer, feature, downloadName) {
                var htmlpopup =
                  '<div class="htmlpopup-container">' +
                    '<div class="htmlpopup-header">' +
                      '<span>' + layer.label + ' &nbsp;</span>' +
                      '(BWaStr Locator)' +
                    '</div>' +
                    '<div class="htmlpopup-content">';
                htmlpopup += '<table><tbody>';
                htmlpopup += '<tr><td>Id:</td><td>' +
                  feature.get('bwastrid') + '</td></tr>';
                htmlpopup += '<tr><td>Name:</td><td>' +
                  feature.get('bwastr_name') + '</td></tr>';
                htmlpopup += '<tr><td>Bezeichnung:</td><td>' +
                  feature.get('strecken_name') + '</td></tr>';
                if (feature.get('km_wert')) {
                  htmlpopup += '<tr><td>KM:</td><td>' +
                    feature.get('km_wert') + ' km</td></tr>';
                } else {
                  htmlpopup += '<tr><td>Von:</td><td>' +
                    feature.get('km_von') + ' km</td></tr>';
                  htmlpopup += '<tr><td>Bis:</td><td>' +
                    feature.get('km_bis') + ' km</td></tr>';
                }
                htmlpopup += '</tbody></table><br>';

                var downloadContent = '';
                var encodedUri = '';

                var coords = feature.getGeometry().getCoordinates();
                var props = feature.getProperties();
                var measures = props.measures;

                var coordMeasures = [];
                var count = 0;
                if (measures.length === 1) {
                  coordMeasures.push([coords[0] + '', coords[1] + '',
                    measures[0] + '']);
                } else {
                  for (var j = 0; j < coords.length; j++) {
                    var coord = coords[j];
                    if (coord instanceof Array) {
                      for (var k = 0; k < coord.length; k++) {
                        var coordinateEntry = coord[k];
                        var measure = '0';
                        if (measures[count]) {
                          measure = measures[count];
                        }
                        coordMeasures.push([coordinateEntry[0] + '',
                          coordinateEntry[1] + '', measure + '']);
                        count++;
                      }
                      coordMeasures.sort(function(a, b) {
                        var measureA = a.measure;
                        var measureB = b.measure;
                        if (measureA < measureB) return -1;
                        if (measureA > measureB) return 1;
                        return 0;
                      });
                    }
                  }
                }
                coordMeasures.forEach(function(array, index) {
                  var dataString = array.join(';');
                  downloadContent += index < coordMeasures.length ?
                    dataString + '\n' : dataString;
                });

                if (navigator.msSaveBlob) { // IE 10+
                  downloadContent += downloadContent;
                  encodedUri = encodeURI(downloadContent);
                  htmlpopup += '<p><a class="bwastr_download_csv"' +
                    'href="javascript:void(0);" onclick="$(this).' +
                    'addClass(\'activated\');this.bwastrContent=\'' +
                    encodedUri + '\';">Strecke als CSV</a></p>';
                } else {
                  downloadContent = 'data:text/csv;charset=utf-8,' +
                    downloadContent;
                  encodedUri = encodeURI(downloadContent);
                  htmlpopup += '<p><a class="bwastr_download_csv" href="' +
                    encodedUri + '" download="' + downloadName +
                    '">Strecke als CSV</a></p>';
                }

                htmlpopup += '</div>';
                htmlpopup += '</div>';
                return htmlpopup;
            }

            var getEbaStrHtmlPopup = function(layer, feature, downloadName) {
                var htmlpopup =
                  '<div class="htmlpopup-container">' +
                    '<div class="htmlpopup-header">' +
                      '<span>' + layer.label + ' &nbsp;</span>' +
                      '(Strecken Locator)' +
                    '</div>' +
                    '<div class="htmlpopup-content">';
                htmlpopup += '<table><tbody>';
                htmlpopup += '<tr><td>' +
                  $translate.instant('ebalocator_context_id') +
                  '</td><td>' +
                  feature.get('track_nr') +
                  '</td></tr>';
                htmlpopup += '<tr><td>' +
                  $translate.instant('ebalocator_context_name') +
                  '</td><td>' +
                  feature.get('name') +
                  '</td></tr>';
                htmlpopup += '<tr><td>' +
                  $translate.instant('ebalocator_context_type') +
                  '</td><td>' +
                  (feature.get('track_type') ? feature.get('track_type') :
                  feature.get('to_track_type')) +
                  '</td></tr>';
                htmlpopup += '<tr><td>' +
                  $translate.instant('ebalocator_context_crs') +
                  '</td><td>' +
                  gaGlobalOptions.defaultEpsg.split(':')[1] +
                  '</td></tr>';
                var coordinate = feature.get('to_coordinate');
                if (!coordinate) {
                  if (feature.getGeometry()) {
                    coordinate = feature.getGeometry().getCoordinates();
                  }
                }
                if (coordinate) {
                  htmlpopup += '<tr><td>' +
                    $translate.instant('ebalocator_context_lon') +
                    '</td><td>' +
                    coordinate[0] +
                    '</td></tr>';
                  htmlpopup += '<tr><td>' +
                    $translate.instant('ebalocator_context_lat') +
                    '</td><td>' +
                    coordinate[1] +
                    '</td></tr>';
                }
                if (feature.get('kilometryDecimal')) {
                    htmlpopup += '<tr><td>' +
                      $translate.instant('ebalocator_context_km_dec') +
                      '</td><td>' +
                      feature.get('kilometryDecimal') +
                      '</td></tr>';
                    htmlpopup += '<tr><td>' +
                      $translate.instant('ebalocator_context_km') +
                      '</td><td>' +
                      feature.get('kilometryDatabase') +
                      '</td></tr>';
                    htmlpopup += '<tr><td>' +
                      $translate.instant('ebalocator_context_km_ing') +
                      '</td><td>' +
                      feature.get('kilometryEngineering') +
                      '</td></tr>';
                } else if (feature.get('to_kilometryDecimal') ||
                        feature.get('from_kilometryDecimal')) {
                    if (feature.get('from_kilometryDecimal')) {
                        htmlpopup += '<tr><td><b>' +
                          $translate.instant('ebalocator_context_from') +
                          '</b></td><td></td></tr>';
                        htmlpopup += '<tr><td>' +
                          $translate.instant('ebalocator_context_km_dec') +
                          '</td><td>' +
                          feature.get('from_kilometryDecimal') +
                          '</td></tr>';
                        htmlpopup += '<tr><td>' +
                          $translate.instant('ebalocator_context_km') +
                          '</td><td>' +
                          feature.get('from_kilometryDatabase') +
                          '</td></tr>';
                        htmlpopup += '<tr><td>' +
                          $translate.instant('ebalocator_context_km_ing') +
                          '</td><td>' +
                          feature.get('from_kilometryEngineering') +
                          '</td></tr>';
                    }
                    if (feature.get('to_kilometryDecimal')) {
                        htmlpopup += '<tr><td><b>' +
                          $translate.instant('ebalocator_context_to') +
                          '</b></td><td></td></tr>';
                        htmlpopup += '<tr><td>' +
                          $translate.instant('ebalocator_context_km_dec') +
                          '</td><td>' +
                          feature.get('to_kilometryDecimal') +
                          '</td></tr>';
                        htmlpopup += '<tr><td>' +
                          $translate.instant('ebalocator_context_km') +
                          '</td><td>' +
                          feature.get('to_kilometryDatabase') +
                          '</td></tr>';
                        htmlpopup += '<tr><td>' +
                          $translate.instant('ebalocator_context_km_ing') +
                          '</td><td>' +
                          feature.get('to_kilometryEngineering') +
                          '</td></tr>';
                    }
                }
                htmlpopup += '</tbody></table><br>';

                var downloadContent = layer.get("downloadContent");
                var encodedUri = '';

                if (navigator.msSaveBlob) { // IE 10+
                  downloadContent += downloadContent;
                  encodedUri = encodeURI(downloadContent);
                  htmlpopup += '<p><a class="ebastr_download_json"' +
                    'href="javascript:void(0);" onclick="$(this).' +
                    'addClass(\'activated\');this.ebastrContent=\'' +
                    encodedUri + '\';">Strecke als JSON</a></p>';
                } else {
                  downloadContent = 'data:application/json;charset=utf-8,' +
                    downloadContent;
                  encodedUri = encodeURI(downloadContent);
                  htmlpopup += '<p><a class="ebastr_download_json" href="' +
                    encodedUri + '" download="' + downloadName +
                    '">Strecke als JSON</a></p>';
                }

                htmlpopup += '</div>';
                htmlpopup += '</div>';
                return htmlpopup;
            }

            var showNoInfo = function() {
              if (!popup) {
                popup = gaPopup.create({
                  className: 'ga-tooltip',
                  showReduce: false,
                  title: 'object_information',
                  content: '<div class="ga-popup-no-info" translate>' +
                      'no_more_information</div>',
                  onCloseCallback: function() {
                    destroyPopup();
                  }
                });
              }
              popup.open(3000); // Close after 3 seconds
            };

            // Show the popup with all features informations
            var showPopup = function(html, value) {
              // Don't show popup when notooltip parameter is active
              // (embedded only)
              if (gaBrowserSniffer.embed &&
                  gaPermalink.getParams().notooltip === 'true') {
                return;
              }

              // Show popup on first result
              if (htmls.length === 0) {

                // always reposition element when newly opened
                var x;
                if (gaWindow.isWidth('>s')) {
                  x = function(element) {
                    return map.getSize()[0] -
                        parseFloat(element.css('max-width')) - 58;
                  };
                }
                if (!popup) {
                  popup = gaPopup.create({
                    className: 'ga-tooltip ga-popup-mobile-bottom',
                    x: x,
                    onCloseCallback: function() {
                      if (onCloseCB) {
                        onCloseCB();
                      }
                      onCloseCB = angular.noop;
                      gaPreviewFeatures.clear(map);
                      destroyPopup();
                    },
                    onMouseEnter: function(evt, nbTooltips) {
                      if (nbTooltips === 1) return;
                      var target = $(evt.currentTarget);
                      var containerId = target.find('.htmlpopup-container').
                          attr('id');
                      if (/#/.test(containerId)) {
                        var split = containerId.split('#');
                        var featByLayer = featuresByLayerId[split[0]];
                        if (!featByLayer) {
                          return;
                        }
                        var feat = featByLayer[split[1]];
                        if (feat.getGeometry()) {
                          target.addClass('ga-active');
                          gaPreviewFeatures.highlight(map, feat);
                        }
                      }
                    },
                    onMouseLeave: function(evt) {
                      $(evt.currentTarget).removeClass('ga-active');
                      gaPreviewFeatures.clearHighlight();
                    },
                    title: 'object_information',
                    content: popupContent,
                    htmls: htmls,
                    showPrint: true
                  });
                }
                popup.open();
              }
              // Add result to array. ng-repeat will take
              // care of the rest
              var params = {
                map: scope.map,
                feature: value,
                showVectorInfos: (value instanceof ol.Feature),
                snippet: $sce.trustAsHtml(html),
                showProfile: !gaBrowserSniffer.embed &&
                    value instanceof ol.Feature && value.getGeometry()
              };
              if (scope.clickCoordinate !== undefined &&
                      scope.clickCoordinate.length === 2) {
                params['clickGeometry'] =
                    new ol.geom.Point(scope.clickCoordinate)
              }
              htmls.push(params);
            };
          }
        };
      });
})();
