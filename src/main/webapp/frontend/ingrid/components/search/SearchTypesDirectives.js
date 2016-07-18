goog.provide('ga_search_type_directives');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_layermetadatapopup_service');
goog.require('ga_map_service');
goog.require('ga_marker_overlay_service');
goog.require('ga_previewfeatures_service');
goog.require('ga_previewlayers_service');
goog.require('ga_search_service');
goog.require('ga_topic_service');
goog.require('ga_urlutils_service');

(function() {

  var originToZoomLevel = {
    address: 10,
    parcel: 10,
    gazetteer: 10
  };

  // INGRID: Edit parseExtent for nominatim
  var parseExtent = function(stringBox2D, gaGlobalOptions) {
      var extentString = stringBox2D.split(" ");
      var extent = [];
      for(var entry in extentString){
          extent.push(parseFloat(extentString[entry]));
      }
      extent = ol.extent.applyTransform(extent, ol.proj.getTransform("EPSG:4326", gaGlobalOptions.defaultEpsg));
    return $.map(extent, parseFloat);
  };

  // INGRID: Edit addOverlay for nominatim
  var addOverlay = function(gaOverlay, map, res, gaGlobalOptions) {
    var visible = originToZoomLevel.hasOwnProperty(res.attrs.origin);
    if(res.attrs.geom_st_box2d){
        var extentString = res.attrs.geom_st_box2d.split(" ");
        var extent = [];
        for(var entry in extentString){
            extent.push(parseFloat(extentString[entry]));
        }
        var center = ol.extent.getCenter(ol.extent.applyTransform(extent, ol.proj.getTransform("EPSG:4326", gaGlobalOptions.defaultEpsg)));
        if(res.attrs.lon && res.attrs.lat){
            center = ol.proj.transform([parseFloat(res.attrs.lon), parseFloat(res.attrs.lat)], 'EPSG:4326', gaGlobalOptions.defaultEpsg);
        }
        gaOverlay.add(map,
                      center,
                      parseExtent(res.attrs.geom_st_box2d, gaGlobalOptions),
                      visible);
    }
  };

  var removeOverlay = function(gaOverlay, map) {
    gaOverlay.remove(map);
  };

  var listenerMoveEnd;
  var registerMove = function(gaOverlay, gaDebounce, map) {
    listenerMoveEnd = map.on('moveend', gaDebounce.debounce(function() {
      var zoom = map.getView().getZoom();
      gaOverlay.setVisibility(zoom);
    }, 200, false, false));
  };

  var unregisterMove = function() {
    if (listenerMoveEnd) {
      ol.Observable.unByKey(listenerMoveEnd);
      listenerMoveEnd = undefined;
    }
  };

  var tabStarts = [
    100000,
    200000,
    300000,
    // INGRID: Add tab starts
    400000
  ];

  var nextTabGroup = function(val) {
    for (var i = 0; i < tabStarts.length - 1; i++) {
      if (val >= tabStarts[i] &&
          val < tabStarts[i + 1]) {
        return tabStarts[i + 1];
      }
    }
    return undefined;
  };

  var prevTabGroup = function(val) {
    for (var i = tabStarts.length - 1; i > 0; i--) {
      if (val >= tabStarts[i]) {
        return tabStarts[i - 1];
      }
    }
    return undefined;
  };

  var focusElement = function(el, evt) {
    evt.preventDefault();
    el[0].focus();
  };

  var elExists = function(el) {
    if (el.length === 1 &&
        el[0].className.indexOf('ga-search-result') > -1) {
      return true;
    }
    return false;
  };

  var focusToElement = function(next, step, evt) {
    var newEl = undefined;
    if (next) {
      newEl = $(evt.target).nextAll('.ga-search-result').first();
    } else {
      newEl = $(evt.target).prevAll('.ga-search-result').first();
    }
    if (elExists(newEl)) {
      var existingEl = newEl;
      step -= 1;
      while (step > 0 && elExists(newEl)) {
        existingEl = newEl;
        step -= 1;
        if (next) {
          newEl = newEl.nextAll('.ga-search-result').first();
        } else {
          newEl = newEl.prevAll('.ga-search-result').first();
        }
      }
      focusElement(existingEl, evt);
    } else {
      focusToCategory(next, evt);
    }
  };

  var focusToCategory = function(next, evt) {
    var el = $(evt.target);
    if (el.length && el[0] && el[0].attributes && el[0].attributes.tabindex) {
      var jumpGroup;
      if (next) {
        jumpGroup = nextTabGroup(el[0].attributes.tabindex.value);
        while (jumpGroup) {
          var newEl = $('[tabindex=' + jumpGroup + ']');
          if (elExists(newEl)) {
            focusElement(newEl, evt);
            break;
          }
          jumpGroup = nextTabGroup(jumpGroup);
        }
      } else {
        jumpGroup = prevTabGroup(el[0].attributes.tabindex.value);
        while (jumpGroup) {
          var newEl = $('[tabindex=' + jumpGroup + ']');
          if (elExists(newEl)) {
            var existingEl = newEl;
            //Go to last element of category
            while (elExists(newEl)) {
              existingEl = newEl;
              jumpGroup += 1;
              newEl = $('[tabindex=' + jumpGroup + ']');
            }
            focusElement(existingEl, evt);
            return;
          }
          jumpGroup = prevTabGroup(jumpGroup);
        }
        //Nothing found, so jump back to input (ignore bad design...)
        var newEl = $('.ga-search-input');
        if (newEl.length === 1 &&
            newEl[0].className.indexOf('ga-search-input') > -1) {
          focusElement(newEl, evt);
        }
      }
    }
  };

  var module = angular.module('ga_search_type_directives', [
    'ga_browsersniffer_service',
    'ga_debounce_service',
    'ga_layermetadatapopup_service',
    'ga_map_service',
    'ga_marker_overlay_service',
    'ga_previewfeatures_service',
    'ga_previewlayers_service',
    'ga_search_service',
    'ga_urlutils_service',
    'pascalprecht.translate',
    'ga_topic_service'
  ]);

  /*
   * We have 3 distinct directives for each type of result
   * set (locations, features and layers)
   *
   * All 3 result directives share the same template and the
   * same controller code. Put anything that is common for
   * all 3 types in the controller code.
   *
   * Put type specific behaviour in the corresponding
   * directive's code.
   */

  // INGRID: Add parameter 'gaGlobalOptions'
  module.controller('GaSearchTypesController',
    function($scope, $http, $q, $sce, gaUrlUtils, gaSearchLabels,
             gaBrowserSniffer, gaMarkerOverlay, gaDebounce, gaGlobalOptions) {

      // This value is used to block blur/mouseleave event, when a value
      // is selected. See #2284. It's reinitialized when a new search is
      // triggered.
      var blockEvent = false;
      var canceler;

      var cancel = function() {
        $scope.results = [];
        $scope.fuzzy = '';
        if (canceler !== undefined) {
          canceler.resolve();
          canceler = undefined;
        }
      };

      var triggerSearch = gaDebounce.debounce(function() {
        if (!$scope.doSearch()) {
          $scope.options.announceResults($scope.type, 0);
          return;
        }

        canceler = $q.defer();

        // INGRID: Add search URL
        if($scope.searchUrl){
          var url = gaUrlUtils.append($scope.options.searchUrl,
                                      'type=' + $scope.type + '&searchUrl=' + $scope.searchUrl);
          url = $scope.typeSpecificUrl(url);
          $http.get(url, {
            cache: true,
            timeout: canceler.promise,
            // INGRID: Add search params
            params: $scope.searchParams
          }).success(function(data) {
            $scope.results = data.results;
            if (data.fuzzy) {
              $scope.fuzzy = '_fuzzy';
            }
            $scope.options.announceResults($scope.type, data.results.length);
          }).error(function(data, statuscode) {
            // If request is canceled, statuscode is 0 and we don't announce it
            if (statuscode !== 0) {
              $scope.options.announceResults($scope.type, 0);
            }
          });
        }
      }, 133, false, false);
      // 133 filters out 'stuck key' events while staying responsive

      $scope.doSearch = function() {
        return true;
      };

      $scope.typeSpecificUrl = function(url) {
        return url;
      };

      $scope.keydown = function(evt, res) {
        if (evt.keyCode == 13) {
          //Enter key
          $scope.removePreview();
          blockEvent = true;
          $scope.select(res);
        } else if (evt.keyCode == 9) {
          //Tab key
          focusToCategory(!evt.shiftKey, evt);
        } else if (evt.keyCode == 40 || evt.keyCode == 34) {
          //Down Arrow or PageDown key
          focusToElement(true, evt.keyCode == 40 ? 1 : 5, evt);
        } else if (evt.keyCode == 38 || evt.keyCode == 33) {
          //Up Arrow or PageUp key
          focusToElement(false, evt.keyCode == 38 ? 1 : 5, evt);
        }
      };

      $scope.click = function(res) {
        $scope.removePreview();
        blockEvent = true;
        $scope.select(res);
      };

      $scope.out = function(evt) {
        if (!blockEvent) {
          $scope.removePreview();
        }
      };

      $scope.preview = function(res) {
        if (gaBrowserSniffer.mobile) {
          return;
        }
        // INGRID: Add parameter 'gaGlobalOptions' to function
        addOverlay(gaMarkerOverlay, $scope.map, res, gaGlobalOptions);
      };

      $scope.removePreview = function() {
        if (gaBrowserSniffer.mobile) {
          return;
        }
        removeOverlay(gaMarkerOverlay, $scope.map);
      };

      $scope.prepareLabel = function(attrs) {
        var h = gaSearchLabels.highlight(attrs.label, $scope.options.query);
        return $sce.trustAsHtml(h);
      };

      $scope.cleanLabel = function(attrs) {
        return gaSearchLabels.cleanLabel(attrs.label);
      };

      $scope.fuzzy = '';

      $scope.$watch('options.searchUrl', function() {
        // cancel old requests
        cancel();
        if ($scope.options.query != '') {
          blockEvent = false;
          triggerSearch();
        } else {
          unregisterMove();
        }
      });
    }
  );

  // INGRID: Add parameter 'gaGlobalOptions'
  module.directive('gaSearchLocations',
      function($http, $q, $sce, $translate, gaUrlUtils, gaBrowserSniffer,
               gaMarkerOverlay, gaSearchLabels, gaMapUtils, gaDebounce, gaGlobalOptions) {
        return {
          restrict: 'A',
          templateUrl: 'components/search/partials/searchtypes.html',
          scope: {
            options: '=gaSearchLocationsOptions',
            map: '=gaSearchLocationsMap',
            ol3d: '=gaSearchLocationsOl3d'
          },
          controller: 'GaSearchTypesController',
          link: function($scope, element, attrs) {
            $scope.type = 'locations';
            $scope.tabstart = tabStarts[0];
            // INGRID: Add nominatim search URL
            $scope.searchUrl = $scope.options.searchNominatimUrl;

            // Can be removed onnce real type contains gazetter
            $scope.typeSpecificUrl = function(url) {
              return url.replace('type=locations', 'type=locations_preview');
            };

            $scope.select = function(res) {
              var isGazetteerPoly = false;
              // INGRID: Add parameter 'gaGlobalOptions'
              var e = parseExtent(res.attrs.geom_st_box2d, gaGlobalOptions);
              unregisterMove();
              //Gazetteer results that are not points zoom to full bbox extent
              if (res.attrs.origin == 'gazetteer') {
                isGazetteerPoly = (Math.abs(e[0] - e[2]) > 100 &&
                                   Math.abs(e[1] - e[3]) > 100);

              }
              var ol3d = $scope.ol3d;
              if (originToZoomLevel.hasOwnProperty(res.attrs.origin) &&
                  !isGazetteerPoly) {
                // INGRID: Change selection handling of nominatim
                var extentString = res.attrs.geom_st_box2d.split(" ");
                var extent = [];
                for(var entry in extentString){
                    extent.push(parseFloat(extentString[entry]));
                }
                var center = ol.extent.getCenter(ol.extent.applyTransform(extent, ol.proj.getTransform("EPSG:4326", gaGlobalOptions.defaultEpsg)));
                if(res.attrs.lon && res.attrs.lat){
                    center = ol.proj.transform([parseFloat(res.attrs.lon), parseFloat(res.attrs.lat)], 'EPSG:4326', gaGlobalOptions.defaultEpsg);
                }
                gaMapUtils.moveTo($scope.map, $scope.ol3d,
                    originToZoomLevel[res.attrs.origin],
                    center);
              } else {
                gaMapUtils.zoomToExtent($scope.map, $scope.ol3d, e);
              }
              // INGRID: Add parameter 'gaGlobalOptions'
              addOverlay(gaMarkerOverlay, $scope.map, res, gaGlobalOptions);
              $scope.options.valueSelected(
                  gaSearchLabels.cleanLabel(res.attrs.label));

              registerMove(gaMarkerOverlay, gaDebounce, $scope.map);
            };

            $scope.prepareLabel = function(attrs) {
              var l = gaSearchLabels.highlight(attrs.label,
                                                 $scope.options.query);
              if (attrs.origin == 'zipcode') {
                l = '<span>' + $translate.instant('plz') + ' ' + l +
                    '</span>';
              } else if (attrs.origin == 'kantone') {
                l = '<span>' + $translate.instant('ct') + ' ' + l +
                    '</span>';
              } else if (attrs.origin == 'district') {
                l = '<span>' + $translate.instant('district') + ' ' + l +
                    '</span>';
              } else if (attrs.origin == 'parcel') {
                l += ' <span>' + $translate.instant('parcel') + ' ' +
                     '</span>';
              }
              return $sce.trustAsHtml(l);
            };

          }
        };
      });

  module.directive('gaSearchFeatures',
      function($rootScope, $http, $q, $sce, $timeout, gaUrlUtils,
               gaLayerFilters, gaSearchLabels, gaLayers, gaBrowserSniffer,
               gaMarkerOverlay, gaPreviewFeatures, gaTopic) {

        var selectedFeatures = {};
        var loadGeometry = function(layerId, featureId, topic, urlbase, cb) {
          var key = layerId + featureId;
          if (!selectedFeatures.hasOwnProperty(key)) {
            var featureUrl = urlbase.replace('{Topic}', topic)
                .replace('{Layer}', layerId)
                .replace('{Feature}', featureId);
            $http.get(featureUrl, {
              params: {
                 geometryFormat: 'geojson'
              }
            }).success(function(result) {
              selectedFeatures[key] = result.feature;
              cb(result.feature);
            });
          } else {
            $timeout(function() {
              cb(selectedFeatures[key]);
            }, 0, false);
          }
        };

        return {
          restrict: 'A',
          templateUrl: 'components/search/partials/searchtypes.html',
          scope: {
            options: '=gaSearchFeaturesOptions',
            map: '=gaSearchFeaturesMap',
            ol3d: '=gaSearchFeaturesOl3d'
          },
          controller: 'GaSearchTypesController',
          link: function($scope, element, attrs) {
            var geojsonParser = new ol.format.GeoJSON();
            var searchableLayers = [];
            var timeEnabled = [];
            var timeStamps = [];

            $scope.type = 'featuresearch';
            $scope.tabstart = tabStarts[1];

            $scope.doSearch = function() {
              return searchableLayers.length > 0;
            };

            $scope.typeSpecificUrl = function(url) {
              var bbox = function(map) {
                var size = map.getSize();
                var view = map.getView();
                var bounds = view.calculateExtent(size);
                return bounds.join(',');
              };
              url = gaUrlUtils.append(url, 'bbox=' + bbox($scope.map));
              url = gaUrlUtils.append(url,
                                      'features=' + searchableLayers.join(','));
              url = gaUrlUtils.append(url,
                                      'timeEnabled=' + timeEnabled.join(','));
              return gaUrlUtils.append(url,
                                      'timeStamps=' + timeStamps.join(','));
            };

            $scope.select = function(res) {
              unregisterMove();
              loadGeometry(res.attrs.layer, res.attrs.featureId,
                           gaTopic.get().id,
                           $scope.options.featureUrl, function(f) {
                $rootScope.$broadcast('gaTriggerTooltipRequest', {
                  features: [f],
                  onCloseCB: angular.noop
                });
                var feature = geojsonParser.readFeature(f);
                gaPreviewFeatures.zoom($scope.map, $scope.ol3d, feature);
              });
              $scope.options.valueSelected(
                  gaSearchLabels.cleanLabel(res.attrs.label));
            };

            $scope.prepareLabel = function(attrs) {
              var l = gaSearchLabels.highlight(attrs.label,
                                                 $scope.options.query);
              if (attrs.origin == 'feature') {
                l = '<b>' +
                    gaLayers.getLayerProperty(attrs.layer, 'label') +
                    '</b><br>' + l;
              }
              return $sce.trustAsHtml(l);
            };


            $scope.layers = $scope.map.getLayers().getArray();
            $scope.searchableLayersFilter = gaLayerFilters.searchable;

            $scope.$watchCollection('layers | filter:searchableLayersFilter',
                function(layers) {
              //TODO: this isn't updated when layers param (like 'time') changes
              searchableLayers = [];
              timeEnabled = [];
              timeStamps = [];
              angular.forEach(layers, function(layer) {
                var ts = '';
                if (layer.time && layer.time.substr(0, 4) != '9999') {
                  ts = layer.time.substr(0, 4);
                }
                searchableLayers.push(layer.bodId);
                timeEnabled.push(layer.timeEnabled);
                timeStamps.push(ts);
              });
            });

          }
        };
      });
  
  // INGRID: Add parameter 'gaGlobalOptions'
  module.directive('gaSearchLayers',
      function($http, $q, $sce, gaUrlUtils, gaSearchLabels, gaBrowserSniffer,
               gaPreviewLayers, gaMapUtils, gaLayers, gaLayerMetadataPopup, gaGlobalOptions) {
        return {
          restrict: 'A',
          templateUrl: 'components/search/partials/searchtypes.html',
          scope: {
            options: '=gaSearchLayersOptions',
            map: '=gaSearchLayersMap'
          },
          controller: 'GaSearchTypesController',
          link: function($scope, element, attrs) {
            $scope.type = 'layers';
            $scope.tabstart = tabStarts[2];
            // INGRID: Change search URL for layer search
            $scope.searchUrl = location.protocol + '//' + location.host + '/ingrid-webmap-client/frontend/data/layers.json';

            $scope.preview = function(res) {
              if (gaBrowserSniffer.mobile) {
                return;
              }
              var layer = gaMapUtils.getMapOverlayForBodId($scope.map,
                                                           res.attrs.layer);

              // Don't add preview layer if the layer is already on the map
              if (!layer || !layer.visible) {
                gaPreviewLayers.addBodLayer($scope.map, res.attrs.layer);
              }
            };

            $scope.removePreview = function() {
              gaPreviewLayers.removeAll($scope.map);
            };

            $scope.select = function(res) {
              unregisterMove();
              var l = gaMapUtils.getMapOverlayForBodId($scope.map,
                                                       res.attrs.layer);
              if (!angular.isDefined(l)) {
                var olLayer = gaLayers.getOlLayerById(res.attrs.layer);
                $scope.map.addLayer(olLayer);
              } else {
                // Assure layer is visible
                l.visible = true;
              }
              $scope.options.valueSelected(
                  gaSearchLabels.cleanLabel(res.attrs.label));
            };

            $scope.getLegend = function(evt, bodId) {
              gaLayerMetadataPopup.toggle(bodId);
              evt.stopPropagation();
            };
            
            // INGRID: Add zoom to extent
            $scope.hasExtent = function(bodId) {
                var layer = gaLayers.getLayer(bodId)
                if(layer){
                  if(layer.extent){
                      return true;
                  }
                }
                return false;
            };
          }
        };
      });
  
  // INGRID: Add services search
  module.directive('gaSearchServices',
      function($http, $q, $sce, $translate, gaUrlUtils, gaSearchLabels, gaBrowserSniffer,
               gaPreviewLayers, gaMapUtils, gaLayers, gaLayerMetadataPopup, gaGlobalOptions, gaPopup, gaWms) {
        return {
          restrict: 'A',
          templateUrl: 'components/search/partials/searchtypes.html',
          scope: {
            options: '=gaSearchServicesOptions',
            map: '=gaSearchServicesMap'
          },
          controller: 'GaSearchTypesController',
          link: function($scope, element, attrs) {
            $scope.type = 'services';
            $scope.tabstart = tabStarts[3];
            // INGRID: Change search URL for service search
            $scope.searchUrl = $scope.options.searchServiceUrl;

            $scope.select = function(res) {
              unregisterMove();
              if(res.attrs.service){
                  var url = res.attrs.service;
                  if(url.indexOf("?") == -1){
                      url = url + "?";
                  }
                  if(url.toLowerCase().indexOf("request=getcapabilities") == -1){
                      if(url.endsWith("?") == false){
                          url = url + "&";
                      }
                      url = url + "REQUEST=GetCapabilities";
                  }
                  if(url.toLowerCase().indexOf("service=wms") == -1){
                      if(url.endsWith("?") == false){
                          url = url + "&";
                      }
                      url = url + "SERVICE=WMS";
                  }
                  gaWms.addWmsServiceToMap($scope.map, url);
                  
              }
            };
            
            $scope.getServiceInfo = function(evt, attrs) {
                if(attrs){
                    var content = "";
                    if(attrs.label){
                        content = content + '<h4>' + attrs.label + '</h4><br>';
                    }
                    if(attrs.detail){
                        content = content + '<p>' + attrs.detail + '</p><br>';
                    }
                    content = content + '<form class="form-horizontal" ng-class="{ie: isIE}" >';
                    if(attrs.link){
                        content = content + '<div class="form-group">';
                        content = content + '<label class="col-xs-4 control-label">' + $translate.instant('detail_more_info') + '</label>';
                        content = content + '<div class="col-xs-8"><a target="_blank" href="' + attrs.link + '">' + attrs.link + '</a></div>';
                        content = content + '</div>';
                    }
                    if(attrs.service){
                        var url = attrs.service;
                        if(url.indexOf("?") == -1){
                            url = url + "?";
                        }
                        if(url.toLowerCase().indexOf("request=getcapabilities") == -1){
                            if(url.endsWith("?") == false){
                                url = url + "&";
                            }
                            url = url + "REQUEST=GetCapabilities";
                        }
                        if(url.toLowerCase().indexOf("service=wms") == -1){
                            if(url.endsWith("?") == false){
                                url = url + "&";
                            }
                            url = url + "SERVICE=WMS";
                        }
                        content = content + '<div class="form-group">';
                        content = content + '<label class="col-xs-4 control-label">' + $translate.instant('detail_capabilities_url') + '</label>';
                        content = content + '<div class="col-xs-8"><a target="_blank" href="' + url + '">' + url + '</a></div>';
                        content = content + '</div>';
                    }
                    if(attrs.isoxml){
                        content = content + '<div class="form-group">';
                        content = content + '<label class="col-xs-4 control-label">' + $translate.instant('detail_iso_xml') + '</label>';
                        content = content + '<div class="col-xs-8"><a target="_blank" href="' + attrs.isoxml + '">' + attrs.isoxml + '</a></div>';
                        content = content + '</div>';
                    }
                    content = content + '</form>';
                    
                    var popup = gaPopup.create({
                        title: $translate.instant('metadata_window_title'),
                        destroyOnClose: true,
                        content: content,
                        className: '',
                        x: 400,
                        y: 200,
                        showPrint: true
                      });
                    popup.open();
                }
                evt.stopPropagation();
            };

          }
        };
      });

//INGRID: Add Bwa locator search
  module.directive('gaSearchBwaLocator',
      function($http, $q, $sce, $translate, gaUrlUtils, gaSearchLabels, gaBrowserSniffer,
               gaPreviewLayers, gaMapUtils, gaLayers, gaLayerMetadataPopup, gaGlobalOptions, gaPopup, gaWms, gaDefinePropertiesForLayer) {
        return {
          restrict: 'A',
          templateUrl: 'components/search/partials/searchtypes_bwalocator.html',
          scope: {
            options: '=gaSearchBwaLocatorOptions',
            map: '=gaSearchBwaLocatorMap'
          },
          controller: 'GaSearchTypesController',
          link: function($scope, element, attrs) {
              
            var bwaLocatorLayerFull = null;
            var bwaLocatorID = ""; 
            var bwaLocatorFrom = "";
            var bwaLocatorTo = "";
            var bwaLocatorDistance = "";
            var bwaLocatorPopUp = "";
            
            var featureSelect = new ol.interaction.Select();
            $scope.map.addInteraction(featureSelect);
            
            $scope.type = 'bwalocator';
            $scope.tabstart = tabStarts[4];
            // INGRID: Change search URL for bwa locator search
            $scope.searchUrl = $scope.options.searchBwaLocatorUrl;

            $scope.prepareLabel = function(attrs) {
              var l = gaSearchLabels.highlight(attrs.label, $scope.options.query);
              updateBWaLocatorData(attrs);
              return $sce.trustAsHtml(l);
            };
              
            $scope.map.on('singleclick', function(evt) {
                var feature = $scope.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                    return feature;
                });

                if (feature) {
                    var coords = feature.getGeometry().getCoordinates();
                    var props = feature.getProperties();
                    var measures = props.measures;
                    
                    var info = '<table><tbody>';
                    info += '<tr><td>Id</td><td>' + props.bwastrid + '</td></tr>';
                    info += '<tr><td>Name</td><td>' + props.bwastr_name + '</td></tr>';
                    info += '<tr><td>Bezeichnung</td><td>' + props.strecken_name + '</td></tr>';
                    if(props.km_wert){
                      info += '<tr><td>KM:</td><td>' + props.km_wert + ' km</td></tr>';
                    }else{
                      info += '<tr><td>Von:</td><td>' + props.km_von + ' km</td></tr>';
                      info += '<tr><td>Bis:</td><td>' + props.km_bis + ' km</td></tr>';
                    }
                    info += '<tr><td><br></td></tr>';
                    
                    var csvContent = "data:text/csv;charset=utf-8,";
                    
                    
                    var coordMeasures = [];
                    var count = 0;
                    for(var j=0; j<coords.length;j++){
                        var coord = coords[j];
                        if(coord instanceof Array){
                            for(var k=0; k<coord.length;k++){
                                var coordinateEntry = coord[k];
                                var measure = "0";
                                if(measures[count]){
                                    measure = measures[count];
                                }
                                coordMeasures.push([coordinateEntry[0]+"", coordinateEntry[1]+"", measure+""    ]);
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
                    
                    info += '<tr><td><a href="' + encodedUri + '" download="' + csvDownloadName + '">Strecke als CSV</a></td></tr>';
                    info += '</tbody></table>';
                    info += '<br>';
                    
                    if(bwaLocatorPopUp){
                        bwaLocatorPopUp.close();
                    }
                    
                    bwaLocatorPopUp = gaPopup.create({
                        title: 'BWaStr Locator',
                        destroyOnClose: true,
                        content: info,
                        className: '',
                        x: evt.pixel[0],
                        y: evt.pixel[1],
                        showPrint: true
                      });
                    bwaLocatorPopUp.open();
                }
            });
            
            function updateBWaLocatorData(attrs){
              if(attrs){
                $scope.bwalocator_from_id = attrs.bwastrid + "_bwalocator_from";
                $scope.bwalocator_from_placeholder = attrs.km_von;
                $scope.bwalocator_to_id = attrs.bwastrid + "_bwalocator_to";
                $scope.bwalocator_to_placeholder = attrs.km_bis;
                $scope.bwalocator_distance_id = attrs.bwastrid + "_bwalocator_distance";
                $scope.bwalocator_distance_placeholder = 0;
              }
            }
           
            function clearBWaSelectionInfos (){
                if(bwaLocatorPopUp){
                  bwaLocatorPopUp.close();
                }
                if(featureSelect){
                  featureSelect.getFeatures().clear();
                }
            }
            
            $scope.select = function(res) {
              unregisterMove();
              
              var inputValueFrom = $("#" + res.id + "_bwalocator_from").val().trim();
              var inputValueTo = $("#" + res.id + "_bwalocator_to").val().trim();
              var inputValueDistance = $("#" + res.id + "_bwalocator_distance").val().trim();
              var hasBwaLocatorLayer = false;
              var layerBwaLocator = []
              var layers = $scope.map.getLayers().getArray();
              for (var i = 0; i < layers.length; i++) {
                  var layer = layers[i];
                  if(layer.get("bwalocator") || layer.get("bwalocatorshort")){
                    hasBwaLocatorLayer = true;
                    layerBwaLocator.push(layer);
                  }
              }
              if(bwaLocatorID != res.id || hasBwaLocatorLayer == false){
                for (var i = 0; i < layerBwaLocator.length; i++) {
                    var layer = layerBwaLocator[i];
                    if(layer.get("bwalocator") || layer.get("bwalocatorshort")){
                      $scope.map.removeLayer(layer);
                    }
                }
                clearBWaSelectionInfos();
                selectBWaLocatorData(res, true);
                bwaLocatorID = res.id;
                bwaLocatorFrom = "";
                bwaLocatorTo = "";
                bwaLocatorDistance = "";
              }
              
              if(((bwaLocatorFrom != inputValueFrom) && inputValueFrom != "")
                      || ((bwaLocatorTo != inputValueTo) && inputValueTo != "")
                      || ((bwaLocatorDistance != inputValueDistance) && inputValueDistance != "")){
                  for (var i = 0; i < layerBwaLocator.length; i++) {
                      var layer = layerBwaLocator[i];
                      if(layer.get("bwalocatorshort")){
                        $scope.map.removeLayer(layer);
                      }
                  }
                  clearBWaSelectionInfos();
                  selectBWaLocatorData(res);
              }
              bwaLocatorFrom = inputValueFrom;
              bwaLocatorTo = inputValueTo;
              bwaLocatorDistance = inputValueDistance;
            };
            
            function selectBWaLocatorData(res, full){
              if(res){
                  var inputBwaLocatorFrom = $("#" + res.id + "_bwalocator_from").val();
                  var inputBwaLocatorTo = $("#" + res.id + "_bwalocator_to").val();
                  var inputBwaLocatorDistance = $("#" + res.id + "_bwalocator_distance").val();
                  
                  var content = '{'
                      + '"limit":200,'
                      + '"queries":['
                      + '{'
                      + '"qid":1,'
                      + '"bwastrid":"'+ res.attrs.bwastrid +'",'
                      + '"stationierung":{';
                  if(((inputBwaLocatorFrom == "" || inputBwaLocatorFrom == undefined) 
                      && (inputBwaLocatorTo == "" || inputBwaLocatorTo == undefined) 
                      && (inputBwaLocatorDistance == "" || inputBwaLocatorDistance == undefined))
                      || full){
                      content = content + '"km_von":'+ res.attrs.km_von;
                      content = content + ',';
                      content = content + '"km_bis":'+ res.attrs.km_bis;
                  }else{
                      
                      if((inputBwaLocatorFrom != "" && inputBwaLocatorFrom != undefined)
                          && (inputBwaLocatorTo == "" || inputBwaLocatorTo == undefined)){
                          content = content + '"km_wert":'+ inputBwaLocatorFrom;
                      }else{
                          if(inputBwaLocatorFrom != "" && inputBwaLocatorFrom != undefined){
                              content = content + '"km_von":'+ inputBwaLocatorFrom;
                          }
                          
                          if(inputBwaLocatorTo != "" && inputBwaLocatorTo != undefined){
                              if((inputBwaLocatorFrom == "" || inputBwaLocatorFrom == undefined)){
                                  content = content + '"km_von":'+ res.attrs.km_von;
                              }
                              content = content + ',';
                              content = content + '"km_bis":'+ inputBwaLocatorTo;
                          }
                      }
                      
                      if(inputBwaLocatorDistance != "" && inputBwaLocatorDistance != undefined){
                          if((inputBwaLocatorFrom == "" || inputBwaLocatorFrom == undefined)){
                              content = content + '"km_von":'+ res.attrs.km_von;
                              content = content + ',';
                          }
                          if((inputBwaLocatorTo == "" || inputBwaLocatorTo == undefined)){
                              content = content + '"km_bis":'+ res.attrs.km_bis;
                              content = content + ',';
                          }
                          content = content + ',';
                          content = content + '"offset":'+ inputBwaLocatorDistance;
                      }
                  }
                  content = content + '},'
                      + '"spatialReference":{'
                      + '"wkid":3857'
                      + '}'
                      + '}'
                      + ']'
                      + '}';
                  
                  $http.get('/ingrid-webmap-client/rest/jsonCallback/queryPost?', {
                    params: {
                     'url':  gaGlobalOptions.searchBwaLocatorGeoUrl,
                     'data': content
                    }
                  }).success(function(response) {
                      drawBWaLocatorData(response, full);
                  }).error(function() {
                });
              }
            }
            
            function drawBWaLocatorData (response, full){
                var data = response.result[0];
                if(data){
                    var geometry = data.geometry;
                    if(geometry){
                        var geojsonObject = {
                                'type': 'FeatureCollection',
                                'crs': {
                                  'type': 'name',
                                  'properties': {
                                    'name': 'EPSG:3857'
                                  }
                                },
                                'features': [{
                                  'type': 'Feature',
                                  'geometry': {
                                    'type': geometry.type,
                                    'coordinates': geometry.coordinates
                                  },
                                  'properties': {
                                    'bwastrid': data.bwastrid,
                                    'bwastr_name': data.bwastr_name,
                                    'strecken_name': data.strecken_name,
                                    'km_von': data.stationierung.km_von,
                                    'km_bis': data.stationierung.km_bis,
                                    'km_wert': data.stationierung.km_wert,
                                    'measures': geometry.measures
                                  }
                                }]
                              };
                        var vectorSource = new ol.source.Vector({
                            features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
                          });
                        var layerLabel = data.bwastrid + ' ' + data.bwastr_name;
                        if(data.strecken_name){
                          layerLabel += ' ' + data.strecken_name;
                        }
                        if(full){
                            bwaLocatorLayerFull = new ol.layer.Vector({
                                source: vectorSource,
                                bwalocator:true,
                                visible: true,
                                style: new ol.style.Style({
                                    stroke: new ol.style.Stroke({
                                        color: 'red',
                                        width: 2
                                      })
                                    })
                              });
                            gaDefinePropertiesForLayer(bwaLocatorLayerFull);
                            bwaLocatorLayerFull.label = layerLabel;
                            bwaLocatorLayerFull.type = 'KML';
                            $scope.map.addLayer(bwaLocatorLayerFull);
                         }else{
                            var bwaLocatorLayerShort = new ol.layer.Vector({
                                source: vectorSource,
                                visible: true,
                                bwalocator:true,
                                bwalocatorshort:true,
                                style: new ol.style.Style({
                                    stroke: new ol.style.Stroke({
                                        color: 'blue',
                                        width: 2
                                      })
                                    })
                              });
                            gaDefinePropertiesForLayer(bwaLocatorLayerShort);
                            bwaLocatorLayerShort.label = layerLabel + '(Abschnitt)';
                            bwaLocatorLayerShort.type = 'KML';
                            $scope.map.addLayer(bwaLocatorLayerShort);
                        }
                        $scope.map.getView().fit(vectorSource.getExtent(), $scope.map.getSize());
                    }
                }
            }
            
            // Toggle layer tools for small screen
            element.on('click', '.fa-gear', function() {
              var li = $(this).closest('li');
              li.toggleClass('ga-layer-folded');
              $(this).closest('ul').find('li').each(function(i, el) {
                if (el != li[0]) {
                  $(el).addClass('ga-layer-folded');
                }
              });
            });
          }
        };
      });
})();
