goog.provide('ga_contextpopup_directive');

goog.require('ga_event_service');
goog.require('ga_networkstatus_service');
goog.require('ga_permalink');
goog.require('ga_reframe_service');
goog.require('ga_what3words_service');
goog.require('ga_window_service');

(function() {

  var module = angular.module('ga_contextpopup_directive', [
    'ga_event_service',
    'ga_networkstatus_service',
    'ga_permalink',
    'ga_reframe_service',
    'ga_window_service',
    'ga_what3words_service',
    'pascalprecht.translate'
  ]);

  // INGRID: Add 'gaUrlUtils'
  module.directive('gaContextPopup',
      function($http, $q, $timeout, $window, $rootScope, gaBrowserSniffer,
          gaNetworkStatus, gaPermalink, gaGlobalOptions, gaLang, gaWhat3Words,
          gaReframe, gaEvent, gaWindow, gaUrlUtils) {
        return {
          restrict: 'A',
          replace: true,
          templateUrl: 'components/contextpopup/partials/contextpopup.html',
          scope: {
            map: '=gaContextPopupMap',
            options: '=gaContextPopupOptions',
            is3dActive: '=gaContextPopupIs3d'
          },
          link: function(scope, element, attrs) {
            var heightUrl = scope.options.heightUrl;
            var qrcodeUrl = scope.options.qrcodeUrl;
            var startPixel, holdPromise, isPopoverShown = false;
            var reframeCanceler = $q.defer();
            var heightCanceler = $q.defer();
            var map = scope.map;
            var view = map.getView();
            // INGRID: Change 'coord21781' to 'coordDefault'
            var coordDefault, coord4326;
            // INGRID: Add BwaStrLocator
            var bwaLocatorUrl = scope.options.bwaLocatorUrl;

            // INGRID: Add tabs
            scope.currentTab = 1;
            // INGRID: Enable w3w
            scope.enableW3W = gaGlobalOptions.enableW3W;

            // Tabs management stuff
            scope.activeTab = function(numTab) {
              scope.currentTab = numTab;
            };
            scope.getTabClass = function(numTab) {
              return (numTab === scope.currentTab) ? 'active' : '';
            };

            var overlay = new ol.Overlay({
              element: element[0],
              stopEvent: true
            });
            map.addOverlay(overlay);

            // INGRID: Add 'showBWaStrLocator'
            scope.showBWaLocator = function() {
                if (gaGlobalOptions.searchBwaLocatorStationUrl) {
                    return true;
                }
                return false;
            };

            var formatCoordinates = function(coord, prec, ignoreThousand) {
              var fCoord = ol.coordinate.toStringXY(coord, prec);
              if (!ignoreThousand) {
                fCoord = fCoord.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              }
              return fCoord;
            };

            var coordinatesFormatUTM = function(coordinates, zone) {
              var coord = ol.coordinate.toStringXY(coordinates, 0).
                  replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              return coord + ' ' + zone;
            };

            var updateW3W = function() {
              gaWhat3Words.getWords(coord4326[1],
                                    coord4326[0]).then(function(res) {
                scope.w3w = res;
              }, function(response) {
                if (response.status != -1) { // Error
                  scope.w3w = '-';
                }
              });
            };

            var cancelRequests = function() {
              // Cancel last requests
              heightCanceler.resolve();
              reframeCanceler.resolve();
              heightCanceler = $q.defer();
              reframeCanceler = $q.defer();
              gaWhat3Words.cancel();
            };

            var handler = function(event) {
              if (scope.is3dActive) {
                return;
              }
              event.stopPropagation();
              event.preventDefault();

              //On Mac, left-click with ctrlKey also fires
              //the 'contextmenu' event. But this conflicts
              //with selectByRectangle feature (in featuretree
              //directive). So we bail out here if
              //ctrlKey is pressed
              if (event.ctrlKey) {
                return;
              }

              var pixel = (event.originalEvent) ?
                  map.getEventPixel(event.originalEvent) :
                  event.pixel;
              // INGRID: Change 'coord21781' to 'coordDefault'
              coordDefault = (event.originalEvent) ?
                  map.getEventCoordinate(event.originalEvent) :
                  event.coordinate;
              // INGRID: Change 'coord21781' to 'coordDefault'
              coord4326 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:4326');
              var coord2056 = ol.proj.transform(coordDefault,
                  gaGlobalOptions.defaultEpsg, 'EPSG:2056');
              // INGRID: Add coordinates
              var coord3857 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:3857');
              var coord31466 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31466');
              var coord31467 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31467');
              var coord31468 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31468');
              var coord31469 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:31469');
              var coord25832 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:25832');
              var coord25833 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:25833');
              var coord2166 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:2166');
              var coord2167 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:2167');
              var coord2168 = ol.proj.transform(coord4326,
                  'EPSG:4326', 'EPSG:2168');

              // INGRID: Change 'coord21781' to 'coordDefault'
              // and format coordDefault
              scope.coordDefault = ol.coordinate.format(coordDefault,
                '{y}, {x}', 2);
              scope.coord4326 = ol.coordinate.format(coord4326, '{y}, {x}', 5);
              var coord4326String = ol.coordinate.toStringHDMS(coord4326, 3).
                                   replace(/ /g, '');
              scope.coordiso4326 = coord4326String.replace(/N/g, 'N ');
              scope.coord2056 = formatCoordinates(coord2056, 2) + ' *';
              if (coord4326[0] < 6 && coord4326[0] >= 0) {
                var utm_31t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32631');
                scope.coordutm = coordinatesFormatUTM(utm_31t, '(zone 31T)');
              } else if (coord4326[0] < 12 && coord4326[0] >= 6) {
                var utm_32t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32632');
                scope.coordutm = coordinatesFormatUTM(utm_32t, '(zone 32T)');
              } else {
                  // INGRID: Remove return '-'
                  // return '-';
              }
              var projections = [{
                value: 'EPSG:3857',
                label: 'Mercator (Breite/Länge)',
                coordinates: ol.coordinate.format(coord3857,
                  '{y}, {x}', 2)
              }, {
                value: 'EPSG:4326',
                label: 'WGS 84 (Breite/Länge)',
                coordinates: ol.coordinate.format(coord4326,
                  '{y}, {x}', 5)
              }, {
                value: 'EPSG:31466',
                label: 'GK2 - DHDN (R, H)',
                coordinates: ol.coordinate.format(coord31466,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:31467',
                label: 'GK3 - DHDN (R, H)',
                coordinates: ol.coordinate.format(coord31467,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:31468',
                label: 'GK4 - DHDN (R, H)',
                coordinates: ol.coordinate.format(coord31468,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:31469',
                label: 'GK5 - DHDN (R, H)',
                coordinates: ol.coordinate.format(coord31469,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:25832',
                label: 'UTM 32N - ETRS89 (E, N)',
                coordinates: ol.coordinate.format(coord25832,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:25833',
                label: 'UTM 33N - ETRS89 (E, N)',
                coordinates: ol.coordinate.format(coord25832,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:2166',
                label: 'GK3 - S42/83 (R, H)',
                coordinates: ol.coordinate.format(coord2166,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:2167',
                label: 'GK4 - S42/83 (R, H)',
                coordinates: ol.coordinate.format(coord2167,
                  '{x}, {y}', 2)
              }, {
                value: 'EPSG:2168',
                label: 'GK5 - S42/83 (R, H)',
                coordinates: ol.coordinate.format(coord2168,
                  '{x}, {y}', 2)
              }];
              var sortProjections = [];
              for (var gp in gaGlobalOptions.defaultMouseProjections) {
                var gaProj = gaGlobalOptions.defaultMouseProjections[gp];
                for (var p in projections) {
                  var proj = projections[p];
                  if (gaProj === proj.value) {
                    sortProjections.push(proj);
                    break;
                  }
                }
              }
              scope.projections = sortProjections;

              coord4326['lon'] = coord4326[0];
              coord4326['lat'] = coord4326[1];
              scope.coordmgrs = $window.proj4.mgrs.forward(coord4326).
                  replace(/(.{5})/g, '$1 ');

              // A digest cycle is necessary for $http requests to be
              // actually sent out. Angular-1.2.0rc2 changed the $evalSync
              // function of the $rootScope service for exactly this. See
              // Angular commit 6b91aa0a18098100e5f50ea911ee135b50680d67.
              // We use a conservative approach and call $apply ourselves
              // here, but we instead could also let $evalSync trigger a
              // digest cycle for us.
              scope.$applyAsync(function() {

                /* INGRID: Disable height
                $http.get(heightUrl, {
                  params: {
                    easting: coord21781[0],
                    northing: coord21781[1],
                    elevation_model: gaGlobalOptions.defaultElevationModel
                  },
                  timeout: heightCanceler.promise
                }).then(function(response) {
                  scope.altitude = parseFloat(response.data.height);
                }, function(response) {
                  if (response.status != -1) { // Error
                    scope.altitude = '-';
                  }
                });

                gaReframe.get03To95(coord21781,
                    reframeCanceler.promise).then(function(coords) {
                  coord2056 = coords;
                  scope.coord2056 = formatCoordinates(coord2056, 2);
                });
                */
                updateW3W();
              });

              updatePopupLinks();

              // INGRID: Add get 'BWaStrLocator' data
              if (gaGlobalOptions.searchBwaLocatorStationUrl) {
                  getBWaLocatorData();
              }

              if (gaWindow.isWidth('xs') || gaWindow.isHeight('xs')) {
                view.animate({
                  // INGRID: Change 'coord21781' to 'coordDefault'
                  center: coordDefault,
                  duration: 200
                }, hidePopoverOnNextChange);

              } else {
                hidePopoverOnNextChange();
              }

              // INGRID: Change 'coord21781' to 'coordDefault'
              overlay.setPosition(coordDefault);
              element.show();
              // We use a boolean instead of  jquery .is(':visible') selector
              // because that doesn't work with phantomJS.
              isPopoverShown = true;
            };


            if ('oncontextmenu' in $window) {
              $(map.getViewport()).on('contextmenu', function(event) {
                if (isPopoverShown) {
                  scope.hidePopover();
                }
                $timeout.cancel(holdPromise);
                startPixel = undefined;
                handler(event);
              });
              element.on('contextmenu', 'a', function(e) {
                e.stopPropagation();
              });
            }

            // IE manage contextmenu event also with touch so no need to add
            // pointers events too.
            if (!gaBrowserSniffer.msie) {
              // On touch devices and browsers others than ie10, display the
              // context popup after a long press (300ms)
              map.on('pointerdown', function(event) {
                if (gaEvent.isMouse(event)) {
                  return;
                }
                $timeout.cancel(holdPromise);
                startPixel = event.pixel;
                holdPromise = $timeout(function() {
                  handler(event);
                }, 300, false);
              });
              map.on('pointerup', function(event) {
                if (gaEvent.isMouse(event)) {
                  return;
                }
                $timeout.cancel(holdPromise);
                startPixel = undefined;
              });
              map.on('pointermove', function(event) {
                if (gaEvent.isMouse(event)) {
                  return;
                }
                if (startPixel) {
                  var pixel = event.pixel;
                  var deltaX = Math.abs(startPixel[0] - pixel[0]);
                  var deltaY = Math.abs(startPixel[1] - pixel[1]);
                  if (deltaX + deltaY > 6) {
                    $timeout.cancel(holdPromise);
                    startPixel = undefined;
                  }
                }
              });
            }

            $rootScope.$on('$translateChangeEnd', function() {
              if (isPopoverShown) {
                updateW3W();
              }
            });

            // Listen to permalink change events from the scope.
            scope.$on('gaPermalinkChange', function(event) {
              // INGRID: Change 'coord21781' to 'coordDefault'
              if (angular.isDefined(coordDefault) && isPopoverShown) {
                updatePopupLinks();
              }
            });

            scope.hidePopover = function(evt) {
              if (evt) {
                evt.stopPropagation();
              }
              cancelRequests();
              element.hide();
              isPopoverShown = false;
            };

            function hidePopoverOnNextChange() {
              view.once('change:center', scope.hidePopover);
            }

            function updatePopupLinks() {
              var p = {
                // INGRID: Change 'coord21781' to 'coordDefault'
                X: Math.round(coordDefault[1], 1),
                Y: Math.round(coordDefault[0], 1)
              };

              // INGRID: Create href with portal layout
              scope.contextPermalink = gaPermalink.getHref(p,
                gaGlobalOptions.isParentIFrame);
              scope.crosshairPermalink = gaPermalink.getHref(
                  angular.extend({crosshair: 'marker'}, p));

              scope.qrcodeUrl = null;
              if (!gaNetworkStatus.offline && gaWindow.isWidth('>=s') &&
                  gaWindow.isHeight('>s')) {
                  gaUrlUtils.shorten(scope.contextPermalink).
                    then(function(shortUrl) {
                    // INGRID: Return href if no shorturl exists
                    var url = shortUrl ? shortUrl :
                        scope.contextPermalink;
                    scope.qrcodeUrl = qrcodeUrl + '?url=' +
                        escape(url);
                  });
              }
            }

            // INGRID: Get 'BWaStrLocator' data
            function getBWaLocatorData() {
              scope.bwastr_id = undefined;
              scope.bwastr_name = undefined;
              scope.bwastr_typ = undefined;
              scope.bwastr_lon = undefined;
              scope.bwastr_lat = undefined;
              scope.bwastr_km = undefined;
              scope.bwastr_distance = undefined;
              scope.bwastr_error = undefined;

              var p = {
                // INGRID: Change 'coord21781' to 'coordDefault'
                X: Math.round(coordDefault[1], 1),
                Y: Math.round(coordDefault[0], 1)
              };
              var content = '';
              content = '{"limit":200,"queries":[' +
                '{"qid":1,"geometry":{"type":"Point","coordinates":[' +
                p.Y +
                ',' +
                p.X +
                '],"spatialReference":{"wkid":' +
                gaGlobalOptions.defaultEpsg.split(':')[1] + '}}}' +
                ']}';

              $http.get(bwaLocatorUrl + '&data=' + content, {
                  params: {
                    'url': gaGlobalOptions.searchBwaLocatorStationUrl,
                    'data': content
                  }
                }).then(function(response) {
                    updateBWaLocatorData(response);
                });
            }

            function updateBWaLocatorData(response) {
                var result = response.data.result[0];
                if (result) {
                    if (result.error == undefined) {
                        scope.bwastr_id = result.bwastrid;
                        scope.bwastr_name = result.bwastr_name;
                        scope.bwastr_typ = result.strecken_name;
                        scope.bwastr_lon = result.geometry.coordinates[0];
                        scope.bwastr_lat = result.geometry.coordinates[1];
                        scope.bwastr_km = result.stationierung.km_wert;
                        scope.bwastr_distance = result.stationierung.offset;
                    } else {
                        scope.bwastr_error = result.error.message;
                    }
                }
            }
          }
        };
      });
})();
