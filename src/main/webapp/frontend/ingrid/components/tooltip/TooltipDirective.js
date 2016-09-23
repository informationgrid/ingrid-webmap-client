goog.provide('ga_tooltip_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_identify_service');
goog.require('ga_iframe_com_service');
goog.require('ga_map_service');
goog.require('ga_popup_service');
goog.require('ga_previewfeatures_service');
goog.require('ga_time_service');
goog.require('ga_topic_service');

(function() {

  var module = angular.module('ga_tooltip_directive', [
    'ga_browsersniffer_service',
    'ga_debounce_service',
    'ga_identify_service',
    'ga_iframe_com_service',
    'ga_map_service',
    'ga_popup_service',
    'ga_previewfeatures_service',
    'ga_time_service',
    'ga_topic_service',
    'pascalprecht.translate'
  ]);

  module.directive('gaTooltip',
      function($timeout, $http, $q, $translate, $sce, gaPopup, gaLayers,
          gaBrowserSniffer, gaMapClick, gaDebounce, gaPreviewFeatures,
          gaMapUtils, gaTime, gaTopic, gaIdentify, gaGlobalOptions,
          gaPermalink, gaIFrameCom) {
        var mouseEvts = '';
        if (!gaBrowserSniffer.mobile) {
          mouseEvts = 'ng-mouseenter="options.onMouseEnter($event,' +
              'options.htmls.length)" ' +
              'ng-mouseleave="options.onMouseLeave($event)" ';
        }
        var popupContent =
          '<div ng-repeat="html in options.htmls" ' +
               'ng-mouseenter="options.onMouseEnter($event,' +
                   'options.htmls.length)" ' +
               'ng-mouseleave="options.onMouseLeave($event)">' +
            '<div ng-bind-html="html.snippet"></div>' +
            '<div ga-shop ' +
                 'ga-shop-map="::html.map" ' +
                 'ga-shop-feature="::html.feature" ' +
                 'ga-shop-clipper-geometry="::html.clickGeometry"></div>' +
            '<div class="ga-tooltip-separator" ' +
                 'ng-show="!$last"></div>' +
          '</div>';

        var getOlParentLayer = function(olLayer) {
          var parentLayerBodId = gaLayers.getBodParentLayerId(olLayer);
          return gaLayers.getOlLayerById(parentLayerBodId) || olLayer;
        };

        // Get all the queryable layers
        var getLayersToQuery = function(map) {
          var layersToQuery = {
            bodLayers: [],
            vectorLayers: [],
            wmsLayers: []
          };
          map.getLayers().forEach(function(l) {
            if (!l.visible || l.preview) {
              return;
            }

            if (gaMapUtils.isVectorLayer(l)) {
              layersToQuery.vectorLayers.push(l);
            // INGRID: Add wms layers to 'wmsLayers'
            } else if (gaLayers.hasTooltipBodLayer(l) && !gaMapUtils.isWMSLayer(l)) {
              layersToQuery.bodLayers.push(l);
            // INGRID: Check tooltip param
            } else if (gaMapUtils.isWMSLayer(l) && (gaLayers.hasTooltipBodLayer(l) || !l.bodId)) {
              layersToQuery.wmsLayers.push(l);
            }
          });
          return layersToQuery;
        };

        // Test if a feature is queryable.
        var isFeatureQueryable = function(feature) {
          // INGRID: Add 'bwastrid'
          return feature && feature.get('name') || feature.get('description') || feature.get('bwastrid');
        };

        // Find the first feature from a vector layer
        var findVectorFeature = function(map, pixel, vectorLayer) {
          var featureFound;
          map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            // vectorLayer is defined when a feature is clicked.
            // onclick
            if (layer) {
              if (!vectorLayer || vectorLayer == layer) {
                if (!featureFound) {
                  featureFound = feature;
                }
              }
            }
          });
          return featureFound;
        };

        // Change cursor style on mouse move, only on desktop
        var updateCursorStyle = function(map, pixel) {
          var feature;
          var hasQueryableLayer = false;
          if (!gaBrowserSniffer.msie || gaBrowserSniffer.msie > 10) {
            hasQueryableLayer = map.forEachLayerAtPixel(pixel,
              function() {
                return true;
              },
              undefined,
              function(layer) {
                // INGRID: Add check for crossOrigin
                return gaLayers.hasTooltipBodLayer(layer) && layer.getSource().crossOrigin;
              });
          }
          if (!hasQueryableLayer) {
            feature = findVectorFeature(map, pixel);
          }
          map.getTarget().style.cursor = (hasQueryableLayer || feature) ?
              'pointer' : '';
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
          var deregPointerMove;
          if (!gaBrowserSniffer.mobile) {
            deregPointerMove = map.on('pointermove', function(evt) {
              updateCursorStyleDebounced(map, evt.pixel);
            });
          }
          deregMapEvents = function() {
            deregMapClick();
            ol.Observable.unByKey(deregPointerMove);
            deregMapEvents = angular.noop;
          };
        };

        // Register leftclick event on globe
        var deregGlobeEvents = angular.noop;
        var registerGlobeEvents = function(scope, onClick) {
          if (deregGlobeEvents != angular.noop) {
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
                vector,
                vectorSource,
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

            // Destroy popup and highlight
            var initTooltip = function() {
               // Cancel all pending requests
              if (canceler) {
                canceler.resolve();
              }
              // Create new cancel object
              canceler = $q.defer();
              // htmls = [] would break the reference in the popup
              htmls.splice(0, htmls.length);
              if (popup) {
                popup.close();
              }

              // Clear the preview features
              gaPreviewFeatures.clear(map);

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
              if (active) {
                activate();
              } else {
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
              var pointerShown = (map.getTarget().style.cursor == 'pointer');
              var mapRes = map.getView().getResolution();
              var mapProj = map.getView().getProjection();
              var pixel = map.getPixelFromCoordinate(coordinate);
              var layersToQuery = getLayersToQuery(map);

              // When 3d is Active we use the cesium native function to get the
              // first queryable feature.
              if (is3dActive()) {
                var pickedObjects = scope.ol3d.getCesiumScene().
                    drillPick(position3d);
                for (var i = 0, ii = pickedObjects.length; i < ii; i++) {
                   var prim = pickedObjects[i].primitive;
                   if (isFeatureQueryable(prim.olFeature)) {
                     showVectorFeature(prim.olFeature, prim.olLayer);
                     break;
                   }
                }
              } else {
                // Go through queryable vector layers
                // Launch no requests.
                layersToQuery.vectorLayers.forEach(function(layerToQuery) {
                  var feature = findVectorFeature(map, pixel, layerToQuery);
                  if (feature) {
                    showVectorFeature(feature, layerToQuery);
                  }
                });
              }

              var all = []; // List of promises launched

              // Go through all queryable bod layers.
              // Launch identify requests.
              layersToQuery.bodLayers.forEach(function(layerToQuery) {
                var tol = scope.options.tolerance;
                var geometry = new ol.geom.Point(coordinate);
                var returnGeometry = !!gaLayers.getLayerProperty(
                    layerToQuery.bodId, 'highlightable');
                var limit = gaLayers.getLayerProperty(
                    layerToQuery.bodId, 'shop') ? 1 : null;
                all.push(gaIdentify.get(map, [layerToQuery], geometry, tol,
                    returnGeometry, canceler.promise, limit).then(
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
                var source = layerToQuery.getSource();
                var sourceCoord, sourceRes,
                    sourceProj = source.getProjection();
                if (sourceProj) { // auto reprojection
                  sourceRes = ol.reproj.calculateSourceResolution(sourceProj,
                      mapProj, coordinate, mapRes);
                  sourceCoord = ol.proj.transform(coordinate, mapProj,
                      sourceProj);
                }
                var url = source.getGetFeatureInfoUrl(
                    sourceCoord || coordinate,
                    sourceRes || mapRes,
                    sourceProj || mapProj,
                    // INGRID: Get 'text/html'
                    {'INFO_FORMAT': 'text/html'});
                if (!is3dActive() && url) {
                  url = gaGlobalOptions.ogcproxyUrl +
                      encodeURIComponent(url);
                  all.push($http.get(url, {
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
                  if (sum == 0 && pointerShown) {
                    showNoInfo();
                  }
                });
              }
            };

            // Highlight the features found
            var showFeatures = function(foundFeatures, coordinate,
                nohighlight) {
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
                    var layerId = value.get('layerId');
                    if (!featuresByLayerId[layerId]) {
                      featuresByLayerId[layerId] = {};
                    }
                    var feature = new ol.Feature(value.getGeometry());
                    feature.setId(value.getId());
                    feature.set('layerId', layerId);
                    gaPreviewFeatures.add(map, feature);
                    if (value.get('htmlpopup')) {
                      showPopup(value.get('htmlpopup'), value);
                    }
                    // Store the ol feature for highlighting
                    featuresByLayerId[layerId][feature.getId()] = feature;
                  } else {
                    if (!featuresByLayerId[value.layerBodId]) {
                      featuresByLayerId[value.layerBodId] = {};
                    }
                    //draw feature, but only if it should be drawn
                    if (!nohighlight &&
                        gaLayers.getLayer(value.layerBodId) &&
                        gaLayers.getLayerProperty(value.layerBodId,
                                                  'highlightable')) {
                      var features = parser.readFeatures(value);
                      for (var i = 0, ii = features.length; i < ii; ++i) {
                        features[i].set('layerId', value.layerBodId);
                        gaPreviewFeatures.add(map, features[i]);

                        // Store the ol feature for highlighting
                        featuresByLayerId[value.layerBodId][value.id] =
                            features[i];
                      }
                    }
                    var mapSize = map.getSize();
                    var mapExtent = map.getView().calculateExtent(mapSize);
                    var htmlUrl = scope.options.htmlUrlTemplate
                                  .replace('{Topic}', gaTopic.get().id)
                                  .replace('{Layer}', value.layerBodId)
                                  .replace('{Feature}', value.featureId);
                    $http.get(htmlUrl, {
                      timeout: canceler.promise,
                      params: {
                        lang: $translate.use(),
                        mapExtent: mapExtent.toString(),
                        coord: (coordinate) ? coordinate.toString() : undefined,
                        imageDisplay: mapSize.toString() + ',96'
                      }
                    }).success(function(html) {
                      showPopup(html, value);
                    });
                  }
                });
              }
            };

            // Create the html popup for a feature then display it.
            var showVectorFeature = function(feature, layer) {
              var htmlpopup =
                '<div id="{{id}}" class="htmlpopup-container">' +
                  '<div class="htmlpopup-header">' +
                    '<span>' + layer.label + ' &nbsp;</span>' +
                    '{{name}}' +
                  '</div>' +
                  '<div class="htmlpopup-content">' +
                    '{{descr}}' +
                  '</div>' +
                '</div>';
              var name = feature.get('name');
              var featureId = feature.getId();
              var layerId = feature.get('layerId') || layer.id;
              if (layer.get('type') == 'KML') {
                layerId = layer.label;
                if (name && name.length) {
                  featureId = name;
                }
              }
              var id = layerId + '#' + featureId;
              htmlpopup = htmlpopup.
                  replace('{{id}}', id).
                  replace('{{descr}}', feature.get('description') || '').
                  replace('{{name}}', (name) ? '(' + name + ')' : '');
              
              // INGRID: Add pop up for 'bwalocator'
              if(feature.get('bwastrid')){
                htmlpopup =
                  '<div id="{{id}}" class="htmlpopup-container">' +
                    '<div class="htmlpopup-header">' +
                      '<span>' + layer.label + ' &nbsp;</span>' +
                      '(BWaStr Locator)' +
                    '</div>' +
                    '<div class="htmlpopup-content">';
                htmlpopup += '<table><tbody>';
                htmlpopup += '<tr><td>Id:</td><td>' + feature.get('bwastrid') + '</td></tr>';
                htmlpopup += '<tr><td>Name:</td><td>' + feature.get('bwastr_name') + '</td></tr>';
                htmlpopup += '<tr><td>Bezeichnung:</td><td>' + feature.get('strecken_name') + '</td></tr>';
                if(feature.get('km_wert')){
                  htmlpopup += '<tr><td>KM:</td><td>' + feature.get('km_wert') + ' km</td></tr>';
                }else{
                  htmlpopup += '<tr><td>Von:</td><td>' + feature.get('km_von') + ' km</td></tr>';
                  htmlpopup += '<tr><td>Bis:</td><td>' + feature.get('km_bis') + ' km</td></tr>';
                }
                htmlpopup += '</tbody></table><br>';
                
                var csvContent = "data:text/csv;charset=utf-8,";
                
                var coords = feature.getGeometry().getCoordinates();
                var props = feature.getProperties();
                var measures = props.measures;
                
                var coordMeasures = [];
                var count = 0;
                if(measures.length == 1){
                  coordMeasures.push([coords[0]+"", coords[1]+"", measures[0]+""]);
                }else{
                  for(var j=0; j<coords.length;j++){
                    var coord = coords[j];
                    if(coord instanceof Array){
                      for(var k=0; k<coord.length;k++){
                        var coordinateEntry = coord[k];
                        var measure = "0";
                        if(measures[count]){
                          measure = measures[count];
                        }
                        coordMeasures.push([coordinateEntry[0]+"", coordinateEntry[1]+"", measure+""]);
                        count++;
                     }
                     coordMeasures.sort(function(a, b){
                       var measureA = a.measure;
                       var measureB = b.measure;
                       if(measureA < measureB) return -1;
                       if(measureA > measureB) return 1;
                         return 0;
                       });
                    }
                  }
                }
                coordMeasures.forEach(function(array, index){
                  var dataString = array.join(";");
                  csvContent += index < coordMeasures.length ? dataString+ "\n" : dataString;
                }); 
                
                var encodedUri = encodeURI(csvContent);
                var csvDownloadName = "";
                csvDownloadName += props.bwastrid;
                csvDownloadName += '-';
                csvDownloadName += props.bwastr_name;
                if(props.strecken_name){
                  csvDownloadName += "-";
                  csvDownloadName += props.strecken_name;
                }
                csvDownloadName += ".csv";
                
                htmlpopup += '<p><a href="' + encodedUri + '" download="' + csvDownloadName + '">Strecke als CSV</a></p>';
                htmlpopup += '</div>';
                htmlpopup += '</div>';
              }
              feature.set('htmlpopup', htmlpopup);
              if (!isFeatureQueryable(feature)) {
                feature.set('htmlpopup', undefined);
              }
              feature.set('layerId', layerId);
              showFeatures([feature]);

              // Iframe communication from inside out
              gaIFrameCom.send('gaFeatureSelection', {
                layerId: layerId,
                featureId: featureId
              });

              // We leave the old code to not break existing clients
              // Once they have adapted to new implementation, we
              // can remove the code below
              if (top != window) {
               if (featureId && layerId) {
                  window.parent.postMessage(id, '*');
                }
              }
            };

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
              popup.open(3000); //Close after 3 seconds
            };

            // Show the popup with all features informations
            var showPopup = function(html, value) {
              // Don't show popup when notooltip paramter is active
              if (gaPermalink.getParams().notooltip == 'true') {
                return;
              }

              // Show popup on first result
              if (htmls.length === 0) {

                //always reposition element when newly opened
                var x;
                if (!gaBrowserSniffer.mobile) {
                  x = function(element) {
                    return map.getSize()[0] -
                        parseFloat(element.css('max-width')) - 58;
                  };
                }
                if (!popup) {
                  popup = gaPopup.create({
                    className: 'ga-tooltip',
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
                      if (nbTooltips == 1) return;
                      var target = $(evt.currentTarget);
                      var containerId = target.find('.htmlpopup-container').
                          attr('id');
                      if (/#/.test(containerId)) {
                        var split = containerId.split('#');
                        var feat = featuresByLayerId[split[0]][split[1]];
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
              htmls.push({
                map: scope.map,
                feature: value,
                clickGeometry: new ol.geom.Point(scope.clickCoordinate),
                snippet: $sce.trustAsHtml(html)
              });
            };
          }
        };
      });
})();
